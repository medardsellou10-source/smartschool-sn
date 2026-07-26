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

## ✅ Vérification

Voir la section « Tests de non-régression sécurité » en fin de `GO-LIVE-CHECKLIST.md`.
