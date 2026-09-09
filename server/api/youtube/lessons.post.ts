import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, title, level, description, language = 'de' } = body || {}

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vui lòng cung cấp URL video YouTube!'
      })
    }

    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    const youtubeId = match && match[1] ? match[1] : ''

    if (!youtubeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL YouTube không hợp lệ!'
      })
    }

    const lessonTitle = title || `Bài học tiếng Đức ${youtubeId}`
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`

    // Kiểm tra xem video này đã tồn tại trong DB chưa
    const existing = await prisma.userLesson.findFirst({
      where: { youtubeId }
    })

    if (existing) {
      return {
        success: true,
        message: 'Bài học đã có sẵn trong cơ sở dữ liệu!',
        lesson: existing
      }
    }

    const newLesson = await prisma.userLesson.create({
      data: {
        youtubeId,
        url,
        title: lessonTitle,
        level: level || 'A1',
        language,
        thumbnail,
        description: description || 'Bài học YouTube tự thêm'
      }
    })

    return {
      success: true,
      message: 'Đã lưu bài học vào Cơ Sở Dữ Liệu thành công!',
      lesson: newLesson
    }
  } catch (error: any) {
    console.error('Lỗi khi lưu bài học vào DB:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Không thể lưu bài học vào Database'
    })
  }
})
