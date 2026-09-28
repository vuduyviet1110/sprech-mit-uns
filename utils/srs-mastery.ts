/** Shared mastery stage helpers (SRS is the single source of truth for isMastered). */

export type MasteryStage = 'learning' | 'reviewing' | 'mastered'

export const MAINTENANCE_INTERVAL_FLOOR = 30
export const MAINTENANCE_INTERVAL_CAP = 90
export const MASTER_MIN_REPETITIONS = 4
export const MASTER_MIN_INTERVAL = 21

export function getMasteryStage(input: {
  repetitions: number
  interval: number
  isMastered?: boolean
}): MasteryStage {
  const mastered =
    input.isMastered === true ||
    (input.repetitions >= MASTER_MIN_REPETITIONS &&
      input.interval >= MASTER_MIN_INTERVAL)

  if (mastered) return 'mastered'
  if (input.repetitions >= MASTER_MIN_REPETITIONS) return 'reviewing'
  return 'learning'
}

export function masteryStageLabel(stage: MasteryStage): string {
  if (stage === 'mastered') return 'Đã thuộc (ôn thưa)'
  if (stage === 'reviewing') return 'Đang củng cố'
  return 'Đang học'
}
