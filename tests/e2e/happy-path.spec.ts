import { test, expect } from '@playwright/test'

const DEMO_EMAIL = process.env.E2E_EMAIL || 'demo@sprech.local'
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'demo123'

/**
 * Gọi API từ trong trang — `page.request` không gửi cookie phiên (`secure: true`
 * trên http://127.0.0.1). Xem README mục "Viết test e2e cần đăng nhập".
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

const login = async (page: import('@playwright/test').Page) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  const res = await api(page).post('/api/auth/login', {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  expect(res.status).toBe(200)
}

test.describe('luồng chính', () => {
  test('các trang học chính mở được sau khi đăng nhập', async ({ page }) => {
    await login(page)

    for (const path of [
      '/today',
      '/review',
      '/progress',
      '/practice/shadowing',
      '/practice/pronunciation',
      '/sub-menu/news',
    ]) {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto(path, { waitUntil: 'domcontentloaded' })
      // Không bị middleware đá về /login
      await expect(page, path).toHaveURL(new RegExp(path.replace(/\//g, '\\/')))
      expect(errors, `${path} ném lỗi runtime`).toEqual([])

      page.removeAllListeners('pageerror')
    }
  })

  /**
   * Mốc lộ trình đã hoàn thành phải sống sót. `pathCompleted` từng gộp bằng
   * spread thuần, nên một client gửi `{srs:false}` sẽ xoá sạch tiến độ ngày.
   */
  test('mốc lộ trình hoàn thành không bị client ghi đè về false', async ({
    page,
  }) => {
    await login(page)
    const date = '2026-12-31'

    const done = await api(page).post('/api/daily/progress', {
      date,
      pathCompleted: { srs: true, shadowing: true, recall: true },
    })
    expect(done.status).toBe(200)
    expect(done.body.pathCompleted).toMatchObject({
      srs: true,
      shadowing: true,
      recall: true,
    })

    const reset = await api(page).post('/api/daily/progress', {
      date,
      pathCompleted: { srs: false, shadowing: false, recall: false },
    })
    expect(reset.body.pathCompleted).toMatchObject({
      srs: true,
      shadowing: true,
      recall: true,
    })
  })

  test('POST daily/progress ghi đúng ngày gửi trong body', async ({ page }) => {
    await login(page)
    const date = '2026-12-30'

    const res = await api(page).post('/api/daily/progress', {
      date,
      pathCompleted: { recall: true },
    })
    expect(res.body.date).toBe(date)

    const read = await api(page).get(`/api/daily/progress?date=${date}`)
    expect(read.body.pathCompleted).toMatchObject({ recall: true })
  })

  test('/setting hiện thiết lập thật, không phải mặc định', async ({ page }) => {
    await login(page)
    await api(page).post('/api/settings', { dailyReviewTarget: 37 })

    await page.goto('/setting', { waitUntil: 'domcontentloaded' })

    // Ô nhập phải mang giá trị 37; nếu hiện mặc định 20 thì bấm Lưu sẽ ghi đè DB.
    const targetInput = page.locator('input[type="number"]').first()
    await expect(targetInput).toHaveValue('37', { timeout: 15_000 })
  })

  /**
   * Điểm mấu chốt của việc chuyển hai kho này từ localStorage sang DB: xoá sạch
   * bộ đệm trình duyệt thì dữ liệu vẫn phải quay về từ server.
   */
  test('bài báo đã lưu sống sót khi xoá localStorage', async ({ page }) => {
    await login(page)
    await page.goto('/sub-menu/news', { waitUntil: 'domcontentloaded' })
    // Đợi plugin hydrate xong rồi mới đọc ngôn ngữ — trang lọc bài theo ngôn ngữ
    // đang học, gắn sai ngôn ngữ thì bài bị ẩn và tưởng là mất.
    await page.waitForTimeout(2000)
    const lang = await page.evaluate(() =>
      localStorage.getItem('learning_language'),
    )

    await page.evaluate(async (lang) => {
      await fetch('/api/news/saved', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      await fetch('/api/news/saved', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          article: {
            id: 'e2e-persist',
            title: 'BÀI KIỂM THỬ LƯU TRỮ',
            content: 'Nội dung đủ dài để được lưu lại.',
            level: 'A2',
            lang,
            date: '29.09.2026',
          },
        }),
      })
      localStorage.removeItem('sprech_saved_news_articles')
      localStorage.removeItem('smu_news_migrated_v1')
    }, lang)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(
      page.getByText('BÀI KIỂM THỬ LƯU TRỮ').first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('mục luyện phát âm sống sót khi xoá localStorage', async ({ page }) => {
    await login(page)
    await page.goto('/practice/pronunciation', { waitUntil: 'domcontentloaded' })

    await page.evaluate(async () => {
      const call = (body: unknown) =>
        fetch('/api/practice/drill', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
      await call({ action: 'clear' })
      await call({
        action: 'fail',
        language: 'de',
        items: [{ word: 'Straße', phrase: 'Die Straße ist lang' }],
      })
      localStorage.removeItem('pronunciation_drill_v1')
      localStorage.removeItem('smu_drill_migrated_v1')
    })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Straße').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('chỉ tiêu SRS trên /today lấy từ hồ sơ, không phải mặc định', async ({
    page,
  }) => {
    await login(page)
    await api(page).post('/api/settings', { dailyReviewTarget: 43 })

    await page.goto('/today', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/\/\s*43/).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})

test.describe('cáo đồng hành', () => {
  test('ghi nhận khi hoàn thành một khối lộ trình', async ({ page }) => {
    await login(page)
    await page.goto('/today', { waitUntil: 'domcontentloaded' })
    await page.evaluate(async () => {
      localStorage.removeItem('daily_path_v1')
      await fetch('/api/progress/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
    })

    await page.goto('/practice/recall', { waitUntil: 'domcontentloaded' })
    const inputs = page.locator('textarea, input[type=text]')
    await inputs.first().waitFor({ state: 'visible', timeout: 15_000 })
    const n = Math.min(await inputs.count(), 3)
    for (let i = 0; i < n; i++) {
      await inputs.nth(i).fill(`Das ist ein Test Satz ${i}.`)
    }

    await page
      .locator('button')
      .filter({ hasText: /hoàn thành|kết thúc|xong/i })
      .first()
      .click({ force: true })

    // Trước đây cáo khen từng câu lẻ nhưng im lặng đúng lúc xong cả một khối.
    await expect(
      page.getByText(/Xong khối|Còn \d+ khối|Xong cả \d+ khối/).first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('mẹo khi bấm cáo bám theo trang đang học', async ({ page }) => {
    await login(page)
    await page.goto('/sub-menu/youtube', { waitUntil: 'domcontentloaded' })

    const fox = page.locator('[aria-label*="Cáo đồng hành"]').first()
    await fox.waitFor({ state: 'visible', timeout: 15_000 })
    await fox.click({ force: true })

    await expect(
      page.getByText(/Nghe cả câu|0\.75x|Gõ sai chính tả/).first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('chào lại theo số ngày vắng, bằng ngôn ngữ đang học', async ({ page }) => {
    await login(page)

    // Giả lập "học lần cuối 5 ngày trước, còn 12 thẻ tới hạn".
    await page.route('**/api/progress/stats', async (route) => {
      const res = await route.fetch()
      const json = await res.json()
      const d = new Date()
      d.setDate(d.getDate() - 5)
      json.lastStudyDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      json.currentStreak = 0
      json.dueSrsCount = 12
      await route.fulfill({ json })
    })

    await page.goto('/today', { waitUntil: 'domcontentloaded' })

    // Chào bằng tiếng đang học, luôn kèm nghĩa tiếng Việt trong ngoặc.
    await expect(
      page
        .getByText(
          /(Guten (Morgen|Tag|Abend)!|Dobré ráno!|Dobrý (den|večer)!)\s*\(/,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 })

    const body = await page.locator('body').innerText()
    expect(body).toMatch(/5 ngày/)
    expect(body).toMatch(/12 thẻ/)
  })
})
