import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'
import {
  getOrCreateDailyProgress,
  todayKeyFromQuery,
} from '~/server/utils/daily-progress'
import { recordStudyActivity } from '~/server/utils/record-study-activity'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const body = method === 'POST' ? await readBody(event) : null
  const userId = await requireUserId(event)
  // POST nhận `date` ở body (client gửi kiểu đó), GET thì ở query. Trước đây
  // chỉ đọc query nên mọi lần ghi đều rơi vào ngày hôm nay bất kể body gửi gì.
  const date = todayKeyFromQuery(
    (body?.date as string) || (query.date as string),
  )

  if (method === 'GET') {
    const row = await getOrCreateDailyProgress(userId, date)
    return {
      date: row.date,
      xp: row.xp,
      questProgress: (row.questProgress as Record<string, number>) || {},
      pathCompleted: (row.pathCompleted as Record<string, boolean>) || {},
      srsReviewedCount: row.srsReviewedCount,
      dailyXpTarget: 500,
    }
  }

  if (method === 'POST') {
    const row = await getOrCreateDailyProgress(userId, date)

    const nextQuest = {
      ...((row.questProgress as Record<string, number>) || {}),
      ...((body.questProgress as Record<string, number>) || {}),
    }
    // Mốc đã hoàn thành chỉ được bật, không được tắt. Trước đây đây là spread
    // thuần (last-write-wins), nên một client gửi `{srs:false}` — ví dụ vừa mở
    // app lúc chưa đăng nhập rồi mới đăng nhập — sẽ xoá sạch lộ trình đã xong
    // trong ngày. `questProgress` bên dưới vốn đã gộp bằng max.
    const nextPath: Record<string, boolean> = {
      ...((row.pathCompleted as Record<string, boolean>) || {}),
    }
    if (body.pathCompleted && typeof body.pathCompleted === 'object') {
      for (const [k, v] of Object.entries(
        body.pathCompleted as Record<string, boolean>,
      )) {
        nextPath[k] = !!nextPath[k] || !!v
      }
    }

    if (body.questProgress && typeof body.questProgress === 'object') {
      for (const [k, v] of Object.entries(body.questProgress as Record<string, number>)) {
        nextQuest[k] = Math.max(Number(nextQuest[k] || 0), Number(v || 0))
      }
    }

    const xpDelta = Math.max(0, Number(body.xpDelta) || 0)
    const srsDelta = Math.max(0, Number(body.srsReviewedDelta) || 0)
    const srsSet =
      typeof body.srsReviewedCount === 'number' ? body.srsReviewedCount : null

    const updated = await prisma.userDailyProgress.update({
      where: { id: row.id },
      data: {
        xp: { increment: xpDelta },
        questProgress: nextQuest,
        pathCompleted: nextPath,
        srsReviewedCount:
          srsSet !== null
            ? Math.max(row.srsReviewedCount, srsSet)
            : { increment: srsDelta },
      },
    })

    const streak = await recordStudyActivity(userId, date)

    return {
      date: updated.date,
      xp: updated.xp,
      questProgress: updated.questProgress,
      pathCompleted: updated.pathCompleted,
      srsReviewedCount: updated.srsReviewedCount,
      dailyXpTarget: 500,
      studyStreak: streak.studyStreak,
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
