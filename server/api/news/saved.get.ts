import { defineEventHandler, getQuery, createError } from 'h3'
import { requireUserId } from '~/server/utils/user'
import { listSavedArticles } from '~/server/utils/saved-article-store'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    const raw = String(getQuery(event).language || '').toLowerCase()
    const language = raw === 'cs' || raw === 'de' ? raw : undefined

    return { success: true, articles: await listSavedArticles(userId, language) }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lấy bài báo đã lưu:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lấy bài báo đã lưu từ Database',
    })
  }
})
