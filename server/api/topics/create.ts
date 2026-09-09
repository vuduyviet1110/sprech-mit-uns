import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { title, slug, level, language, description, paragraph, englishTranslation, difficulty, estimatedTime } = body

      if (!title || !slug) {
        throw createError({ statusCode: 400, message: 'Title and Slug are required' })
      }

      const newTopic = await prisma.topic.create({
        data: {
          name: title,
          slug,
          level: level || 'A1',
          language: language || 'de',
          description,
          paragraph,
          englishTranslation,
          difficulty: difficulty || 'Easy',
          estimatedTime: estimatedTime || '15 mins',
        },
      })

      return { success: true, topic: newTopic }
    } catch (error: any) {
      throw createError({ statusCode: 500, message: error.message || 'Failed to create topic' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
