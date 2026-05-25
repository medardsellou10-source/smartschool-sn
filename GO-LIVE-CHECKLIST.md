# 🚀 SmartSchool SN — Check-list GO-LIVE

> Tout ce qu'il faut pour qu'**une vraie école** s'inscrive et utilise SmartSchool en production.
> Audit effectué le 2026-05-25.

---

## 🟢 PRÊT EN PRODUCTION

### Infrastructure & Déploiement
- ✅ **Vercel** : projet `prj_g9vgrh2xYwsAQl80sqHCwOR8sRMu`, déploiement auto sur push master
- ✅ **Supabase** : projet `lgifumhjnvralwztythk`, region `cdg1` (France)
- ✅ **GitHub** : repo `medardsellou10-source/smartschool-sn` (public, master)
- ✅ **Build** : Next.js 16.2.1 + Turbopack — temps moyen ~2 min
- ✅ **Domaines** : `smartschool-sn.vercel.app` (alias actif)
- ✅ **TLS** : HTTPS auto via Vercel

### Base de données
- ✅ **18 migrations appliquées** (hierarchy, matricule, EDT, etc.)
- ✅ **RLS activé** sur toutes les tables sensibles (`utilisateurs`, `paiements`, `notes`, `attestations`)
- ✅ **Realtime activé** sur 21 tables critiques (notifications, paiements, absences, appels, observations, conseils_classe, fiches_paie, factures_fournisseurs, ecritures, bourses_eleves…)
- ✅ **Audit logs universels** via trigger `fn_audit_changes()`
- ✅ **Multi-pays** : pays/region/district configurables (SN + CI prêts)

### Fonctionnalités métier
- ✅ **8 rôles hiérarchisés** (Directeur 100 → Élève 10) avec impersonification
- ✅ **Workflow inscription école** : 4 étapes, validation, auth Supabase, école + admin + abonnement + tarifs auto
- ✅ **Workflow appel prof → surveillant → censeur → parents** (chaîne notifs Supabase + realtime)
- ✅ **Correction IA Gemini 3 étapes** (extraction barème + extraction copies + scoring) avec 3 modes (strict/standard/bienveillant)
- ✅ **Bulletins** : trimestriel + annuel auto + mention auto + conseils de classe
- ✅ **Comptabilité complète** : salaires, achats, comptabilité SYSCOA, bourses, fiscalité, dashboard finance 360°
- ✅ **Module activités inter-écoles** (validation Censeur)
- ✅ **Bibliothèque pédagogique** : 159 ressources (Maternelle→Tle) + 13 TP PhET + 22 annales BAC/BFEM/CFEE
- ✅ **Carte scolaire** 4 vues (CR80, compacte, numérique Wallet, A4 batch)
- ✅ **Matricule templates configurables**
- ✅ **PDFs** : bulletins, fiches paie, attestations, fiche accueil parent

### UX
- ✅ **Dark / Light mode** complet (76+ pages tokenisées `--ss-`)
- ✅ **Responsive mobile-first** : Sidebar `lg:flex`, drawer mobile, BottomNav `lg:hidden`
- ✅ **Lisibilité premium** : overrides CSS pour remap des couleurs dark→light
- ✅ **PageHeader unifié** avec gradient subtle premium
- ✅ **PWA** activée (Service Worker, manifest)

---

## 🟡 À CONFIGURER AVANT GO-LIVE

### Variables d'environnement Vercel **CRITIQUES**

Vérifier sur https://vercel.com/medardsellou10-8487s-projects/smartschool-sn/settings/environment-variables :

