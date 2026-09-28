/** Normalize for fuzzy compare (accents kept for Czech/German; strip punctuation). */
export function normalizeForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[„“"«»']/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡…]/g, '')
    .replace(/\s+/g, ' ')
}

/** Simple Levenshtein distance for short phrases. */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return dp[n]
}

export type FuzzyMatchLevel = 'exact' | 'close' | 'miss'

export function fuzzyMatch(input: string, target: string): {
  level: FuzzyMatchLevel
  similarity: number
} {
  const a = normalizeForCompare(input)
  const b = normalizeForCompare(target)
  if (!a || !b) return { level: 'miss', similarity: 0 }
  if (a === b) return { level: 'exact', similarity: 1 }

  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  const similarity = 1 - dist / maxLen

  if (similarity >= 0.85 || dist <= Math.max(1, Math.floor(maxLen * 0.15))) {
    return { level: 'close', similarity }
  }
  return { level: 'miss', similarity }
}
