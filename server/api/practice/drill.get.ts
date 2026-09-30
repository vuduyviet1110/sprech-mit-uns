import { defineEventHandler, getQuery, createError } from 'h3'
import { requireUserId } from '~/server/utils/user'
import { listDrillItems } from '~/server/utils/drill-store'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    const raw = String(getQuery(event).language || '').toLowerCase()
    // Không truyền language thì trả tất cả — trang ôn phát âm hiển thị cả hai thứ tiếng.
    const language = raw === 'cs' || raw === 'de' ? raw : undefined

    return { success: true, items: await listDrillItems(userId, language) }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lấy danh sách luyện phát âm:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lấy danh sách luyện phát âm từ Database',
    })
  }
})
