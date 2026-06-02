# 🔐 Signature & Auto-update — SmartSchool Desktop

## Clé de signature updater (déjà générée)

Une paire de clés a été générée localement :

```
Privée : C:\Users\lenovo\.tauri\smartschool-updater.key       (SECRET — ne jamais committer)
Publique: C:\Users\lenovo\.tauri\smartschool-updater.key.pub
```

La clé **publique** est déjà inscrite dans `desktop/src-tauri/tauri.conf.json`
(`plugins.updater.pubkey`). Elle permet à l'app installée de vérifier que les
mises à jour proviennent bien de toi.

## Pourquoi le build local n'a pas produit les `.sig`

Le build local génère bien les installateurs (`.msi`, `.exe`) mais l'étape de
**signature des artefacts updater** demande le mot de passe de la clé privée de
façon **interactive** (prompt stdin). Dans un shell non-interactif, ce prompt
bloque. Ce n'est PAS un problème en CI GitHub Actions (pas de TTY → lit l'env var).

Les installateurs produits **fonctionnent parfaitement** sans signature updater —
seule la fonction *auto-update* nécessite les `.sig`.

## Activer la signature en CI (recommandé)

1. **Récupérer le contenu de la clé privée** :
   ```powershell
   Get-Content "$env:USERPROFILE\.tauri\smartschool-updater.key" -Raw
   ```

2. **Ajouter 2 secrets GitHub** :
   https://github.com/medardsellou10-source/smartschool-sn/settings/secrets/actions
   - `TAURI_SIGNING_PRIVATE_KEY` = (le contenu copié ci-dessus)
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` = (vide — la clé n'a pas de mot de passe)

3. Le workflow `.github/workflows/build-desktop.yml` lit déjà ces secrets.
   Au prochain tag `v*.*.*`, les `.msi`, `.exe` **et** `.sig` seront publiés.

## Signer manuellement en local (optionnel)

Si tu veux les `.sig` en local, régénère la clé **avec un mot de passe**
(pour éviter le prompt interactif) :

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
npx @tauri-apps/cli signer generate -w "$env:USERPROFILE\.tauri\ss-updater.key" -p "MonMotDePasse"
# Mettre la nouvelle pubkey dans tauri.conf.json, puis :
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\ss-updater.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "MonMotDePasse"
npx @tauri-apps/cli build
```

## ⚠️ Signature Authenticode (différente — anti-SmartScreen)

La signature updater (ci-dessus) garantit l'authenticité des MISES À JOUR.
Elle ne supprime PAS l'avertissement Windows SmartScreen au premier lancement.
Pour ça, il faut un **certificat Authenticode OV** (payant) — voir
`GO-LIVE-CHECKLIST.md` section signature. Sans lui, l'utilisateur clique
« Informations complémentaires » → « Exécuter quand même » (l'app marche).
