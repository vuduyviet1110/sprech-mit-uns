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

    expect(topicApi).toContain('requireUserId')
    expect(topicApi).not.toMatch(/getQuery\(event\).*userId|const \{ userId \} = getQuery/)
    expect(youtubeApi).toContain('requireUserId')
    expect(youtubeApi).toMatch(/where:\s*\{[^}]*userId/)
    expect(quizPersist).toContain('requireCatalogWriter')
    expect(quizSubmit).toContain('gradeQuizAnswer')
    expect(quizSubmit).toMatch(/isCorrect:\s*gradeQuizAnswer/)
    expect(dictPost).toContain('requireCatalogWriter')
    expect(vocabById).toContain('requireUserId')
    expect(vocabById).not.toContain('resolveUserId')
  })
})
