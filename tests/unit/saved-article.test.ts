import { describe, expect, it } from 'vitest'
import {
  MAX_ARTICLE_CONTENT,
  MAX_SAVED_ARTICLES,
  sanitizeSavedArticle,
} from '~/utils/saved-article'

const valid = {
  id: 'news-de-1',
  title: 'Guten Tag Berlin',
  date: '08.09.2026',
  level: 'A1',
  summary: 'Tóm tắt',
  content: 'Heute ist das Wetter in Berlin sehr schön.',
  sourceUrl: 'https://tagesschau.de/x',
  sourceName: 'Tagesschau',
  lang: 'de',
}

describe('sanitizeSavedArticle', () => {
  it('giữ nguyên bài hợp lệ và đổi id → articleId', () => {
    const out = sanitizeSavedArticle(valid)
    expect(out).toMatchObject({
      articleId: 'news-de-1',
      title: 'Guten Tag Berlin',
      level: 'A1',
      language: 'de',
      sourceName: 'Tagesschau',
    })
  })

  it('chấp nhận cả khoá articleId lẫn id', () => {
    expect(sanitizeSavedArticle({ ...valid, id: undefined, articleId: 'x1' })
      ?.articleId).toBe('x1')
  })

  it('cắt toàn văn ở 40.000 ký tự', () => {
    const out = sanitizeSavedArticle({
      ...valid,
      content: 'a'.repeat(MAX_ARTICLE_CONTENT + 5000),
    })
    expect(out!.content).toHaveLength(MAX_ARTICLE_CONTENT)
  })

  it('cắt tiêu đề và tóm tắt quá dài', () => {
    const out = sanitizeSavedArticle({
      ...valid,
      title: 't'.repeat(999),
      summary: 's'.repeat(9999),
    })
    expect(out!.title.length).toBeLessThanOrEqual(300)
    expect(out!.summary.length).toBeLessThanOrEqual(1000)
  })

  it('chuẩn hoá level lạ về A2', () => {
    expect(sanitizeSavedArticle({ ...valid, level: 'Z9' })!.level).toBe('A2')
    expect(sanitizeSavedArticle({ ...valid, level: undefined })!.level).toBe('A2')
    expect(sanitizeSavedArticle({ ...valid, level: 'b1' })!.level).toBe('B1')
  })

  it('chuẩn hoá ngôn ngữ lạ về de, giữ cs', () => {
    expect(sanitizeSavedArticle({ ...valid, lang: 'en' })!.language).toBe('de')
    expect(sanitizeSavedArticle({ ...valid, lang: 'cs' })!.language).toBe('cs')
    expect(sanitizeSavedArticle({ ...valid, lang: undefined, language: 'cs' })!
      .language).toBe('cs')
  })

  it('nguồn thiếu thì thành null, không phải chuỗi rỗng', () => {
    const out = sanitizeSavedArticle({
      ...valid,
      sourceUrl: '',
      sourceName: '   ',
    })
    expect(out!.sourceUrl).toBeNull()
    expect(out!.sourceName).toBeNull()
  })

  it('loại field lạ — client không tự thêm cột được', () => {
    const out = sanitizeSavedArticle({ ...valid, isSaved: true, evil: 'x' })
    expect(out).not.toHaveProperty('isSaved')
    expect(out).not.toHaveProperty('evil')
    expect(Object.keys(out!).sort()).toEqual([
      'articleId',
      'content',
      'date',
      'language',
      'level',
      'sourceName',
      'sourceUrl',
      'summary',
      'title',
    ])
  })

  it('trả null khi thiếu trường bắt buộc', () => {
    expect(sanitizeSavedArticle({ ...valid, id: '', articleId: '' })).toBeNull()
    expect(sanitizeSavedArticle({ ...valid, title: '   ' })).toBeNull()
    expect(sanitizeSavedArticle({ ...valid, content: '' })).toBeNull()
  })

  it('trả null với đầu vào không phải object', () => {
    for (const bad of [null, undefined, 'x', 42, []]) {
      expect(sanitizeSavedArticle(bad as unknown)).toBeNull()
    }
  })

  it('hạn mức là số dương hợp lý', () => {
    expect(MAX_SAVED_ARTICLES).toBeGreaterThan(0)
    expect(MAX_ARTICLE_CONTENT).toBeGreaterThan(1000)
  })
})
