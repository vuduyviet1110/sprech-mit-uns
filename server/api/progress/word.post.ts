import { defineEventHandler, readBody, createError } from 'h3'
import {
  applySm2Review,
  qualityFromBinary,
} from '~/server/utils/apply-sm2-review'
import { ensureUser, requireUserId } from '~/server/utils/user'

/**
 * Legacy flashcard progress endpoint — now a thin SM-2 wrapper.
 * Accepts either `quality` (0–5) or binary `isCorrect`.
 */
export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST' || method === 'PUT') {
    try {
      const body = await readBody(event)
      const userId = await requireUserId(event)
      const { wordId, isCorrect, quality } = body

      if (!wordId) {
        throw createError({ statusCode: 400, message: 'wordId is required' })
      }

      await ensureUser(userId)

      const q =
        quality !== undefined && quality !== null
          ? Number(quality)
          : qualityFromBinary(Boolean(isCorrect))

      const result = await applySm2Review({
        userId,
        wordId,
        quality: q,
      })

      return { success: true, progress: result.progress, ...result }
    } catch (err: any) {
      if (err?.statusCode) throw err
      throw createError({
        statusCode: 500,
        message: err.message || 'Error updating progress',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
