import { test, expect } from '@playwright/test'

const DEMO_EMAIL = process.env.E2E_EMAIL || 'demo@sprech.local'
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'demo123'

async function login(page: import('@playwright/test').Page) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
}

/**
 * Đặt lại cài đặt cáo qua API — không phụ thuộc vào UI đang ở trạng thái nào.
 *
 * Gọi `fetch` từ trong trang chứ không dùng `page.request`: cái sau là context
 * riêng, không mang cookie phiên của trang nên luôn bị 401.
 */
async function setMascot(page: import('@playwright/test').Page, on: boolean) {
  const status = await page.evaluate(async (value) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mascot: value }),
    })
    return res.status
  }, on)
  expect(status).toBe(200)
}

/**
 * Dùng `/` và `/setting` làm sân test: hai trang này không đi qua guard đăng
 * nhập của `auth.global.ts`, nên test bám vào hành vi của cáo chứ không dính
 * vào một lỗi phiên đang có sẵn ở các route được bảo vệ (`smoke.spec.ts` cũng
 * hỏng ở đúng chỗ đó).
 */
test.describe('cáo đồng hành', () => {
  // Cáo phải bật trước mỗi test. Nếu một lần chạy trước tắt nó rồi hỏng giữa
  // chừng, mọi test sau sẽ fail vì cáo không mount — bẫy đã sập một lần.
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Cần một trang đã mở để `fetch` chạy kèm cookie phiên.
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await setMascot(page, true)
  })

  test.afterEach(async ({ page }) => {
    await setMascot(page, true)
  })

  test('hiện mặc định và bấm ra được lời thoại', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const mascot = page.getByTestId('study-mascot')
    await expect(mascot).toBeVisible()

    // Bấm "Mẹo" phải ra một câu — mẹo của trang, hoặc đề nghị việc kèm nút.
    await page.getByTestId('mascot-tip').click()
    await expect(page.getByTestId('mascot-line')).toBeVisible()
    const text = (await page.getByTestId('mascot-line').innerText()).trim()
    expect(text.length).toBeGreaterThan(5)
  })

  test('sprite cảm xúc chỉ tải khi cần', async ({ page }) => {
    const reactionHits: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('fox-reactions')) reactionHits.push(req.url())
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('study-mascot')).toBeVisible()
    // Chưa có phản ứng nào thì không được tải sprite cảm xúc.
    expect(reactionHits).toHaveLength(0)

    // Rê chuột vào cáo thì mới tải.
    await page.getByTestId('study-mascot').hover()
    await expect.poll(() => reactionHits.length, { timeout: 10_000 }).toBeGreaterThan(0)
  })

  test('thu nhỏ rồi nhớ trạng thái qua lần tải sau', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.getByTestId('mascot-collapse').click()
    await expect(page.getByTestId('mascot-tip')).toBeHidden()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('mascot-tip')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Hiện cáo đồng hành' })).toBeVisible()
  })

  test('tắt trong Cài đặt thì cáo không còn xuất hiện', async ({ page }) => {
    await page.goto('/setting', { waitUntil: 'domcontentloaded' })

    const toggle = page
      .locator('label', { hasText: 'Hiện cáo đồng hành' })
      .locator('input[type="checkbox"]')
    await expect(toggle).toBeChecked()
    await toggle.uncheck()
    await page.getByRole('button', { name: 'Lưu Cấu Hình' }).click()

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('study-mascot')).toHaveCount(0)
    // `afterEach` bật lại — không để trạng thái tắt rơi sang test sau.
  })

  test('cáo im khi ngồi lâu ở trang không có bài tập', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('study-mascot')).toBeVisible()

    // Idle watch chạy mỗi 8s, ngưỡng 50s. Trang không có bài tập thì không nói.
    await page.waitForTimeout(12_000)
    await expect(page.getByTestId('mascot-line')).toHaveCount(0)
  })
})
