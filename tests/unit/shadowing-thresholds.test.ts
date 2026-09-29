import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SCORE_BAND_LABEL,
  SCORE_EXCELLENT,
  SCORE_FAIR,
  SCORE_GOOD,
  SCORE_PASS,
  isPass,
  scoreBand,
} from '~/utils/shadowing-score'

describe('scoreBand', () => {
  it('chia bậc đúng tại biên', () => {
    const cases: [number, string][] = [
      [0, 'weak'],
      [59, 'weak'],
      [60, 'fair'],
      [74, 'fair'],
      [75, 'good'],
      [89, 'good'],
      [90, 'excellent'],
      [100, 'excellent'],
    ]
    for (const [score, band] of cases) {
      expect(scoreBand(score), `điểm ${score}`).toBe(band)
    }
  })

  it('mỗi bậc có nhãn riêng', () => {
    const labels = Object.values(SCORE_BAND_LABEL)
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels.every((l) => l.length > 0)).toBe(true)
  })

  it('ngưỡng xếp giảm dần', () => {
    expect(SCORE_EXCELLENT).toBeGreaterThan(SCORE_GOOD)
    expect(SCORE_GOOD).toBeGreaterThan(SCORE_FAIR)
  })
})

describe('isPass', () => {
  it('đạt từ SCORE_PASS trở lên', () => {
    expect(isPass(SCORE_PASS - 1)).toBe(false)
    expect(isPass(SCORE_PASS)).toBe(true)
    expect(isPass(100)).toBe(true)
    expect(isPass(0)).toBe(false)
  })

  it('mức đạt trùng bậc "good" — màu và kết luận không lệch nhau', () => {
    expect(SCORE_PASS).toBe(SCORE_GOOD)
    expect(scoreBand(SCORE_PASS)).toBe('good')
  })
})

// Ba trang từng tự đặt số riêng (80 / 75 / 60) cho cùng một thang điểm, nên cùng
// một lần nói ra ba kết luận đạt/không khác nhau tuỳ màn hình.
describe('các trang luyện dùng chung một ngưỡng', () => {
  const root = resolve(__dirname, '../..')
  const pages = [
    'app/pages/sub-menu/youtube.vue',
    'app/pages/practice/shadowing.vue',
    'app/pages/practice/pronunciation.vue',
  ]

  it('không trang nào so sánh điểm với số cứng', () => {
    for (const page of pages) {
      const src = readFileSync(resolve(root, page), 'utf8')
      expect(src, page).toMatch(/isPass|scoreBand/)
      expect(
        src.match(/\bscore\s*>=\s*\d+/g),
        `${page} còn so sánh điểm với số cứng`,
      ).toBeNull()
    }
  })
})
