import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { userId, answers } = body as {
        userId: string
        answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[]
      }

      if (!userId || !Array.isArray(answers)) {
        throw createError({ statusCode: 400, message: 'Invalid payload' })
      }

      const results = []
      for (const ans of answers) {
        const attempt = await prisma.quizAttempt.upsert({
          where: {
            userId_questionId: {
              userId,
              questionId: ans.questionId,
            },
          },
          update: {
            selectedIndex: ans.selectedIndex,
            isCorrect: ans.isCorrect,
            answeredAt: new Date(),
          },
          create: {
            userId,
            questionId: ans.questionId,
            selectedIndex: ans.selectedIndex,
            isCorrect: ans.isCorrect,
          },
        })
        results.push(attempt)
      }

      return { success: true, count: results.length }
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Failed to submit quiz attempts' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
