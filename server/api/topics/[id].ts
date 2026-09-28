import { defineEventHandler, getRouterParams, createError } from 'h3'
import { getTopicDetails } from '~/server/handlers/getTopicsByLevel'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const { id } = getRouterParams(event)
  const userId = await requireUserId(event)

  if (method === 'GET') {
    try {
      return await getTopicDetails(id, userId)
    } catch (error: any) {
      console.error('Error in getTopicDetails:', error)
      throw createError({ statusCode: 500, message: error.message || 'Internal server error' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
