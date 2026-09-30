import { describe, expect, it } from 'vitest'
import { CLICK_TIPS, ROUTE_TIPS, idleAllowedFor, tipPoolFor } from '~/utils/mascot-tips'

describe('idleAllowedFor', () => {
  it('cho nhắc ở trang có bài tập', () => {
    expect(idleAllowedFor('/review')).toBe(true)
    expect(idleAllowedFor('/practice/shadowing')).toBe(true)
    expect(idleAllowedFor('/lesson/a1-1')).toBe(true)
    expect(idleAllowedFor('/today')).toBe(true)
  })

  it('im ở trang đọc — ngồi lâu là đang đọc, không phải lơ đãng', () => {
    expect(idleAllowedFor('/sub-menu/news')).toBe(false)
    expect(idleAllowedFor('/dictionary')).toBe(false)
    expect(idleAllowedFor('/progress')).toBe(false)
    expect(idleAllowedFor('/')).toBe(false)
  })

  it('không vỡ với đầu vào rỗng', () => {
    expect(idleAllowedFor('')).toBe(false)
    expect(idleAllowedFor(undefined as unknown as string)).toBe(false)
  })
})

describe('tipPoolFor', () => {
  it('trả mẹo riêng của trang khi có', () => {
    const youtube = tipPoolFor('/sub-menu/youtube')
    expect(youtube.tips).toHaveLength(3)
    expect(youtube.tips[0]!.line).toContain('Nghe cả câu')

    const review = tipPoolFor('/review')
    expect(review.tips).toHaveLength(2)
  })

  it('rơi về mẹo chung ở trang không có mẹo riêng', () => {
    const pool = tipPoolFor('/progress')
    expect(pool.key).toBe('*')
    expect(pool.tips).toBe(CLICK_TIPS)
  })

  it('mỗi nhóm có khoá riêng để con trỏ xoay vòng không dẫm nhau', () => {
    const keys = ROUTE_TIPS.map((r) => r.match.source)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).not.toContain('*')

    expect(tipPoolFor('/review').key).not.toBe(tipPoolFor('/sub-menu/news').key)
  })

  it('xoay hết vòng rồi mới lặp lại', () => {
    const { tips } = tipPoolFor('/sub-menu/youtube')
    const seen = [0, 1, 2].map((i) => tips[i % tips.length]!.line)
    expect(new Set(seen).size).toBe(3)
    expect(tips[3 % tips.length]!.line).toBe(seen[0])
  })
})

describe('nội dung mẹo', () => {
  it('không có câu rỗng hay trùng nhau', () => {
    const all = [...CLICK_TIPS, ...ROUTE_TIPS.flatMap((r) => r.tips)]
    for (const tip of all) expect(tip.line.trim().length).toBeGreaterThan(8)
    const lines = all.map((t) => t.line)
    expect(new Set(lines).size).toBe(lines.length)
  })
})
