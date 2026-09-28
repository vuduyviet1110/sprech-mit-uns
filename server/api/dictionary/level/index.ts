import { createError } from 'h3'

/** Dead route — dictionary filters by topic/language via /api/dictionary instead. */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage:
      'Endpoint /api/dictionary/level đã ngừng. Dùng /api/dictionary hoặc /api/dictionary/topic.',
  })
})
