import { describe, expect, it } from 'vitest'
import {
  CZECH_FEEDS,
  GERMAN_FEEDS,
  allSourcesLabel,
  feedsForLanguage,
} from '~/utils/news-sources'

describe('news sources', () => {
  it('không còn feed ČT24 đã chết (RSS trả 404)', () => {
    const keys = [...CZECH_FEEDS, ...GERMAN_FEEDS].map((f) => f.key)
    expect(keys).not.toContain('ct24')
    const urls = [...CZECH_FEEDS, ...GERMAN_FEEDS].map((f) => f.url)
    expect(urls.some((u) => u.includes('ceskatelevize'))).toBe(false)
  })

  it('mọi feed có key, name, url https duy nhất', () => {
    const all = [...CZECH_FEEDS, ...GERMAN_FEEDS]
    for (const f of all) {
      expect(f.key, JSON.stringify(f)).toMatch(/^[a-z0-9-]+$/)
      expect(f.name.length).toBeGreaterThan(0)
      expect(f.url).toMatch(/^https:\/\//)
    }
    const keys = all.map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('"all" không phải key của feed thật — nó là mục tổng hợp ở dropdown', () => {
    expect([...CZECH_FEEDS, ...GERMAN_FEEDS].map((f) => f.key)).not.toContain(
      'all',
    )
  })

  it('feedsForLanguage chọn đúng danh sách', () => {
    expect(feedsForLanguage('cs')).toBe(CZECH_FEEDS)
    expect(feedsForLanguage('de')).toBe(GERMAN_FEEDS)
    // ngôn ngữ lạ mặc định về tiếng Đức
    expect(feedsForLanguage('en')).toBe(GERMAN_FEEDS)
  })

  it('nhãn "Tất cả" suy ra từ danh sách nên không thể lệch', () => {
    const csLabel = allSourcesLabel('cs')
    expect(csLabel).toContain('tiếng Séc')
    for (const f of CZECH_FEEDS) {
      expect(csLabel).toContain(f.name)
    }
    expect(csLabel).not.toContain('ČT24')

    const deLabel = allSourcesLabel('de')
    expect(deLabel).toContain('tiếng Đức')
    for (const f of GERMAN_FEEDS) {
      expect(deLabel).toContain(f.name)
    }
  })
})
