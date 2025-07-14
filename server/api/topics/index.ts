import { defineEventHandler, getQuery, createError } from 'h3'
import { getTopicsByLevel } from '~/server/handlers/getTopicsByLevel'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const { userId } = getQuery(event)

  console.log(`Method: ${method}, User ID: ${userId}`)

  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required' })
  }

  if (method === 'GET') {
    try {
      return await getTopicsByLevel(userId as string)
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Internal server error' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
