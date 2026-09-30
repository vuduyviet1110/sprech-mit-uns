import { describe, expect, it } from 'vitest'
import {
  DRILL_INTERVALS_DAYS,
  applyDrillFailure,
  applyDrillSuccess,
  drillDueDate,
  drillItemKey,
  nextDrillIntervalDays,
} from '~/utils/pronunciation-schedule'

describe('nextDrillIntervalDays', () => {
  it('giãn 1 → 3 → 7 ngày theo chuỗi lần đúng', () => {
    expect(nextDrillIntervalDays(0)).toBe(1)
    expect(nextDrillIntervalDays(1)).toBe(3)
    expect(nextDrillIntervalDays(2)).toBe(7)
  })

  it('giữ ở 7 ngày khi chuỗi đúng dài hơn thang', () => {
    expect(nextDrillIntervalDays(3)).toBe(7)
    expect(nextDrillIntervalDays(99)).toBe(7)
  })

  it('chịu được đầu vào âm hoặc lẻ', () => {
    expect(nextDrillIntervalDays(-5)).toBe(1)
    expect(nextDrillIntervalDays(1.9)).toBe(3)
  })
})

describe('applyDrillSuccess', () => {
  // Hồi quy: bản cũ giảm failCount rồi lấy chính nó làm chỉ số thang lịch, nên
  // từ sai đúng một lần nhảy thẳng 7 ngày ngay lần đúng đầu tiên.
  it('từ sai một lần, lần đúng đầu tiên phải ra 1 ngày — KHÔNG phải 7', () => {
    const out = applyDrillSuccess({ failCount: 1, successStreak: 0 })
    expect(out.intervalDays).toBe(1)
    expect(out.intervalDays).not.toBe(7)
  })

  it('ba lần đúng liên tiếp đi đúng thang 1 → 3 → 7', () => {
    let s = { failCount: 3, successStreak: 0 }
    const seen: number[] = []
    for (let i = 0; i < 3; i++) {
      const out = applyDrillSuccess(s)
      seen.push(out.intervalDays)
      s = { failCount: out.failCount, successStreak: out.successStreak }
    }
    expect(seen).toEqual([1, 3, 7])
  })

  it('tăng chuỗi đúng và giảm failCount, không xuống dưới 0', () => {
    expect(applyDrillSuccess({ failCount: 2, successStreak: 0 })).toMatchObject({
      failCount: 1,
      successStreak: 1,
    })
    expect(applyDrillSuccess({ failCount: 0, successStreak: 5 }).failCount).toBe(0)
  })
})

describe('applyDrillFailure', () => {
  it('đến hạn ngay và xoá chuỗi đúng', () => {
    const out = applyDrillFailure({ failCount: 2, successStreak: 3 })
    expect(out).toEqual({ failCount: 3, successStreak: 0, intervalDays: 0 })
  })

  it('mục mới bắt đầu từ failCount 1', () => {
    expect(applyDrillFailure()).toEqual({
      failCount: 1,
      successStreak: 0,
      intervalDays: 0,
    })
  })

  it('sai sau khi đã đúng vài lần thì quay lại 1 ngày', () => {
    const failed = applyDrillFailure({ failCount: 1, successStreak: 2 })
    expect(applyDrillSuccess(failed).intervalDays).toBe(1)
  })
})

describe('drillItemKey', () => {
  it('hạ chữ thường phần từ và cắt cụm ở 40 ký tự', () => {
    const phrase = 'x'.repeat(60)
    const key = drillItemKey('de', 'Straße', phrase)
    expect(key).toBe(`de::straße::${'x'.repeat(40)}`)
  })

  it('phân biệt theo ngôn ngữ', () => {
    expect(drillItemKey('de', 'ano', 'ano')).not.toBe(
      drillItemKey('cs', 'ano', 'ano'),
    )
  })

  it('giữ nguyên biểu thức cũ để dữ liệu localStorage vẫn khớp', () => {
    const language = 'cs'
    const word = 'Dobrý'
    const phrase = 'Dobrý den, jak se máte?'
    const legacy = `${language}::${word.toLowerCase()}::${phrase.slice(0, 40)}`
    expect(drillItemKey(language, word, phrase)).toBe(legacy)
  })

  it('không nổ với đầu vào rỗng', () => {
    expect(drillItemKey('de', '', '')).toBe('de::::')
  })
})

describe('drillDueDate', () => {
  it('cộng đúng số ngày vào mốc cho trước', () => {
    const from = new Date('2026-09-29T08:00:00.000Z')
    expect(drillDueDate(3, from).toISOString().slice(0, 10)).toBe('2026-10-02')
  })

  it('interval 0 nghĩa là đến hạn ngay', () => {
    const from = new Date('2026-09-29T08:00:00.000Z')
    expect(drillDueDate(0, from).getTime()).toBe(from.getTime())
  })

  it('không lùi về quá khứ khi interval âm', () => {
    const from = new Date('2026-09-29T08:00:00.000Z')
    expect(drillDueDate(-4, from).getTime()).toBe(from.getTime())
  })
})

describe('DRILL_INTERVALS_DAYS', () => {
  it('là thang tăng dần', () => {
    const arr = [...DRILL_INTERVALS_DAYS]
    expect(arr).toEqual([...arr].sort((a, b) => a - b))
    expect(new Set(arr).size).toBe(arr.length)
  })
})
