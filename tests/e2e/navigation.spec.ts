import { test, expect } from '@playwright/test'

test.describe('Navigation et pages publiques', () => {
  test('page accueil se charge correctement', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SmartSchool SN/)
    await expect(page.getByText("L'École")).toBeVisible()
    await expect(page.getByText('Sénégalaise')).toBeVisible()
    await expect(page.getByText('Se connecter')).toBeVisible()
    await expect(page.getByText('Explorer la démo')).toBeVisible()
  })

  test('role-selector affiche les 8 rôles', async ({ page }) => {
    await page.goto('/role-selector')
    await expect(page.getByRole('heading', { name: 'SmartSchool SN' })).toBeVisible()
    await expect(page.getByText('Administrateur')).toBeVisible()
    await expect(page.getByText('Professeur')).toBeVisible()
    await expect(page.getByText('Surveillant')).toBeVisible()
    await expect(page.getByText('Parent')).toBeVisible()
    await expect(page.getByText('Élève')).toBeVisible()
    await expect(page.getByText('Secrétaire Général')).toBeVisible()
    await expect(page.getByText('Intendant Scolaire')).toBeVisible()
    await expect(page.getByText('Censeur')).toBeVisible()
  })

  test('page login accessible', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible()
  })
})
