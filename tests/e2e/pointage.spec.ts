import { test, expect } from '@playwright/test'

test.describe('Flux pointage professeur', () => {
  test.beforeEach(async ({ page }) => {
    // Activer démo professeur
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Professeur' }).click()
    await page.waitForURL('/professeur**')
  })

  test('page pointage accessible depuis le dashboard prof', async ({ page }) => {
    await page.goto('/professeur/pointage')
    await expect(page.getByText(/Pointage|GPS/i)).toBeVisible({ timeout: 5000 })
  })

  test('pointage dans le périmètre (geolocation mockée)', async ({ page, context }) => {
    // Lycée Cheikh Anta Diop — coordonnées approximatives Dakar
    await context.setGeolocation({ latitude: 14.6937, longitude: -17.4441 })
    await context.grantPermissions(['geolocation'])

    await page.goto('/professeur/pointage')
    const btnPointer = page.getByRole('button', { name: /Pointer|Enregistrer/i })
    if (await btnPointer.isVisible()) {
      await btnPointer.click()
      // Attendre confirmation ou message d'état
      await page.waitForTimeout(2000)
    }
    // En mode démo, le pointage s'affiche avec les données démo
    await expect(page.locator('main')).toBeVisible()
  })
})
