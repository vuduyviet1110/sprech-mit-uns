/** Word counts as "done" for curriculum unlock (≥70% threshold). */
export function isWordDoneForUnlock(p: {
  repetitions?: number | null
  isMastered?: boolean | null
  masteryLevel?: number | null
}): boolean {
  if (p.isMastered) return true
  if ((p.repetitions ?? 0) >= 2) return true
  return false
}

export function completionRatioFromProgress(
  words: {
    userProgress: {
      repetitions?: number | null
      isMastered?: boolean | null
      masteryLevel?: number | null
      lastReviewedAt?: Date | null
    }[]
  }[],
): number {
  if (!words.length) return 1
  const done = words.filter((w) =>
    w.userProgress.some((p) => isWordDoneForUnlock(p)),
  ).length
  return done / words.length
}
