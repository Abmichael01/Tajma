import { test, expect } from '@playwright/test'

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3005'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
  })

  test('user should see login page clearly', async ({ page }) => {
    await page.click('text=Connexion') // Assuming french UI based on "Tajma"
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('h1')).toContainText(/Connexion/i)
  })

  test('failed login shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Adjust selector based on actual UI (sonner/toast or inline)
    await expect(page.locator('text=/identifiants invalides|erreur/i')).toBeVisible()
  })

  test('navigation to register page works', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.click('text=/créer un compte|inscription/i')
    await expect(page).toHaveURL(/.*register/)
  })
})
