import { prisma } from '~/server/ultis/prisma'
import { ensureUser } from '~/server/utils/user'

export function todayKeyFromQuery(date?: string | null) {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getOrCreateDailyProgress(userId: string, date: string) {
  await ensureUser(userId)
  return prisma.userDailyProgress.upsert({
    where: {
      userId_date: { userId, date },
    },
    create: {
      userId,
      date,
      xp: 0,
      questProgress: {},
      pathCompleted: {},
      srsReviewedCount: 0,
    },
    update: {},
  })
}
