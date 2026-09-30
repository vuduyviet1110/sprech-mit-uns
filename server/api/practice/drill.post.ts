import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import {
  importDrillItems,
  listDrillItems,
  normalizeLanguage,
  recordDrillFailures,
  recordDrillSuccess,
  sanitizeFailInputs,
} from '~/server/utils/drill-store'

/**
 * Mọi thao tác đều trả về **toàn bộ** danh sách sau khi ghi, để composable chỉ
 * việc thay `items.value` thay vì phải hoà giải hai nguồn dữ liệu.
 */
export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    assertRateLimit(`drill:${clientIp(event)}`, 300, 60 * 60 * 1000)

    const body = await readBody(event).catch(() => ({}))
    const action = String(body?.action || '')
    const language = normalizeLanguage(body?.language)

    switch (action) {
      case 'fail': {
        const items = sanitizeFailInputs(body?.items)
        if (items.length === 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Dữ liệu luyện phát âm không hợp lệ',
          })
        }
        await recordDrillFailures(userId, language, items)
        break
      }

      case 'success': {
        const itemKey = String(body?.id || '')
        if (!itemKey) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Thiếu mã mục luyện phát âm',
          })
        }
        await recordDrillSuccess(userId, itemKey)
        break
      }

      case 'remove': {
        const itemKey = String(body?.id || '')
        if (!itemKey) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Thiếu mã mục luyện phát âm',
          })
        }
        await prisma.userPronunciationDrill.deleteMany({
          where: { userId, itemKey },
        })
        break
      }

      case 'clear': {
        await prisma.userPronunciationDrill.deleteMany({ where: { userId } })
        break
      }

      case 'import': {
        await importDrillItems(userId, body?.items)
        break
      }

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Thao tác luyện phát âm không hợp lệ',
        })
    }

    return { success: true, items: await listDrillItems(userId) }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lưu tiến độ luyện phát âm:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lưu tiến độ luyện phát âm vào Database',
    })
  }
})
