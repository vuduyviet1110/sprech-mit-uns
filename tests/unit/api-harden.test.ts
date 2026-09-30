import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, beforeEach } from 'vitest'
import {
  _resetRateLimitBuckets,
  assertRateLimit,
  checkRateLimit,
} from '~/server/utils/rate-limit'

describe('API harden rate limits', () => {
  beforeEach(() => {
    _resetRateLimitBuckets()
  })

  it('TTS-like key blocks after 60/min', () => {
    for (let i = 0; i < 60; i++) {
      expect(checkRateLimit('tts:1.1.1.1', 60, 60_000).ok).toBe(true)
    }
    expect(checkRateLimit('tts:1.1.1.1', 60, 60_000).ok).toBe(false)
  })

  it('scrape limit is low (10/hour)', () => {
    for (let i = 0; i < 10; i++) {
      assertRateLimit('news:scrape:ip', 10, 3600_000)
    }
    expect(() => assertRateLimit('news:scrape:ip', 10, 3600_000)).toThrow()
  })
})

describe('rooms guard', () => {
  it('blocks rooms in production unless SMU_ENABLE_ROOMS=1', async () => {
    const prev = process.env.NODE_ENV
    const prevFlag = process.env.SMU_ENABLE_ROOMS
    process.env.NODE_ENV = 'production'
    delete process.env.SMU_ENABLE_ROOMS
    const { assertRoomsEnabled } = await import('~/server/utils/rooms-guard')
    expect(() => assertRoomsEnabled()).toThrow()
    process.env.SMU_ENABLE_ROOMS = '1'
    expect(() => assertRoomsEnabled()).not.toThrow()
    process.env.NODE_ENV = prev
    if (prevFlag === undefined) delete process.env.SMU_ENABLE_ROOMS
    else process.env.SMU_ENABLE_ROOMS = prevFlag
  })
})

