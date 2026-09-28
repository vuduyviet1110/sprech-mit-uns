import { test, expect } from '@playwright/test'

const DEMO_EMAIL = process.env.E2E_EMAIL || 'demo@sprech.local'
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'demo123'

test.describe('smoke', () => {
  test('policy pages are public', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Chính sách quyền riêng tư').first()).toBeVisible()

    await page.goto('/terms', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Điều khoản sử dụng').first()).toBeVisible()
  })

  test('login → today → review', async ({ page }) => {
    // Prefer API login so sealed httpOnly cookie is set reliably (avoids flaky form hydration).
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    })
    expect(loginRes.ok()).toBeTruthy()

    await page.goto('/today', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/today/)
    await expect(page.getByTestId('today-page')).toBeVisible()

    await page.goto('/review', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/review/)
    await expect(page.getByTestId('review-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ôn Tập SRS' })).toBeVisible()
  })

  test('login page exposes form controls', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-email')).toBeVisible()
    await expect(page.getByTestId('login-password')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })
})
