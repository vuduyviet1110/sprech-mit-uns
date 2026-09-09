import { defineEventHandler, getRouterParams, getQuery, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const { topicId } = getRouterParams(event)

  if (method === 'GET') {
    try {
      const questions = await prisma.quizQuestion.findMany({
        where: { topicId },
        select: {
          id: true,
          text: true,
          type: true,
          level: true,
          audioUrl: true,
          targetSentence: true,
          solution: true,
          scrambleWords: true,
          choices: {
            select: {
              id: true,
              index: true,
              text: true,
              isCorrect: true,
            },
            orderBy: { index: 'asc' },
          },
        },
      })

      return questions
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Failed to fetch quiz questions' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
