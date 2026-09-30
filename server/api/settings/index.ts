import { prisma } from '~/server/ultis/prisma'
import { ensureUser, requireUserId } from '~/server/utils/user'

const defaults = {
  dailyReviewTarget: 20,
  primaryLang: 'de',
  speechRate: 0.85,
  dailyReminder: true,
  autoPlayAudio: true,
  mascot: true,
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
            mascot: row.mascot,
          }
        : defaults),
      userId,
      persisted: !!row,
    }
  }

  if (method === 'POST' || method === 'PUT') {
    // Cập nhật từng phần: field không gửi lên thì giữ nguyên giá trị đang có.
    // Trước đây handler dựng lại cả row từ body với `|| defaults`, nên client chỉ
    // muốn đổi `primaryLang` sẽ vô tình reset `dailyReviewTarget` và `speechRate`.
    const current =
      (await prisma.userSettings.findUnique({ where: { userId } })) ?? defaults

    const has = (key: string) =>
      body && Object.prototype.hasOwnProperty.call(body, key) && body[key] != null

    const data = {
      dailyReviewTarget: has('dailyReviewTarget')
        ? Math.max(
            1,
            Math.min(
              200,
              Number(body.dailyReviewTarget) || current.dailyReviewTarget,
            ),
          )
        : current.dailyReviewTarget,
      primaryLang: has('primaryLang')
        ? body.primaryLang === 'cs'
          ? 'cs'
          : 'de'
        : current.primaryLang,
      speechRate: has('speechRate')
        ? Math.max(0.5, Math.min(1.5, Number(body.speechRate) || current.speechRate))
        : current.speechRate,
      dailyReminder: has('dailyReminder')
        ? body.dailyReminder !== false
        : current.dailyReminder,
      autoPlayAudio: has('autoPlayAudio')
        ? body.autoPlayAudio !== false
        : current.autoPlayAudio,
      mascot: has('mascot') ? body.mascot !== false : current.mascot,
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
      mascot: row.mascot,
      userId,
      persisted: true,
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
