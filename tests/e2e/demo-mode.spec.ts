import { test, expect } from '@playwright/test'

// Helper : activer le mode démo pour un rôle donné
async function activerDemoRole(page: any, role: string) {
  await page.goto('/role-selector')
  await page.getByRole('button', { name: new RegExp(role, 'i') }).first().click()
  await page.waitForURL(`/${role.toLowerCase().replace(' ', '-').replace('é', 'e').replace('è', 'e')}**`)
}

test.describe('Mode démo — dashboards', () => {
  test('dashboard admin se charge en mode démo', async ({ page }) => {
    await page.goto('/role-selector')
    const adminBtn = page.locator('button').filter({ hasText: 'Administrateur' })
    await adminBtn.click()
    await page.waitForURL('/admin**')
    await expect(page.getByText(/Lycée|SmartSchool/i)).toBeVisible({ timeout: 5000 })
  })

  test('dashboard secrétaire charge les inscriptions', async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Secrétaire Général' }).click()
    await page.waitForURL('/secretaire**')
    await expect(page.getByText('Inscriptions')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Certificats')).toBeVisible()
  })

  test('dashboard intendant charge le budget', async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Intendant Scolaire' }).click()
    await page.waitForURL('/intendant**')
    await expect(page.getByText('Budget')).toBeVisible({ timeout: 5000 })
  })

  test('dashboard censeur charge les stats profs', async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Censeur' }).click()
    await page.waitForURL('/censeur**')
    await expect(page.getByText(/Profs|Professeurs/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Mode démo — sous-pages secrétaire', () => {
  test.beforeEach(async ({ page }) => {
    // Activer démo secrétaire via role-selector
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Secrétaire Général' }).click()
    await page.waitForURL('/secretaire**')
  })

  test('page inscriptions affiche le tableau et les boutons', async ({ page }) => {
    await page.goto('/secretaire/inscriptions')
    await expect(page.getByRole('button', { name: '+ Nouvelle inscription' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Tous')).toBeVisible()
    await expect(page.getByText('Validées')).toBeVisible()
  })

  test('bouton Nouvelle inscription affiche un toast', async ({ page }) => {
    await page.goto('/secretaire/inscriptions')
    await page.getByRole('button', { name: '+ Nouvelle inscription' }).click()
    await expect(page.getByText(/Mode démo/i)).toBeVisible({ timeout: 3000 })
  })

  test('page courrier affiche les onglets', async ({ page }) => {
    await page.goto('/secretaire/courrier')
    await expect(page.getByRole('button', { name: '+ Enregistrer courrier' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Entrants')).toBeVisible()
    await expect(page.getByText('Sortants')).toBeVisible()
  })
})

test.describe('Mode démo — sous-pages censeur', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Censeur' }).click()
    await page.waitForURL('/censeur**')
  })

  test('page examens affiche les filtres et le bouton', async ({ page }) => {
    await page.goto('/censeur/examens')
    await expect(page.getByRole('button', { name: '+ Planifier examen' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('En cours')).toBeVisible()
    await expect(page.getByText('Planifiés')).toBeVisible()
  })

  test('bouton Planifier examen affiche un toast', async ({ page }) => {
    await page.goto('/censeur/examens')
    await page.getByRole('button', { name: '+ Planifier examen' }).click()
    await expect(page.getByText(/Mode démo/i)).toBeVisible({ timeout: 3000 })
  })

  test('page bulletins affiche la progression globale', async ({ page }) => {
    await page.goto('/censeur/bulletins')
    await expect(page.getByText('Validation des Bulletins')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Progression globale')).toBeVisible()
  })
})
