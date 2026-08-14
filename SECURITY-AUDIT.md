# 🔐 Audit de sécurité — Intégration paiement SmartSchool SN

> Audit réalisé le 2026-06-02 sur le commit `182b4b6`.
> Périmètre : chaîne de paiement complète (initiation → PSP → webhook → facture),
> plus les surfaces API adjacentes qui engagent de l'argent ou des données personnelles.

---

## 📊 Synthèse

| Sévérité | Nombre | État |
|---|---|---|
| 🔴 Critique | 4 | Corrigé |
| 🟠 Élevée | 8 | Corrigé |
| 🟡 Moyenne | 5 | Corrigé |

**Constat principal :** sur 29 routes API, **2 seulement** vérifiaient l'authentification.
Le proxy (`src/proxy.ts`) ne protège que les préfixes de *pages* (`/admin`, `/parent`, …) —
`/api/*` n'est couvert par aucune règle, donc toutes les routes API étaient joignables
sans session.

---

## 🔴 CRITIQUE

### SS-01 — Fraude au paiement : scolarité gratuite en une requête
**Fichier :** `src/app/api/paiements/initier/route.ts`

La branche `methode === 'especes'` porte le commentaire « admin uniquement » mais
n'effectue **aucun contrôle d'authentification ni de rôle**. Elle insère directement
un paiement `statut_confirmation: 'confirmed'` avec un montant fourni par le client
(`montant_verse`).

Le trigger `fn_update_facture_statut()` recalcule alors `factures.statut` et bascule
la facture en `paye` dès que la somme des paiements confirmés atteint `montant_total`.

**Chaîne d'exploitation :**
```
POST /api/paiements/initier
{ "facture_id": "<uuid>", "methode": "especes",
  "montant_verse": 999999, "reference_recu": "X" }
→ paiement confirmé inséré → facture marquée « payée »
```

La policy RLS `ecole_isolation` (`ecole_id = my_ecole_id()`) bloque un attaquant
totalement anonyme, mais elle est **à portée établissement, pas à portée parent** :
n'importe quel compte légitime de l'école (un parent, un élève) satisfait la condition
et peut solder **n'importe quelle facture de son établissement**, y compris la sienne.

**Correctif :** authentification obligatoire, `especes` réservé aux rôles
`admin_global`/`intendant`/`secretaire`, montant recalculé serveur, vérification que
le demandeur est bien le parent de l'élève ou un membre du personnel.

---

### SS-02 — Exfiltration massive de données personnelles
**Fichier :** `src/app/api/export/ministere/route.ts`

Route publique, utilise la **clé `service_role` (contournement total du RLS)**, et
accepte `ecole_id` en paramètre d'URL sans vérifier que l'appelant appartient à
cette école.

```
GET /api/export/ministere?type=eleves&ecole_id=<n_importe_quelle_ecole>
```
→ dump complet élèves, professeurs, résultats, absences, données financières de
**n'importe quel établissement** de la plateforme.

**Correctif :** authentification + rôle direction, `ecole_id` forcé depuis le profil
serveur (le paramètre client est ignoré).

---

### SS-03 — Webhooks de paiement non fonctionnels (perte financière)
**Fichiers :** `src/app/api/webhooks/wave/route.ts`, `.../cinetpay/route.ts`

Les deux webhooks appellent `createClient()` de `@/lib/supabase/server`, qui construit
un client **clé anonyme + cookies de session**. Un webhook émis par Wave ou CinetPay
n'a évidemment aucun cookie : `auth.uid()` est `NULL`, donc `my_ecole_id()` est `NULL`,
donc la policy `ecole_isolation` **rejette l'INSERT**.

Conséquence : un parent paie par Wave/Orange Money, **l'argent quitte son compte**,
mais le paiement n'est jamais enregistré et la facture reste impayée. Perte de
confiance et litiges garantis en production.

**Correctif :** client `service_role` dédié aux webhooks (`src/lib/supabase/admin.ts`),
avec vérification d'intégrité renforcée en amont puisqu'on contourne le RLS.

