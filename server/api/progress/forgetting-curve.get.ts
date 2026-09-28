import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

/** Soft retention estimate R ≈ e^(-t / S) with S ~ interval (days). */
function retentionAt(daysAhead: number, stabilityDays: number) {
  const S = Math.max(stabilityDays, 0.5)
  return Math.exp(-daysAhead / S)
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const rows = await prisma.userWordProgress.findMany({
    where: { userId },
    select: {
      interval: true,
      repetitions: true,
      isMastered: true,
      easinessFactor: true,
      nextReviewAt: true,
    },
  })

  const total = rows.length
  if (!total) {
    return {
      total: 0,
      intervalBuckets: [],
      retentionCurve: [],
      summary: {
        learning: 0,
        reviewing: 0,
        mastered: 0,
        avgInterval: 0,
        avgEF: 2.5,
      },
    }
  }

  const bucketDefs = [
    { id: '0', label: '0–1 ngày', min: 0, max: 1 },
    { id: '1', label: '2–6 ngày', min: 2, max: 6 },
    { id: '2', label: '1–3 tuần', min: 7, max: 21 },
    { id: '3', label: '1–3 tháng', min: 22, max: 90 },
    { id: '4', label: '>3 tháng', min: 91, max: 99999 },
  ]

  const intervalBuckets = bucketDefs.map((b) => {
    const count = rows.filter((r) => r.interval >= b.min && r.interval <= b.max).length
    return {
      id: b.id,
      label: b.label,
      count,
      pct: Math.round((count / total) * 100),
    }
  })

  let learning = 0
  let reviewing = 0
  let mastered = 0
  let sumInterval = 0
  let sumEF = 0

  for (const r of rows) {
    sumInterval += r.interval || 0
    sumEF += r.easinessFactor || 2.5
    if (r.isMastered || (r.repetitions >= 4 && r.interval >= 21)) mastered++
    else if (r.repetitions >= 2) reviewing++
    else learning++
  }

  const avgStability =
    Math.max(sumInterval / total, 10) *
    Math.max(0.85, Math.min(1.3, sumEF / total / 2.5))
  const retentionCurve = Array.from({ length: 31 }, (_, day) => ({
    day,
    retention: Math.round(retentionAt(day, avgStability) * 1000) / 1000,
    pct: Math.round(retentionAt(day, avgStability) * 100),
  }))

  return {
    total,
    intervalBuckets,
    retentionCurve,
    summary: {
      learning,
      reviewing,
      mastered,
      avgInterval: Math.round((sumInterval / total) * 10) / 10,
      avgEF: Math.round((sumEF / total) * 100) / 100,
    },
  }
})
