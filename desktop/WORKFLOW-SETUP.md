# 🛠️ Activer la CI GitHub Actions « build-desktop »

Le fichier `desktop/build-desktop.yml.tpl` contient le workflow prêt-à-l'emploi
qui builde automatiquement les `.msi` et `.exe` Windows à chaque tag `v*.*.*`.

Il n'est **pas** dans `.github/workflows/` parce que l'auth Git utilisée pour
les commits Claude Code n'a pas le scope `workflow` GitHub. À déplacer
**manuellement** depuis ton terminal :

```bash
mkdir -p .github/workflows
mv desktop/build-desktop.yml.tpl .github/workflows/build-desktop.yml
git add .github/workflows/build-desktop.yml
git commit -m "ci: add build-desktop workflow"
git push
```

Tu seras peut-être invité par GitHub à confirmer la permission `workflow`
sur ton token — accepte. Une fois fait, taguer une version déclenche le build :

```bash
npm version patch      # bump 0.1.0 → 0.1.1
git push --tags        # → déclenche le workflow → produit .msi/.exe sur GitHub Releases
```

Les binaires apparaitront automatiquement sur la page `/telecharger` du site
(la page lit `api.github.com/repos/medardsellou10-source/smartschool-sn/releases/latest`).
