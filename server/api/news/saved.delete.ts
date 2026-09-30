import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import { listSavedArticles } from '~/server/utils/saved-article-store'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    assertRateLimit(`news:saved:${clientIp(event)}`, 200, 60 * 60 * 1000)

    const body = await readBody(event).catch(() => ({}))

    if (body?.all === true) {
      await prisma.userSavedArticle.deleteMany({ where: { userId } })
    } else {
      const articleId = String(body?.articleId || '')
      if (!articleId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Thiếu mã bài báo cần bỏ lưu',
        })
      }
      await prisma.userSavedArticle.deleteMany({ where: { userId, articleId } })
    }

    return { success: true, articles: await listSavedArticles(userId) }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi bỏ lưu bài báo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể bỏ lưu bài báo trong Database',
    })
  }
})
