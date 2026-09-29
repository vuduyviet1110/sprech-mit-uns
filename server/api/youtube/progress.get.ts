import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

const YOUTUBE_ID = /^[\w-]{11}$/

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    const youtubeId = String(getQuery(event).youtubeId || '')

    if (!YOUTUBE_ID.test(youtubeId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'youtubeId không hợp lệ',
      })
    }

    const progress = await prisma.userLessonProgress.findFirst({
      where: { userId, youtubeId },
    })

    return { success: true, progress: progress ?? null }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lấy tiến độ dictation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lấy tiến độ luyện nghe từ Database',
    })
  }
})
