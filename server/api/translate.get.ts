import { defineEventHandler, getQuery, createError, setResponseHeader } from 'h3'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import { translateText } from '~/server/utils/translate-provider'

const MAX_TEXT = 500

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  assertRateLimit(`translate:${clientIp(event)}`, 60, 60 * 1000)

  const query = getQuery(event)
  const text = ((query.text as string) || '').slice(0, MAX_TEXT).trim()
  const from = ((query.from as string) || 'cs').slice(0, 8)
  const to = ((query.to as string) || 'vi').slice(0, 8)

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng cung cấp từ hoặc câu cần dịch',
    })
  }

  try {
    const { translated, via } = await translateText(text, from, to)
    setResponseHeader(event, 'X-Translate-Via', via)
    return { original: text, translated, from, to }
  } catch (err: any) {
    // Trước đây chỗ này nuốt lỗi và trả lại nguyên văn, nên khi upstream chết
    // người dùng thấy "Haus" nghĩa là "Haus" — trông như dịch sai chứ không
    // phải dịch hỏng. Báo thật để UI nói được là tra không thành công.
    console.error('Lỗi khi dịch:', err)
    throw createError({
      statusCode: 503,
      statusMessage: 'Không tra được nghĩa lúc này, thử lại sau ít phút',
    })
  }
})
