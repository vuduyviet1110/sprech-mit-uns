import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import {
  type QuizQuestionInput,
  validateQuestionInput,
  toCreateData,
} from '~/server/utils/quiz-validate'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireCatalogWriter } from '~/server/utils/catalog-write'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST') {
    try {
      await requireCatalogWriter(event)
      assertRateLimit(`topics:create:${clientIp(event)}`, 20, 60 * 60 * 1000)

      const body = await readBody(event)
      const {
        title,
        slug,
        level,
        language,
        description,
        paragraph,
        englishTranslation,
        difficulty,
        estimatedTime,
        questions,
      } = body

      if (!title || !slug) {
        throw createError({ statusCode: 400, message: 'Title and Slug are required' })
      }

      const quizItems: QuizQuestionInput[] = Array.isArray(questions) ? questions : []
      for (const q of quizItems) {
        const err = validateQuestionInput(q)
        if (err) throw createError({ statusCode: 400, message: err })
      }

      const newTopic = await prisma.$transaction(async (tx) => {
        const topic = await tx.topic.create({
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

        if (quizItems.length) {
          for (const q of quizItems) {
            await tx.quizQuestion.create({
              data: toCreateData(topic.id, q) as any,
            })
          }
        }

        return topic
      })

      return { success: true, topic: newTopic }
    } catch (error: any) {
      if (error?.statusCode) throw error
      throw createError({ statusCode: 500, message: error.message || 'Failed to create topic' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
