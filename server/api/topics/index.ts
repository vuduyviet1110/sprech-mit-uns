import { defineEventHandler, getQuery, createError } from 'h3'
import { getTopicsByLevel } from '~/server/handlers/getTopicsByLevel'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)
  const userId = await requireUserId(event)
  const language =
    typeof query.language === 'string' && query.language === 'cs' ? 'cs' : 'de'

  if (method === 'GET') {
    try {
      return await getTopicsByLevel(userId, language)
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Internal server error' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
