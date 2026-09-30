import { test, expect } from '@playwright/test'

const DEMO_EMAIL = process.env.E2E_EMAIL || 'demo@sprech.local'
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'demo123'

/**
 * Gọi API từ bên trong trang, không dùng `page.request`.
 *
 * Cookie phiên đặt `secure: true` ở production (`server/utils/session.ts:36`), mà
 * e2e chạy `NODE_ENV=production` trên `http://127.0.0.1`. Trình duyệt vẫn gửi
 * cookie đó khi điều hướng vì localhost là secure context, nhưng
 * `page.request` thì không — mọi lời gọi qua đó trả 401.
 */
const api = (page: import('@playwright/test').Page) => ({
  post: (url: string, body: unknown) =>
    page.evaluate(
      async ([u, b]) => {
        const res = await fetch(u as string, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(b),
        })
        return { status: res.status, body: await res.json().catch(() => null) }
      },
      [url, body] as const,
    ),
  get: (url: string) =>
    page.evaluate(async (u) => {
      const res = await fetch(u)
      return { status: res.status, body: await res.json().catch(() => null) }
    }, url),
})

test.beforeEach(async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  const res = await api(page).post('/api/auth/login', {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  expect(res.status).toBe(200)
})

/**
 * Máy mới (localStorage trống) phải vào đúng ngôn ngữ đã lưu trong hồ sơ.
 * Trước đây `learning_language` chỉ nằm ở localStorage nên mỗi thiết bị lại
 * bắt đầu bằng tiếng Đức bất kể người dùng đang học gì.
 */
test('ngôn ngữ được nạp từ hồ sơ trên thiết bị mới', async ({ page }) => {
  const saved = await api(page).post('/api/settings', {
    primaryLang: 'cs',
    dailyReviewTarget: 33,
  })
  expect(saved.status).toBe(200)

  await page.evaluate(() => localStorage.removeItem('learning_language'))
  await page.goto('/today', { waitUntil: 'domcontentloaded' })

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('learning_language')), {
      timeout: 15_000,
    })
    .toBe('cs')

  // Ghi ngôn ngữ không được kéo theo reset các thiết lập khác.
  const after = await api(page).get('/api/settings')
  expect(after.body.dailyReviewTarget).toBe(33)
})

test('lựa chọn sẵn có ở máy được tôn trọng, không bị hồ sơ ghi đè', async ({
  page,
}) => {
  await api(page).post('/api/settings', { primaryLang: 'cs' })

  await page.goto('/today', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('learning_language', 'de'))

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  expect(
    await page.evaluate(() => localStorage.getItem('learning_language')),
  ).toBe('de')
})

test('cập nhật một thiết lập không reset các thiết lập còn lại', async ({
  page,
}) => {
  const seeded = await api(page).post('/api/settings', {
    dailyReviewTarget: 45,
    speechRate: 1.2,
    primaryLang: 'de',
    dailyReminder: false,
  })
  expect(seeded.status).toBe(200)

  const partial = await api(page).post('/api/settings', { primaryLang: 'cs' })
  expect(partial.status).toBe(200)
  expect(partial.body).toMatchObject({
    primaryLang: 'cs',
    dailyReviewTarget: 45,
    speechRate: 1.2,
    dailyReminder: false,
  })
})
