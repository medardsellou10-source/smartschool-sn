# SmartSchool — Wrapper Desktop Windows (Tauri 2.0)

Application native Windows qui ouvre `https://smartschool-sn.vercel.app` dans
une fenêtre Tauri 2.0 (Rust + WebView2). Bundle ~10 MB.

## Prérequis (one-time setup)

1. **Rust** : https://rustup.rs/ → installer `rustup`
2. **Microsoft C++ Build Tools** : https://visualstudio.microsoft.com/downloads/ →
   "Build Tools" → cocher "Desktop development with C++"
3. **WebView2 Runtime** : déjà inclus Win10+, sinon
   https://developer.microsoft.com/microsoft-edge/webview2/
4. **Node.js 20+** : déjà installé pour le projet principal

## Installation du projet

```bash
cd desktop
npm install
```

## Développement

```bash
npm run tauri:dev
```

Lance l'app en mode développement, recharge à chaud sur modifs Rust.

## Build production

```bash
npm run tauri:build
```

Produit :
- `src-tauri/target/release/bundle/msi/SmartSchool_X.Y.Z_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/SmartSchool_X.Y.Z_x64-setup.exe`

## Signature Authenticode (optionnel mais recommandé)

Voir `desktop/SIGNING.md` pour la procédure complète.

Variables d'environnement :
```
TAURI_SIGNING_PRIVATE_KEY=<contenu de la clé privée générée par `tauri signer generate`>
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<mot de passe associé>
```

## Versionning

Aligner les 3 versions :
- `package.json` (racine)
- `desktop/package.json`
- `desktop/src-tauri/tauri.conf.json` (`version`)
- `desktop/src-tauri/Cargo.toml` (`version`)

Puis :
```bash
git tag v0.1.0
git push --tags
```

La CI GitHub `build-desktop.yml` se charge du reste.
