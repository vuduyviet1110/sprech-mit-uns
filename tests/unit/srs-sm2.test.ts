import { describe, expect, it } from 'vitest'
import { calculateSM2 } from '~/server/utils/srs-sm2'
import {
  MAINTENANCE_INTERVAL_CAP,
  MAINTENANCE_INTERVAL_FLOOR,
  MASTER_MIN_INTERVAL,
  MASTER_MIN_REPETITIONS,
} from '~/utils/srs-mastery'

describe('calculateSM2', () => {
  it('sets interval 1 on first successful recall (repetitions 0 → 1)', () => {
    const out = calculateSM2({
      quality: 4,
      repetitions: 0,
      interval: 0,
      easinessFactor: 2.5,
    })
    expect(out.repetitions).toBe(1)
    expect(out.interval).toBe(1)
    expect(out.isMastered).toBe(false)
    expect(out.stage).toBe('learning')
  })

  it('sets interval 6 on second successful recall', () => {
    const out = calculateSM2({
      quality: 4,
      repetitions: 1,
      interval: 1,
      easinessFactor: 2.5,
    })
    expect(out.repetitions).toBe(2)
    expect(out.interval).toBe(6)
  })

  it('multiplies interval by EF on subsequent successes', () => {
    const out = calculateSM2({
      quality: 5,
      repetitions: 2,
      interval: 6,
      easinessFactor: 2.5,
    })
    expect(out.repetitions).toBe(3)
    expect(out.interval).toBe(15) // round(6 * 2.5)
  })

  it('resets chain and clears mastery on quality < 3', () => {
    const out = calculateSM2({
      quality: 2,
      repetitions: 5,
      interval: 30,
      easinessFactor: 2.2,
      isMastered: true,
    })
    expect(out.repetitions).toBe(0)
    expect(out.interval).toBe(1)
    expect(out.isMastered).toBe(false)
    expect(out.stage).toBe('learning')
  })

  it('clamps easiness factor to minimum 1.3', () => {
    const out = calculateSM2({
      quality: 0,
      repetitions: 0,
      interval: 1,
      easinessFactor: 1.3,
    })
    expect(out.easinessFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('marks mastered when thresholds met and applies maintenance floor', () => {
    const out = calculateSM2({
      quality: 5,
      repetitions: MASTER_MIN_REPETITIONS - 1,
      interval: MASTER_MIN_INTERVAL,
      easinessFactor: 2.5,
    })
    expect(out.repetitions).toBe(MASTER_MIN_REPETITIONS)
    expect(out.isMastered).toBe(true)
    expect(out.stage).toBe('mastered')
    expect(out.interval).toBeGreaterThanOrEqual(MAINTENANCE_INTERVAL_FLOOR)
    expect(out.interval).toBeLessThanOrEqual(MAINTENANCE_INTERVAL_CAP)
  })

  it('keeps maintenance spacing when already mastered', () => {
    const out = calculateSM2({
      quality: 4,
      repetitions: 10,
      interval: 20,
      easinessFactor: 2.0,
      isMastered: true,
    })
    expect(out.isMastered).toBe(true)
    expect(out.interval).toBeGreaterThanOrEqual(MAINTENANCE_INTERVAL_FLOOR)
    expect(out.interval).toBeLessThanOrEqual(MAINTENANCE_INTERVAL_CAP)
  })

  it('sets nextReviewAt about interval days ahead', () => {
    const before = Date.now()
    const out = calculateSM2({
      quality: 4,
      repetitions: 0,
      interval: 0,
      easinessFactor: 2.5,
    })
    const diffDays =
      (out.nextReviewAt.getTime() - before) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(0.9)
    expect(diffDays).toBeLessThan(1.1)
  })
})
