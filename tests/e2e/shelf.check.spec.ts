import { test, expect } from '@playwright/test'

test('bookshelf → open book', async ({ page }) => {
  const loginRes = await page.request.post('/api/auth/login', {
    data: { email: 'demo@sprech.local', password: 'demo123' },
  })
  expect(loginRes.ok()).toBeTruthy()

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dictionary', { waitUntil: 'domcontentloaded' })
  const toggle = page.getByRole('radio', { name: 'Sách' })
  await toggle.waitFor({ state: 'visible', timeout: 30_000 })
  await toggle.scrollIntoViewIfNeeded()
  await toggle.click()

  await expect(page.getByRole('heading', { name: 'Giá sách' })).toBeVisible()
  await page.screenshot({ path: '/tmp/shot-shelf.png', fullPage: false })

  await page.locator('[data-spine="main"]').click()
  await page.waitForTimeout(1200)
  await expect(page.getByRole('button', { name: 'Về giá sách' })).toBeVisible()
  await page.screenshot({ path: '/tmp/shot-open.png', fullPage: false })
})
