import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    const { language } = getQuery(event)
    const where: { userId: string; language?: string } = { userId }
    if (typeof language === 'string' && language) {
      where.language = language
    }

    const lessons = await prisma.userLesson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return {
      success: true,
      lessons,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lấy danh sách bài học:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lấy danh sách bài học từ Database',
    })
  }
})
