# SmartSchool SN — Mise en service

**Mesuré le 15 août 2026** sur `https://smartschool-sn.vercel.app`, version
déployée `cf1d5d7`. Ce document rapporte un état constaté, pas un état
supposé : chaque ligne vient d'une sonde ou d'une requête exécutée, et non
d'une lecture du code.

---

## Le produit ne peut pas ouvrir aujourd'hui

Non pas à cause du code, mais parce que **cinq variables d'environnement ne
sont pas renseignées sur Vercel**. La sonde `/api/health` renvoie `503`.

| Variable | État | Ce qui ne marche pas sans elle |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **manquante** | Invitations, webhooks de paiement, exports, bulletins PDF, cockpit propriétaire. Onze fichiers en dépendent. |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | **Toute inscription d'école est simulée.** Aucune école réelle ne peut s'inscrire. À passer à `false`. |
| `MASTER_SESSION_SECRET` | manquante | Cockpit propriétaire inaccessible. |
| `MASTER_2FA_CODE` | manquante | Idem. |
| `OWNER_EMAILS` | manquante | Idem — et sans elle l'allowlist est vide, donc *personne* n'entre. C'est voulu : le cockpit échoue fermé. |

### Encaissement Mobile Money

`WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET` ne sont pas renseignées. Vérifié :
`POST /api/webhooks/wave` sans signature renvoie `500 Server misconfigured`.

C'est le comportement voulu — le webhook refuse plutôt que d'accepter sans
vérifier — mais la conséquence est nette : **aucun paiement Wave ne peut être
enregistré**. Les deux variables sont indispensables avant d'annoncer le
paiement en ligne aux écoles.

`CINETPAY_*` suit la même logique pour l'autre passerelle.

### Facultatif

`GOOGLE_GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `ANTHROPIC_API_KEY`,
`TWILIO_*`, `AFRICASTALKING_*`, `CRON_SECRET`, `TRANSPORT_INGEST_TOKEN`.
Leur absence dégrade une fonctionnalité sans bloquer la mise en service.

---

## Ce qui est verrouillé et vérifié

État du lanterneur (`/waed-master/diagnostic`, ou les fonctions
`diagnostic_*` en base) : **aucune erreur**.

| Contrôle | Résultat |
|---|---|
| `PROTECTION` | 6 / 6 — auto-promotion, rang, factures, notation, montants dérivés, pointage |
| `CONTRAINTE` | 3 / 3 — unicité des transactions, montants strictement positifs |
| `EXECUTION` | 7 / 7 — chaque déclencheur exécuté pour de vrai, sur écriture annulée |
| `VUE` · `ANON` · `FONCTION` · `STOCKAGE` · `LECTURE` | aucun signalement |

**Vérifié depuis l'extérieur**, avec la clé publique du navigateur :
`v_moteur_financier`, `v_balance_generale`, `v_users_impersonifiables` et
`v_paie_mensuelle` renvoient `401`. Les tables sensibles renvoient `200 []` —
le RLS filtre toutes les lignes pour un visiteur anonyme.

**Points d'entrée durcis**, tous vérifiés à `401` sans session :
`/api/agent/diffuseur-notes`, `/api/notifications/grade`, `/api/twilio/test`,
`/api/whatsapp/test`, `/api/export/ministere`, `/api/master/diagnostic`,
`/api/paiements/initier`.

43 migrations, 15 familles de constats documentées dans
[SECURITY-AUDIT.md](SECURITY-AUDIT.md).

---

## Travail d'exploitation, pas de développement

Trois points signalés en `ATTENTION` par le lanterneur. Ils ne se corrigent
pas dans le code.

### Les comptes élèves n'existent pas

50 fiches élèves, **aucune rattachée à un compte**, et un seul compte de rôle
élève — sans fiche en face. Il n'y a rien à rapprocher automatiquement : les
comptes doivent être créés par invitation depuis l'espace administrateur.

Le flux d'invitation a été corrigé pour cela (SS-41) ; avant, un élève invité
voyait ses factures et rien d'autre.

### 47 fiches sur 50 n'ont aucun accès famille

Ni compte élève, ni parent rattaché. Personne ne peut consulter ces dossiers
côté famille. Rattachement à faire depuis le secrétariat.

### La position des établissements

L'inscription ne renseigne plus de coordonnées (elle écrivait auparavant
celles du centre de Dakar pour toutes les écoles). Chaque établissement doit
saisir la sienne dans **Paramètres → Coordonnées GPS**, bouton « Utiliser ma
position » depuis l'école.

Sans cela le pointage refuse avec un message explicite — ce qui vaut mieux
qu'un calcul faux, mais reste bloquant pour la fonctionnalité.

---

## Un point ouvert que je n'ai pas pu clore

L'activation d'un plan payant après règlement Wave est désormais gérée
(SS-44), mais **elle n'a jamais été éprouvée sur une transaction réelle** :
cela demande `WAVE_WEBHOOK_SECRET` configurée et un paiement effectif.

La logique de tarification, elle, est éprouvée hors ligne :

```bash
npm run test:tarifs
```

20 contrôles — quel plan un montant finance, et jusqu'à quand. Deux défauts y
ont été trouvés à l'écriture : un abonnement souscrit le 31 janvier se
terminait le 3 mars, et le calcul d'échéance dépendait du fuseau du serveur.

**Surveillez le premier règlement réel.**

---

## Ordre de mise en service

1. Renseigner les cinq variables bloquantes sur Vercel, puis redéployer.
2. Vérifier que `/api/health` renvoie `200`.
3. Ouvrir le cockpit propriétaire et lire le diagnostic complet.
4. Créer une école de test par le parcours d'inscription réel, saisir ses
   coordonnées GPS, inviter un professeur et un élève.
5. Vérifier que l'élève voit ses notes, ses absences et ses factures — c'est
   le parcours que SS-41 rétablit.
6. Configurer Wave, puis effectuer **un vrai paiement de faible montant** et
   contrôler que la facture se solde et que le plan s'active.