describe('session-scoped learning APIs (policy)', () => {
  it('topic detail and youtube lessons must use requireUserId, not query userId', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(__dirname, '../..')
    const topicApi = readFileSync(
      resolve(root, 'server/api/topics/[id].ts'),
      'utf8',
    )
    const youtubeApi = readFileSync(
      resolve(root, 'server/api/youtube/lessons.get.ts'),
      'utf8',
    )
    const quizPersist = readFileSync(
      resolve(root, 'server/api/quiz/topic/[topicId]/generate.post.ts'),
      'utf8',
    )
    const quizSubmit = readFileSync(
      resolve(root, 'server/api/quiz/submit.ts'),
      'utf8',
    )
    const dictPost = readFileSync(
      resolve(root, 'server/api/dictionary/index.ts'),
      'utf8',
    )
    const vocabById = readFileSync(
      resolve(root, 'server/api/vocabulary/[id].ts'),
      'utf8',
    )
    const dictationGet = readFileSync(
      resolve(root, 'server/api/youtube/progress.get.ts'),
      'utf8',
    )
    const dictationPost = readFileSync(
      resolve(root, 'server/api/youtube/progress.post.ts'),
      'utf8',
    )

    expect(topicApi).toContain('requireUserId')
    expect(topicApi).not.toMatch(/getQuery\(event\).*userId|const \{ userId \} = getQuery/)
    expect(youtubeApi).toContain('requireUserId')
    expect(youtubeApi).toMatch(/where:\s*\{[^}]*userId/)
    expect(quizPersist).toContain('requireCatalogWriter')
    expect(quizSubmit).toContain('gradeQuizAnswer')
    expect(quizSubmit).toMatch(/isCorrect:\s*gradeQuizAnswer/)
    expect(dictPost).toContain('requireAdmin')
    expect(vocabById).toContain('requireUserId')
    expect(vocabById).not.toContain('resolveUserId')
    expect(dictationGet).toContain('requireUserId')
    expect(dictationGet).toMatch(/where:\s*\{[^}]*userId/)
    expect(dictationPost).toContain('requireUserId')
    expect(dictationPost).toMatch(/where:\s*\{[^}]*userId/)
    // Tiến độ/mở khoá phải do server suy ra, không nhận trực tiếp từ body client
    expect(dictationPost).not.toMatch(/clipsDone\s*[:=]\s*(body|Number\(body)/)
  })

  it('youtube parse không được im lặng rơi về video mặc định', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(__dirname, '../..')
    const parseApi = readFileSync(
      resolve(root, 'server/api/youtube/parse.get.ts'),
      'utf8',
    )

    expect(parseApi).toContain('extractYoutubeId')
    // URL sai phải ném lỗi, không được thay bằng một video có sẵn
    expect(parseApi).not.toMatch(/3iV2WK1/)
    expect(parseApi).toMatch(/statusCode:\s*400/)
    // Client cần biết khi phụ đề không đúng ngôn ngữ đang học
    expect(parseApi).toContain('languageFallback')
  })

  it('API luyện phát âm & bài báo đã lưu bám đúng chính sách phiên', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(__dirname, '../..')
    const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

    const sessionScoped = [
      'server/api/practice/drill.get.ts',
      'server/api/practice/drill.post.ts',
      'server/api/news/saved.get.ts',
      'server/api/news/saved.post.ts',
      'server/api/news/saved.delete.ts',
    ]
    for (const path of sessionScoped) {
      const src = read(path)
      expect(src, path).toContain('requireUserId')
      // userId chỉ được lấy từ phiên, không nhận từ client
      expect(src, path).not.toMatch(/body\??\.userId|query\.userId/)
    }

    // Đường ghi phải có rate limit
    for (const path of sessionScoped.filter((p) => !p.endsWith('.get.ts'))) {
      expect(read(path), path).toContain('assertRateLimit')
    }

    // Lịch ôn do server suy ra từ trạng thái đang có, không nhận thẳng từ body
    const drillStore = read('server/utils/drill-store.ts')
    expect(drillStore).toContain('applyDrillSuccess')
    expect(drillStore).not.toMatch(/failCount:\s*Number\(body/)
  })

  it('"xoá toàn bộ tiến độ" không được để sót bảng nào', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'server/api/progress/reset.post.ts'),
      'utf8',
    )
    for (const model of [
      'userWordProgress',
      'quizAttempt',
      'userDailyProgress',
      'userLessonProgress',
      'userPronunciationDrill',
      'userSavedArticle',
    ]) {
      expect(src, model).toContain(`${model}.deleteMany`)
    }
  })

  it('luyện phát âm không còn tự nhét từ vào hàng ôn SRS', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'composables/use-pronunciation-drill.ts'),
      'utf8',
    )
    // Mọi từ nhại lệch từng tạo một thẻ SRS quality 2, còn lần đúng không báo lại.
    expect(src).not.toContain('/api/srs/review')
    expect(src).toContain('/api/practice/drill')
  })

  it('chỉ một composable sở hữu localStorage key của thiết lập', () => {
    const root = resolve(__dirname, '../..')
    const owners = [
      'composables/use-daily-path.ts',
      'composables/use-daily-quests.ts',
    ]
    // `use-daily-quests` từng đọc thẳng key của `use-daily-path`; đổi cách lưu
    // ở một chỗ là gãy chỗ kia.
    for (const path of owners) {
      expect(readFileSync(resolve(root, path), 'utf8'), path).not.toContain(
        'app_learning_settings_v1',
      )
    }
    expect(
      readFileSync(resolve(root, 'composables/use-learning-settings.ts'), 'utf8'),
    ).toContain('app_learning_settings_v1')
  })

  it('client không gửi userId lên các endpoint theo phiên', () => {
    const root = resolve(__dirname, '../..')
    for (const path of [
      'composables/use-daily-path.ts',
      'composables/use-daily-quests.ts',
    ]) {
      const src = readFileSync(resolve(root, path), 'utf8')
      // Server lấy danh tính từ phiên httpOnly và bỏ qua giá trị client gửi lên.
      expect(src, path).not.toMatch(/userId:\s*uid/)
      expect(src, path).not.toMatch(/\?userId=\$\{uid\}/)
    }
  })

  it('tab từ vựng dùng từ thật của bài, không phải dữ liệu mẫu', () => {
    const root = resolve(__dirname, '../..')
    const src = readFileSync(
      resolve(root, 'components/layouts/Page/Section/Progress/VocabularyExtractor.vue'),
      'utf8',
    )
    // Từng hardcode danh sách từ nghĩa tiếng Anh và ghi tiến độ dưới id 'user123'
    expect(src).not.toContain("'user123'")
    expect(src).not.toMatch(/\{\{\s*word\.exampleTranslation\s*\}\}/)
    expect(src).not.toMatch(/const vocabularyData = \[/)
    expect(src).toContain('useSession')
  })

  it('phòng học nhóm phải được dọn khỏi bộ nhớ', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'server/utils/roomStore.ts'),
      'utf8',
    )
    // Không có chỗ nào xoá thì mọi phòng từng tạo nằm lại trong RAM mãi mãi
    expect(src).toContain('rooms.delete')
    expect(src).toContain('pruneExpiredRooms')
  })

  it('mốc lộ trình ngày chỉ được bật, không được tắt', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'server/api/daily/progress.ts'),
      'utf8',
    )
    // Spread thuần (last-write-wins) khiến client gửi {srs:false} xoá sạch
    // lộ trình đã hoàn thành trong ngày.
    expect(src).not.toMatch(
      /const nextPath = \{[\s\S]{0,120}\.\.\.\(\(body\.pathCompleted/,
    )
    expect(src).toMatch(/nextPath\[k\]\s*=\s*!!nextPath\[k\]\s*\|\|\s*!!v/)
    // POST nhận date ở body; chỉ đọc query thì mọi lần ghi rơi vào hôm nay
    expect(src).toMatch(/body\?\.date/)
  })

  it('thiết lập phải nạp lại sau khi đăng nhập', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'composables/use-learning-settings.ts'),
      'utf8',
    )
    // Chỉ dựa vào cờ `loaded` thì mở app lúc chưa đăng nhập sẽ đặt cờ rồi thất
    // bại, và /setting sau đó hiện mặc định — bấm Lưu là ghi đè DB.
    expect(src).toContain('loadedFor')
    expect(src).toMatch(/loadedFor\s*===\s*userId\.value/)
  })

  it('cập nhật thiết lập là partial — không reset field không gửi lên', () => {
    const src = readFileSync(
      resolve(__dirname, '../..', 'server/api/settings/index.ts'),
      'utf8',
    )
    expect(src).toContain('hasOwnProperty')
    // Trước đây POST mỗi primaryLang sẽ kéo dailyReviewTarget về mặc định
    expect(src).not.toMatch(/Number\(body\.dailyReviewTarget\)\s*\|\|\s*defaults/)
  })
})
