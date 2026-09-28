import { prisma } from '~/server/ultis/prisma'
import { ensureUser, requireUserId } from '~/server/utils/user'

const defaults = {
  dailyReviewTarget: 20,
  primaryLang: 'de',
  speechRate: 0.85,
  dailyReminder: true,
  autoPlayAudio: true,
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const body = method === 'GET' ? null : await readBody(event)
  const userId = await requireUserId(event)
  await ensureUser(userId)

  if (method === 'GET') {
    const row = await prisma.userSettings.findUnique({ where: { userId } })
    return {
      ...(row
        ? {
            dailyReviewTarget: row.dailyReviewTarget,
            primaryLang: row.primaryLang,
            speechRate: row.speechRate,
            dailyReminder: row.dailyReminder,
            autoPlayAudio: row.autoPlayAudio,
          }
        : defaults),
      userId,
      persisted: !!row,
    }
  }

  if (method === 'POST' || method === 'PUT') {
    const data = {
      dailyReviewTarget: Math.max(
        1,
        Math.min(200, Number(body.dailyReviewTarget) || defaults.dailyReviewTarget),
      ),
      primaryLang: body.primaryLang === 'cs' ? 'cs' : 'de',
      speechRate: Math.max(0.5, Math.min(1.5, Number(body.speechRate) || defaults.speechRate)),
      dailyReminder: body.dailyReminder !== false,
      autoPlayAudio: body.autoPlayAudio !== false,
    }

    const row = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })

    return {
      dailyReviewTarget: row.dailyReviewTarget,
      primaryLang: row.primaryLang,
      speechRate: row.speechRate,
      dailyReminder: row.dailyReminder,
      autoPlayAudio: row.autoPlayAudio,
      userId,
      persisted: true,
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