| Variable | Statut attendu | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lgifumhjnvralwztythk.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` (jwt) | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` (jwt, **secret**) | Supabase → Project Settings → API |
| `NEXT_PUBLIC_DEMO_MODE` | **`false` ou supprimée** | (sinon toutes les inscriptions restent en mode démo) |
| `NEXT_PUBLIC_APP_URL` | `https://smartschool-sn.vercel.app` | Domaine prod |
| `GOOGLE_GEMINI_API_KEY` | `AIza…` | https://aistudio.google.com/app/apikey |
| `YOUTUBE_API_KEY` | `AIza…` | https://console.cloud.google.com/apis/credentials |
| `WAVE_API_KEY` | `wave_sn_prod_…` (optionnel) | Wave Sénégal Business |
| `WHATSAPP_TOKEN` | (optionnel) | WhatsApp Business API |
| `AFRICASTALKING_API_KEY` | (optionnel) | Africa's Talking SMS |

**🔴 Bloquant identifié** : Le test API d'inscription retourne `mode: "demo"`.
**Cause probable** : `NEXT_PUBLIC_DEMO_MODE=true` ou `SUPABASE_SERVICE_ROLE_KEY` manquante.
**Action** : éditer les env vars Vercel et redéployer.

### Domaine personnalisé
- ⚠️ Ajouter un domaine `app.smartschool.sn` ou similaire (DNS + Vercel domain)
- ⚠️ Mettre à jour `NEXT_PUBLIC_APP_URL` avec le nouveau domaine

### SMTP / Email transactionnel
- ⚠️ Configurer Supabase Auth → SMTP custom (Resend / SendGrid / Postmark)
- Par défaut Supabase = 30 emails/h → insuffisant pour une école

### Wave / Mobile Money
- ⚠️ Compte Wave Sénégal Business + clé API production
- ⚠️ Webhook Wave → `/api/webhooks/wave` (à créer si pas encore fait)
- ⚠️ Tester un paiement réel de 100 FCFA avant ouverture

### WhatsApp Business
- ⚠️ Numéro WhatsApp Business validé Meta
- ⚠️ Templates approuvés (paiement reçu, absence enfant, bulletin disponible)
- ⚠️ Token API longue durée

---

## 🟠 OPTIMISATIONS PERFORMANCE

### Lenteurs identifiées
1. **Bundle JS** : turbopack actif mais certaines pages volumineuses (support-pedagogique 1211 lignes, professeur/correction-ia 1257 lignes)
   - **Action** : code-splitting via `dynamic(() => import(…))` pour les modals lourds
2. **Première charge dashboards** : `useEffect` charge meta + data en série
   - **Action** : passer en `Promise.all` (déjà fait sur 90% des pages)
3. **Images miniatures YouTube** : 159 thumbnails 480px chargées d'un coup
   - **Action** : lazy-loading déjà actif (`loading="lazy"`), ajouter `<picture>` ou WebP fallback
4. **Tables grosses** (>100 lignes) sans pagination
   - **Action** : ajouter pagination ou virtualisation (`react-window`) sur :
     - `/admin/eleves` (peut dépasser 1000 lignes)
     - `/admin/utilisateurs`
     - `/intendant/paiements`
5. **Supabase queries N+1** dans certaines pages
   - **Action** : utiliser `select('*, related(*)')` au lieu de loops

### Bonnes pratiques déjà en place
- ✅ Server Components partout où possible (layouts, headers)
- ✅ `useMemo` sur createClient/Date pour stabilité refs
- ✅ Lazy `import()` dans les routes API lourdes
- ✅ Cache Tailwind via tokens CSS (pas de classes générées dynamiquement)

---

## 🔵 SUGGESTIONS PRODUIT (post go-live)

### 30 derniers jours
- [ ] **Onboarding interactif** : tour guidé première connexion (intro.js / shepherd.js)
- [ ] **Templates école** : 3 packs prêts (Maternelle/Primaire, Collège, Lycée + Franco-Arabe)
- [ ] **Import Excel élèves** : drag-and-drop XLSX → preview → import (existe en API ?)
- [ ] **Backup automatique quotidien** : pg_dump → Supabase Storage (cron Vercel)
- [ ] **Notifications push** mobile (Web Push API) en plus des SMS

