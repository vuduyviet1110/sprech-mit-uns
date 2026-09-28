import { describe, expect, it } from 'vitest'
import {
  masteryLevelFromSm2,
  qualityFromBinary,
} from '~/server/utils/sm2-quality'
import { calculateSM2 } from '~/server/utils/srs-sm2'
import { qualityFromBinaryClient } from '~/utils/srs-quality'

describe('qualityFromBinary', () => {
  it('maps easy → 5 and hard → 2', () => {
    expect(qualityFromBinary(true)).toBe(5)
    expect(qualityFromBinary(false)).toBe(2)
    expect(qualityFromBinaryClient(true)).toBe(5)
    expect(qualityFromBinaryClient(false)).toBe(2)
  })
})

describe('unified SM-2 path', () => {
  it('easy then hard produces consistent forget reset', () => {
    const easy = calculateSM2({
      quality: qualityFromBinary(true),
      repetitions: 0,
      interval: 0,
      easinessFactor: 2.5,
    })
    expect(easy.repetitions).toBe(1)
    expect(easy.interval).toBe(1)

    const hard = calculateSM2({
      quality: qualityFromBinary(false),
      repetitions: easy.repetitions,
      interval: easy.interval,
      easinessFactor: easy.easinessFactor,
      isMastered: easy.isMastered,
    })
    expect(hard.repetitions).toBe(0)
    expect(hard.interval).toBe(1)
    expect(hard.isMastered).toBe(false)
  })

  it('mirrors masteryLevel from SM-2 state', () => {
    expect(
      masteryLevelFromSm2({ repetitions: 0, isMastered: false, quality: 2 }),
    ).toBe(0)
    expect(
      masteryLevelFromSm2({ repetitions: 3, isMastered: false, quality: 5 }),
    ).toBe(3)
    expect(
      masteryLevelFromSm2({ repetitions: 10, isMastered: true, quality: 5 }),
    ).toBe(5)
  })
})
