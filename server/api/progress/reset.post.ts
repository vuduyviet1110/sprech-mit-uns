import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST' || method === 'DELETE') {
    try {
      const body = await readBody(event).catch(() => ({}))
      const userId = await requireUserId(event)
      const wordIds: string[] = Array.isArray(body?.wordIds)
        ? body.wordIds.filter(Boolean)
        : []

      if (wordIds.length) {
        const deletedProgress = await prisma.userWordProgress.deleteMany({
          where: { userId, wordId: { in: wordIds } },
        })
        return {
          success: true,
          message: 'Successfully reset deck progress',
          deletedProgressCount: deletedProgress.count,
          deletedAttemptsCount: 0,
        }
      }

      const deletedProgress = await prisma.userWordProgress.deleteMany({
        where: { userId },
      })
      const deletedAttempts = await prisma.quizAttempt.deleteMany({
        where: { userId },
      })
      const deletedDaily = await prisma.userDailyProgress.deleteMany({
        where: { userId },
      })
      // Tiến độ chép chính tả vốn sống sót qua "xoá toàn bộ tiến độ".
      const deletedLessons = await prisma.userLessonProgress.deleteMany({
        where: { userId },
      })

      return {
        success: true,
        message: 'Successfully reset all learning progress',
        deletedProgressCount: deletedProgress.count,
        deletedAttemptsCount: deletedAttempts.count,
        deletedDailyCount: deletedDaily.count,
        deletedLessonProgressCount: deletedLessons.count,
      }
    } catch (err: any) {
      if (err?.statusCode) throw err
      throw createError({ statusCode: 500, message: err.message || 'Error resetting progress' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