### 90 jours
- [ ] **App mobile native** (React Native Expo) ou wrap PWA
- [ ] **Mode hors-ligne** complet (IndexedDB sync) pour zones rurales
- [ ] **Multi-école fédération** (réseau de lycées partage activités/examens)
- [ ] **Marketplace ressources** : profs publient/téléchargent cours
- [ ] **IA conversationnelle** par rôle (chat « Expliquer cette note », « Préparer un conseil de classe »)

### Business
- [ ] **Page de démo live** publique (sans auth) avec données fictives
- [ ] **Vidéo de présentation** 90s en homepage
- [ ] **Cas client** : 1 école pilote avec témoignage + chiffres
- [ ] **Référencement SEO** local : « gestion scolaire Sénégal », « logiciel école Dakar »
- [ ] **Programme partenaires** (consultants, formateurs)

---

## 🧪 TESTS DE NON-RÉGRESSION

### Workflows critiques à valider avant chaque déploiement
1. **Inscription école** complète (4 étapes) → admin reçoit email → connexion → dashboard
2. **Connexion existante** → redirection rôle correct
3. **Création élève** (admin) → apparaît dans liste classe (Prof + Surveillant)
4. **Saisie note** (Prof) → bulletin trimestriel calculé auto → mention correcte
5. **Appel classe** (Prof) → notif Surveillant + Censeur + Parents → marquage traité (Censeur)
6. **Paiement Wave** sandbox → reçu validé Économe → attestation imprimable (Secrétaire)
7. **Inscription élève à activité** (Parent) → autorisation + paiement
8. **Demande correction IA** (Prof) → barème extrait → 5 copies notées
9. **Génération bulletin PDF** → téléchargement OK
10. **Sync YouTube** (Admin) → 10 vidéos ajoutées dans `ressources_youtube`

---

## 📊 MÉTRIQUES À SURVEILLER

| Métrique | Outil | Seuil alerte |
|---|---|---|
| Uptime | Vercel Analytics | < 99.5% |
| Temps réponse API | Vercel Logs | > 2s P95 |
| Erreurs JS client | Sentry (à intégrer) | > 0.1% sessions |
| Supabase DB CPU | Supabase Dashboard | > 70% |
| Supabase rows lus/jour | Supabase Dashboard | > 1M (passer Pro) |
| Erreurs API correction-ia | Logs Gemini | > 5% |
| Bounce rate inscription | Vercel Analytics | > 50% |

---

## 🆘 SUPPORT & RUNBOOK

### Numéros critiques (à compléter)
- WhatsApp support école : (à définir)
- Email support : `support@smartschool.sn`
- Astreinte technique : (à définir)

### Incidents fréquents anticipés
1. **« Je ne peux pas me connecter »** → reset password via /reset
2. **« Mon bulletin n'apparaît pas »** → vérifier visa Secrétaire
3. **« Le paiement Wave a échoué »** → check webhook Wave + logs
4. **« L'IA correction ne marche pas »** → quota Gemini dépassé (50 req/min free tier)

---

## ✅ DÉCISION GO/NO-GO

**État actuel : 🟢 PRÊT TECHNIQUEMENT — bloqué uniquement par les env vars Vercel**

Une fois les **5 actions bloquantes** ci-dessous effectuées, le produit peut accueillir sa première école :
1. ☐ Configurer `SUPABASE_SERVICE_ROLE_KEY` sur Vercel (prod)
2. ☐ Supprimer/passer à `false` `NEXT_PUBLIC_DEMO_MODE` sur Vercel (prod)
3. ☐ Configurer SMTP custom Supabase Auth
4. ☐ Tester l'inscription end-to-end avec un email réel (vérifier réception)
5. ☐ Activer le domaine `app.smartschool.sn`

**Temps estimé : 2-4 heures de configuration.**

---

*Dernière mise à jour : commit `c66b6d1` — Sprint M+N+P validé.*
