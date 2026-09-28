import {
  getMasteryStage,
  MAINTENANCE_INTERVAL_CAP,
  MAINTENANCE_INTERVAL_FLOOR,
  MASTER_MIN_INTERVAL,
  MASTER_MIN_REPETITIONS,
  type MasteryStage,
} from '~/utils/srs-mastery'

export type { MasteryStage }
export {
  getMasteryStage,
  MAINTENANCE_INTERVAL_CAP,
  MAINTENANCE_INTERVAL_FLOOR,
  MASTER_MIN_INTERVAL,
  MASTER_MIN_REPETITIONS,
} from '~/utils/srs-mastery'

export interface SM2Input {
  quality: number // 0–5 (0–2: fail / forget, 3–5: recall)
  repetitions: number
  interval: number
  easinessFactor: number
  /** Previous mastered flag — used for maintenance floor after success */
  isMastered?: boolean
}

export interface SM2Output {
  repetitions: number
  interval: number // days
  easinessFactor: number
  nextReviewAt: Date
  isMastered: boolean
  stage: MasteryStage
}

/**
 * SuperMemo-2 with unified mastery (SRS-only) + maintenance spacing when mastered.
 * Forget (quality < 3) resets the learning chain and clears mastery.
 */
export function calculateSM2(input: SM2Input): SM2Output {
  let { quality, repetitions, interval, easinessFactor } = input
  const wasMastered = input.isMastered === true

  quality = Math.max(0, Math.min(5, quality))

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easinessFactor =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }

  let isMastered =
    quality >= 3 &&
    repetitions >= MASTER_MIN_REPETITIONS &&
    interval >= MASTER_MIN_INTERVAL

  if (quality >= 3 && (isMastered || wasMastered)) {
    isMastered = true
    interval = Math.max(interval, MAINTENANCE_INTERVAL_FLOOR)
    interval = Math.min(interval, MAINTENANCE_INTERVAL_CAP)
  }

  if (quality < 3) {
    isMastered = false
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)

  const stage = getMasteryStage({ repetitions, interval, isMastered })

  return {
    repetitions,
    interval,
    easinessFactor: Number(easinessFactor.toFixed(2)),
    nextReviewAt,
    isMastered,
    stage,
  }
}