---

### SS-04 — Abus de facturation SMS/WhatsApp et hameçonnage
**Fichiers :** `src/app/api/sms/send/`, `twilio/sms/`, `whatsapp/send/`

Aucune authentification. Un tiers peut :
- envoyer un volume illimité de SMS **facturés au propriétaire** (Twilio) ;
- émettre des messages **depuis le numéro de confiance de l'école** vers les parents
  (vecteur d'hameçonnage : « payez ici », faux lien de paiement).

**Correctif :** authentification + rôle personnel + limitation de débit.

---

## 🟠 ÉLEVÉE

### SS-05 — CinetPay : aucune vérification de signature
Seul `cpm_site_id` est contrôlé. Or le `site_id` est une **valeur publique**, visible
dans l'URL de checkout côté client. Le double-appel serveur `/v2/payment/check`
limite fortement l'impact (le statut réel est revérifié auprès de CinetPay), mais
permet le spam de la route et la découverte d'identifiants de transaction.
**Correctif :** vérification HMAC du header `x-token` + contrôle du `site_id`.

### SS-06 — Wave : comparaison de signature sensible aux attaques temporelles
`normalizedSig !== expectedSig` compare octet par octet avec arrêt anticipé.
**Correctif :** `crypto.timingSafeEqual` sur des buffers de longueur égale.

### SS-07 — Rejeu de webhook et double crédit
- **Wave** : aucun contrôle d'idempotence. Le même événement rejoué crée un second
  paiement (la contrainte `UNIQUE` sur `reference_transaction` est absente du schéma
  réellement appliqué).
- **CinetPay** : `SELECT` puis `INSERT` non atomique — deux webhooks concurrents
  passent tous deux le test d'existence (TOCTOU) et créditent deux fois.

**Correctif :** table `webhook_events` avec clé unique `(provider, event_id)` servant
de verrou d'idempotence, plus contrainte `UNIQUE` sur `paiements.reference_transaction`.

### SS-08 — Montant du webhook jamais rapproché de la facture
`montant: event.data.amount` est inséré tel quel. Aucun contrôle de cohérence avec
`facture.solde_restant`, ni de devise, ni de borne supérieure.
**Correctif :** rejet si devise ≠ XOF, si montant ≤ 0, ou si montant dépasse le solde
d'une marge de tolérance ; journalisation de l'écart.

### SS-09 — Fuite de mots de passe temporaires
`src/app/api/parents/welcome-pdf/route.ts` génère sans authentification un PDF
contenant l'identifiant **et le mot de passe temporaire** du parent.
**Correctif :** authentification + rôle personnel.

### SS-10 — Altération de notes
`correction-ia/submit-notes` et `correction-ia/distribute` utilisent `service_role`
sans authentification → écriture de notes arbitraires sur n'importe quel élève.
**Correctif :** authentification + rôle enseignant/direction.

### SS-11 — Position GPS des bus scolaires exposée
`transport/position` : `service_role`, aucune authentification. Enjeu de sécurité
physique des enfants (localisation temps réel des véhicules).
**Correctif :** authentification ; écriture réservée au chauffeur/personnel.

### SS-12 — Tâche planifiée en échec ouvert
```ts
if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) return 401
```
Si `CRON_SECRET` n'est pas défini, la condition est fausse et **la route s'ouvre**.
**Correctif :** refuser par défaut quand le secret est absent.

---

## 🟡 MOYENNE

| Réf | Problème | Correctif |
|---|---|---|
| SS-13 | `/api/chat` et `/api/correction-ia` (`maxDuration` 300 s) sans auth → abus de coût IA | Auth + limitation de débit |
| SS-14 | Aucune limitation de débit globale | Limiteur par IP/utilisateur sur les routes sensibles |
| SS-15 | `req.json()` / `JSON.parse` sans `try/catch` dans les webhooks → 500 + trace | Parsing défensif, 400 propre |
| SS-16 | Aucune journalisation applicative des tentatives de paiement | Table `paiement_tentatives` |
| SS-17 | Regex `^SS-OM-(.+)-\d+$` gourmande, pas de validation UUID | Validation stricte du format UUID |

---

## 🛠️ Architecture des correctifs

```
src/lib/supabase/admin.ts        Client service_role centralisé (webhooks/cron only)
src/lib/auth/api-guard.ts        requireUser / requireRole / requireStaff
src/lib/security/webhook-verify.ts  HMAC + comparaison temps constant + idempotence
src/lib/security/rate-limit.ts   Limiteur de débit
supabase/migrations/…_securite_paiements.sql
                                 UNIQUE reference_transaction, webhook_events,
                                 paiement_tentatives, RLS parent-scoped, montant > 0
```

## ✅ Vérification en production

Tests d'exploitation rejoués contre `smartschool-sn.vercel.app` après
déploiement (`eb48a91`) — tous les vecteurs sont fermés :

| Faille | Vecteur testé | Résultat |
|---|---|---|
| SS-01 | `POST /api/paiements/initier` méthode `especes`, montant 999 999 | `401` — bloqué |
| SS-02 | `GET /api/export/ministere?type=eleves` | `401` — bloqué |
| SS-04 | `POST /api/sms/send` · `POST /api/whatsapp/send` | `401` — bloqué |
| SS-09 | `POST /api/parents/welcome-pdf` | `401` — bloqué |
| SS-10 | `POST /api/correction-ia/submit-notes` | `401` — bloqué |
| SS-11 | `POST /api/transport/position` | `401` — bloqué |
| SS-12 | `GET /api/cron/relances` sans `Authorization` | `503` — refus par défaut |
| SS-13 | `POST /api/chat` | `401` — bloqué |

Non-régression vérifiée : landing, `/inscription`, `/telecharger`,
`/api/desktop/updater` (auto-update Tauri) et `/api/health` répondent
normalement.

### Migration appliquée en base

Les quatre lots ont été appliqués au projet `lgifumhjnvralwztythk`.
L'état RLS constaté avant correction confirmait le diagnostic :

```
factures  | ecole_isolation | ALL | (ecole_id = my_ecole_id())
paiements | ecole_isolation | ALL | (ecole_id = my_ecole_id())
```

Remplacé par : `factures_staff_all`, `factures_parent_read`,
`factures_eleve_read`, `paiements_finance_all`, `paiements_direction_read`,
`paiements_parent_read`.

---

## ⚠️ Point de vigilance : `SUPABASE_SERVICE_ROLE_KEY`

Les webhooks utilisent désormais le client `service_role`. Or la sonde
`/api/health` signale que cette variable **n'est toujours pas configurée**
sur Vercel :

```
[FAIL] env.SUPABASE_SERVICE_ROLE_KEY   MISSING — critical
[WARN] config.demo_mode                DEMO_MODE=true
```

Conséquence : les webhooks Wave et CinetPay renvoient une erreur au lieu
d'enregistrer le paiement. Ce n'est pas une régression — ils étaient déjà
totalement non fonctionnels (SS-03), mais ils échouent maintenant de façon
explicite et fermée plutôt que silencieuse.

**L'encaissement Mobile Money ne fonctionnera qu'une fois ces deux variables
corrigées** (procédure détaillée dans `GO-LIVE-CHECKLIST.md`) :

| Variable | Valeur attendue |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` du dashboard Supabase |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `WAVE_WEBHOOK_SECRET` | secret de signature fourni par Wave |
| `CINETPAY_SECRET_KEY` | secret HMAC CinetPay (active la vérification `x-token`) |

---

## 🔴 CRITIQUE — deuxième passe (audit base de données, 2026-07-27)

Le premier audit portait sur le code applicatif. Cette passe interroge la base
elle-même : cohérence des tables avec le code, RLS, droits, référentiels.

**Périmètre vérifié :** les 56 tables et vues interrogées par le code existent
toutes en base ; aucun lien de navigation mort dans les menus. Deux failles
d'élévation de privilège en revanche, plus graves que celles de la première passe
car exploitables en une requête.

### SS-18 — Référentiel de privilèges ouvert à un visiteur anonyme
**Table :** `roles_hierarchie` (et `pays_config`)

RLS **désactivé**, et `anon` comme `authenticated` disposaient de
`INSERT, UPDATE, DELETE, TRUNCATE`. La clé anon étant publique par conception
(elle est dans le bundle client), un visiteur **non authentifié** pouvait :

```sql
UPDATE roles_hierarchie
   SET rang = 100, peut_impersonifier_inferieurs = true
 WHERE role_code = 'parent';
```

`fn_set_user_rank()` — déclencheur sur `utilisateurs` — lit cette table pour
renseigner `rang` et `peut_impersonifier` ; `can_impersonate()` s'appuie ensuite
dessus. Tout parent obtenait donc un rang de direction et le droit d'usurper les
comptes de son établissement. Un simple `TRUNCATE` suffisait aussi à casser la
hiérarchie entière.

**Correctif :** droits d'écriture retirés, RLS activé, policy de lecture seule,
`fn_set_user_rank()` passée en `SECURITY DEFINER` avec `search_path` figé.

### SS-19 — Auto-promotion au rang d'administrateur
**Table :** `utilisateurs`

La policy `utilisateurs_update` porte :

```
USING ((id = auth.uid()) OR (is_admin() AND ecole_id = my_ecole_id()))
```

sans `with_check`, donc identique. Or **le RLS de Postgres filtre des lignes,
jamais des colonnes** : la condition `id = auth.uid()` reste vraie après
modification. Tout utilisateur authentifié pouvait donc exécuter :

```js
supabase.from('utilisateurs').update({ role: 'admin_global' }).eq('id', monId)
```

Le déclencheur de rang attribuait ensuite `rang = 100` et le droit d'usurpation.
Le même chemin permettait de changer `ecole_id` pour basculer dans
l'établissement d'un concurrent et en lire les données.

C'est la faille la plus grave rencontrée : accessible à **tout compte**
(parent, élève, professeur), en une seule requête, sans préparation.

**Correctif :** le RLS ne pouvant pas restreindre les colonnes, un déclencheur
`BEFORE UPDATE` compare l'ancienne et la nouvelle ligne et refuse toute
modification de `role`, `ecole_id`, `rang`, `peut_impersonifier` ou `actif` qui
ne viendrait pas d'un administrateur de l'établissement d'origine. Le contexte
serveur (`service_role`, où `auth.uid()` est NULL) reste libre, afin que
l'inscription et l'invitation continuent de fonctionner.

**Vérifié en base :**

| Test | Résultat |
|---|---|
| Auto-promotion `role → admin_global` | bloqué |
| Changement d'`ecole_id` | bloqué |
| Utilisateur modifiant son téléphone | autorisé (pas de régression) |
| Contexte serveur (inscription, invitation) | autorisé (pas de régression) |

### Faux positif écarté

Un premier balayage signalait 40 policies « ouvertes » sur la base d'un
`with_check` absent. C'était une erreur de méthode : pour une policy `UPDATE`,
un `with_check` à NULL n'ouvre rien — Postgres réutilise alors l'expression
`USING`. Seule `utilisateurs_update` posait un problème réel, pour la raison
distincte exposée en SS-19.

---

## SS-26 à SS-29 — Routes API sans contrôle de rôle

Le proxy renvoie 401 sur `/api/*` sans session, mais il ne vérifie **aucun
rôle** : `ROUTE_REQUIRES_ROLE` ne couvre que les préfixes de tableau de bord
(`/admin`, `/professeur`, …). Le contrôle de rôle appartient donc aux routes,
et quatre d'entre elles n'en avaient pas. Dans un logiciel scolaire, « tout
compte authentifié » signifie chaque élève et chaque parent.

### SS-26 · `/api/notifications/grade` — composeur SMS à contenu libre

Le numéro du destinataire était lu dans le corps de la requête
(`notes[].parentTelephone`), tout comme le texte affiché (`ecoleNom`,
`profNom`, `remarqueGlobale`). Un compte quelconque pouvait donc faire
envoyer le message de son choix vers le numéro de son choix, sur le compte
Twilio de l'établissement — facturation, harcèlement par SMS, et hameçonnage
sous l'identité de l'école.

Correctif : appelant enseignant, débit plafonné à 10/min, et **les numéros
sont relus en base** à partir des identifiants d'élèves, bornés à
l'établissement de l'appelant. Le corps de la requête ne choisit plus jamais
qui est appelé.

### SS-27 · `/api/agent/diffuseur-notes` — ouverte au public

`/api/agent/` figurait dans les préfixes publics du proxy alors que la seule
route concernée est appelée depuis le navigateur par un enseignant connecté.
**Vérifié en production : HTTP 200 sans aucune session.** La route consomme du
crédit Claude et insère des notifications via une fonction SECURITY DEFINER,
donc hors RLS : un anonyme pouvait adresser une fausse note à un parent.

Correctif : préfixe public retiré du proxy, rôle enseignant exigé, élève cible
borné à l'établissement de l'appelant, débit plafonné.

### SS-28 · `/api/twilio/test` — SMS vers un numéro arbitraire

Route de diagnostic sans contrôle de rôle : `to` venait du corps de la
requête. Un élève disposait d'un envoyeur de SMS gratuit vers n'importe quel
numéro au monde, facturé à l'école.

Correctif : `admin_global` uniquement, 3 envois par heure.

### SS-29 · `/api/whatsapp/test` — passerelle LLM gratuite

Même défaut, relayé vers `lib/ai/engine` : n'importe quel compte pouvait
utiliser la clé API du projet comme un service de conversation gratuit.

Correctif : `admin_global` uniquement, 20 requêtes par minute.

### Formulaires publics — plafonds de débit

`/api/contact`, `/api/waitlist` et `/api/inscription/ecole` sont
légitimement publics mais écrivaient en base avec la clé de service sans
aucun plafond. `inscription/ecole` crée un **établissement entier** : sans
limite, la base se remplit de faux locataires depuis une seule machine.
Plafonds par IP : 5/h pour les deux formulaires, 3/h pour l'inscription.

## SS-30 — Vues en mode DEFINER, lisibles sans authentification

**La faille la plus large de tout l'audit.**

Une vue est le point aveugle du RLS. Par défaut Postgres l'exécute avec les
droits de son propriétaire (`security_invoker` à off) : elle interroge ses
tables sources **sans appliquer leur RLS**. Dix vues applicatives étaient dans
ce cas, et toutes portaient un `GRANT SELECT` à `anon` — le rôle de la clé
publique, livrée par conception dans le bundle du navigateur.

Vérifié avant correction en se plaçant réellement dans le rôle `anon` :
`v_balance_generale` 21 lignes et `v_moteur_financier` 2 lignes, **sans la
moindre authentification**. Les huit autres ne renvoyaient rien uniquement
parce que leur table source est vide aujourd'hui ; l'accès, lui, était
accordé — le jour où l'école saisit sa paie, la donnée devient publique.

Étaient concernées : comptabilité (balance générale, grand livre), paie
mensuelle, réconciliation des paiements, bourses, achats fournisseurs,
journal d'audit critique, et `v_users_impersonifiables` — **nom, rôle,
téléphone et rang de privilège de chaque utilisateur de chaque
établissement**, c'est-à-dire à la fois une fuite de données personnelles et
la liste de courses d'un attaquant choisissant qui usurper.

Correctif : `security_invoker = true` sur les 14 vues applicatives, et
`REVOKE` du rôle `anon`. Vérifié après : 0 vue en DEFINER, 0 objet lisible
par `anon`, l'intendant conserve sa comptabilité, et un élève ne voit que le
plan comptable à zéro — jamais les montants.

**Le lanterneur ne regardait que les tables.** `diagnostic_vues()` ajoute deux
familles de contrôles — vue encore en mode DEFINER, objet lisible par `anon` —
et le cockpit les affiche désormais aux côtés des autres.
