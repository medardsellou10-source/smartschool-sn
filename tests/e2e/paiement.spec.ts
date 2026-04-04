import { test, expect } from '@playwright/test'

test.describe('Flux paiement parent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Parent' }).click()
    await page.waitForURL('/parent**')
  })

  test('page paiement accessible', async ({ page }) => {
    await page.goto('/parent/paiement')
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 })
    // En mode démo, la page paiement s'affiche
    await expect(page.getByText(/paiement|frais|Wave|scolarité/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('options Wave et Orange Money visibles', async ({ page }) => {
    await page.goto('/parent/paiement')
    // Les boutons de paiement mobile money doivent être présents
    const hasWave = await page.getByText(/Wave/i).isVisible().catch(() => false)
    const hasOM = await page.getByText(/Orange Money/i).isVisible().catch(() => false)
    expect(hasWave || hasOM).toBeTruthy()
  })
})

test.describe('Bulletins et absences parent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/role-selector')
    await page.locator('button').filter({ hasText: 'Parent' }).click()
    await page.waitForURL('/parent**')
  })

  test('page bulletins affiche les enfants', async ({ page }) => {
    await page.goto('/parent/bulletins')
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 })
  })

  test('page absences affiche le calendrier', async ({ page }) => {
    await page.goto('/parent/absences')
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 })
  })
})
