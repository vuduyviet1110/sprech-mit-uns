import { defineEventHandler, getRouterParams, getQuery, createError } from 'h3'
import { getTopicDetails } from '~/server/handlers/getTopicsByLevel'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const { id } = getRouterParams(event)
  const { userId } = getQuery(event)

  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required' })
  }

  if (method === 'GET') {
    try {
      return await getTopicDetails(id, userId as string)
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Internal server error' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
