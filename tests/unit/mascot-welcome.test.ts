import { describe, expect, it } from 'vitest'
import { buildWelcome, daysBetween } from '~/utils/mascot-welcome'

const base = { lastStudyDate: '2026-09-25', streak: 0, dueCount: 0, today: '2026-09-29' }

describe('daysBetween', () => {
  it('đếm đúng số ngày', () => {
    expect(daysBetween('2026-09-25', '2026-09-29')).toBe(4)
    expect(daysBetween('2026-09-29', '2026-09-29')).toBe(0)
  })

  it('qua ranh giới tháng và năm', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })

  it('trả null với đầu vào hỏng', () => {
    expect(daysBetween('không-phải-ngày', '2026-09-29')).toBeNull()
    expect(daysBetween('', '2026-09-29')).toBeNull()
  })
})

describe('buildWelcome', () => {
  it('người mới được chào riêng', () => {
    const w = buildWelcome({ ...base, lastStudyDate: null })
    expect(w?.line).toContain('Lần đầu')
  })

  // Đã học hôm nay thì im, nhường chỗ cho lời chào theo trang.
  it('im lặng khi đã học hôm nay', () => {
    expect(buildWelcome({ ...base, lastStudyDate: '2026-09-29' })).toBeNull()
  })

  it('học hôm qua + có chuỗi thì nhắc giữ chuỗi', () => {
    const w = buildWelcome({ ...base, lastStudyDate: '2026-09-28', streak: 5 })
    expect(w?.line).toContain('5 ngày')
    expect(w?.reaction).toBe('sparkle')
  })

  it('học hôm qua nhưng chưa có chuỗi thì chỉ chào', () => {
    const w = buildWelcome({ ...base, lastStudyDate: '2026-09-28', streak: 1 })
    expect(w?.line).toContain('trở lại')
  })

  it('vắng vài ngày thì nói đúng số ngày', () => {
    expect(buildWelcome({ ...base, lastStudyDate: '2026-09-26' })?.line).toContain('3 ngày')
    expect(buildWelcome({ ...base, lastStudyDate: '2026-09-20' })?.line).toContain('9 ngày')
  })

  it('vắng rất lâu thì không nói con số cho đỡ nản', () => {
    const w = buildWelcome({ ...base, lastStudyDate: '2026-01-01' })
    expect(w?.line).toContain('Lâu lắm')
    expect(w?.line).not.toMatch(/\d+ ngày/)
  })

  it('có thẻ tới hạn thì nhắc kèm số lượng', () => {
    const w = buildWelcome({ ...base, lastStudyDate: '2026-09-26', dueCount: 12 })
    expect(w?.line).toContain('12 thẻ')
  })

  it('không có thẻ tới hạn thì không nhắc kho ôn', () => {
    const w = buildWelcome({ ...base, lastStudyDate: '2026-09-26', dueCount: 0 })
    expect(w?.line).not.toContain('thẻ')
  })

  it('bỏ qua khi ngày học nằm ở tương lai (lệch múi giờ/đồng hồ sai)', () => {
    expect(buildWelcome({ ...base, lastStudyDate: '2026-10-05' })).toBeNull()
  })

  it('bỏ qua khi ngày học không hợp lệ', () => {
    expect(buildWelcome({ ...base, lastStudyDate: 'hôm-qua' })).toBeNull()
  })

  it('mọi lời chào đều có reaction hợp lệ', () => {
    const ok = ['heart', 'sparkle', 'sleepy', 'bashful', 'wink']
    for (const d of ['2026-09-28', '2026-09-26', '2026-09-20', '2026-01-01']) {
      const w = buildWelcome({ ...base, lastStudyDate: d })
      expect(ok, d).toContain(w!.reaction)
    }
  })
})
