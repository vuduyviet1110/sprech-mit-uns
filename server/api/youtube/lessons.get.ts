import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  try {
    const { language } = getQuery(event)
    const where = typeof language === 'string' && language ? { language } : {}

    const lessons = await prisma.userLesson.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return {
      success: true,
      lessons
    }
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách bài học:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lấy danh sách bài học từ Database'
    })
  }
})
