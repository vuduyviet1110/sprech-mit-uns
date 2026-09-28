import { describe, expect, it } from 'vitest'
import {
  getMasteryStage,
  masteryStageLabel,
  MASTER_MIN_INTERVAL,
  MASTER_MIN_REPETITIONS,
} from '~/utils/srs-mastery'

describe('getMasteryStage', () => {
  it('returns learning for new cards', () => {
    expect(
      getMasteryStage({ repetitions: 0, interval: 0 }),
    ).toBe('learning')
    expect(
      getMasteryStage({ repetitions: 2, interval: 6 }),
    ).toBe('learning')
  })

  it('returns reviewing when repetitions met but interval below master', () => {
    expect(
      getMasteryStage({
        repetitions: MASTER_MIN_REPETITIONS,
        interval: MASTER_MIN_INTERVAL - 1,
      }),
    ).toBe('reviewing')
  })

  it('returns mastered when thresholds met', () => {
    expect(
      getMasteryStage({
        repetitions: MASTER_MIN_REPETITIONS,
        interval: MASTER_MIN_INTERVAL,
      }),
    ).toBe('mastered')
  })

  it('respects explicit isMastered flag', () => {
    expect(
      getMasteryStage({
        repetitions: 1,
        interval: 1,
        isMastered: true,
      }),
    ).toBe('mastered')
  })
})

describe('masteryStageLabel', () => {
  it('returns Vietnamese labels', () => {
    expect(masteryStageLabel('learning')).toContain('học')
    expect(masteryStageLabel('reviewing')).toContain('củng cố')
    expect(masteryStageLabel('mastered')).toContain('thuộc')
  })
})
