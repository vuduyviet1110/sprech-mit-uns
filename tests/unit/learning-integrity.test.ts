import { describe, expect, it } from 'vitest'
import {
  nextStudyStreak,
  todayKey,
  yesterdayKey,
} from '~/server/utils/study-streak'
import {
  completionRatioFromProgress,
  isWordDoneForUnlock,
} from '~/server/utils/curriculum-progress'

describe('nextStudyStreak', () => {
  it('starts at 1 on first study day', () => {
    expect(
      nextStudyStreak({
        studyStreak: 0,
        lastStudyDate: null,
        today: '2026-09-18',
      }),
    ).toEqual({ studyStreak: 1, lastStudyDate: '2026-09-18' })
  })

  it('increments on consecutive days', () => {
    expect(
      nextStudyStreak({
        studyStreak: 3,
        lastStudyDate: '2026-09-17',
        today: '2026-09-18',
      }),
    ).toEqual({ studyStreak: 4, lastStudyDate: '2026-09-18' })
  })

  it('does not double-count same day', () => {
    expect(
      nextStudyStreak({
        studyStreak: 5,
        lastStudyDate: '2026-09-18',
        today: '2026-09-18',
      }),
    ).toEqual({ studyStreak: 5, lastStudyDate: '2026-09-18' })
  })

  it('resets after a gap', () => {
    expect(
      nextStudyStreak({
        studyStreak: 10,
        lastStudyDate: '2026-09-10',
        today: '2026-09-18',
      }),
    ).toEqual({ studyStreak: 1, lastStudyDate: '2026-09-18' })
  })

  it('yesterdayKey is one day before todayKey', () => {
    const d = new Date(2026, 8, 18)
    expect(todayKey(d)).toBe('2026-09-18')
    expect(yesterdayKey(d)).toBe('2026-09-17')
  })
})

describe('curriculum unlock', () => {
  it('does not count lastReviewedAt alone', () => {
    expect(
      isWordDoneForUnlock({
        lastReviewedAt: new Date() as any,
        repetitions: 0,
        masteryLevel: 0,
      } as any),
    ).toBe(false)
  })

  it('counts repetitions >= 2 or isMastered', () => {
    expect(isWordDoneForUnlock({ repetitions: 2 })).toBe(true)
    expect(isWordDoneForUnlock({ isMastered: true, repetitions: 0 })).toBe(true)
  })

  it('computes completion ratio', () => {
    const ratio = completionRatioFromProgress([
      { userProgress: [{ repetitions: 2 }] },
      { userProgress: [{ repetitions: 0 }] },
      { userProgress: [] },
    ])
    expect(ratio).toBeCloseTo(1 / 3)
  })
})
