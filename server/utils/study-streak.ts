/** Pure calendar-day study streak helpers. */

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function yesterdayKey(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

export function nextStudyStreak(input: {
  studyStreak: number
  lastStudyDate: string | null | undefined
  today: string
}): { studyStreak: number; lastStudyDate: string } {
  const prev = input.lastStudyDate || null
  if (prev === input.today) {
    return {
      studyStreak: Math.max(1, input.studyStreak || 1),
      lastStudyDate: input.today,
    }
  }
  const yday = (() => {
    const [y, m, d] = input.today.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() - 1)
    return todayKey(dt)
  })()

  if (prev === yday) {
    return {
      studyStreak: (input.studyStreak || 0) + 1,
      lastStudyDate: input.today,
    }
  }
  return { studyStreak: 1, lastStudyDate: input.today }
}
