/** Pure SM-2 quality helpers (no DB). */

export function qualityFromBinary(isCorrect: boolean): number {
  return isCorrect ? 5 : 2
}

/** Mirror SM-2 state onto legacy masteryLevel (0–5) for older UI. */
export function masteryLevelFromSm2(input: {
  repetitions: number
  isMastered: boolean
  quality: number
}): number {
  if (input.isMastered) return 5
  if (input.quality < 3) return 0
  return Math.min(4, input.repetitions)
}
