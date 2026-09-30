import { defineEventHandler, readBody, createError } from 'h3'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import { sanitizeSavedArticle } from '~/utils/saved-article'
import {
  enforceSavedArticleCap,
  importSavedArticles,
  listSavedArticles,
  upsertSavedArticle,
} from '~/server/utils/saved-article-store'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    assertRateLimit(`news:saved:${clientIp(event)}`, 200, 60 * 60 * 1000)

    const body = await readBody(event).catch(() => ({}))

    if (body?.mode === 'import') {
      await importSavedArticles(userId, body?.articles)
    } else {
      const article = sanitizeSavedArticle(body?.article)
      if (!article) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bài báo không hợp lệ hoặc thiếu nội dung',
        })
      }
      await upsertSavedArticle(userId, article)
    }

    const dropped = await enforceSavedArticleCap(userId)

    return {
      success: true,
      articles: await listSavedArticles(userId),
      dropped,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lưu bài báo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lưu bài báo vào Database',
    })
  }
})
