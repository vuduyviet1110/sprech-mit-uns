import { defineEventHandler, getRouterParams, getQuery, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import {
  type QuizQuestionInput,
  validateQuestionInput,
  toCreateData,
  normalizeChoices,
} from '~/server/utils/quiz-validate'
import { requireCatalogWriter } from '~/server/utils/catalog-write'

const questionSelect = {
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
    orderBy: { index: 'asc' as const },
  },
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const { topicId } = getRouterParams(event)

  if (!topicId) {
    throw createError({ statusCode: 400, message: 'topicId is required' })
  }

  if (method === 'GET') {
    try {
      const questions = await prisma.quizQuestion.findMany({
        where: { topicId },
        select: questionSelect,
      })
      return questions
    } catch (error) {
      throw createError({ statusCode: 500, message: 'Failed to fetch quiz questions' })
    }
  }

  if (method === 'POST') {
    try {
      await requireCatalogWriter(event)
      const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } })
      if (!topic) {
        throw createError({ statusCode: 404, message: 'Topic not found' })
      }

      const body = await readBody(event)
      const items: QuizQuestionInput[] = Array.isArray(body?.questions)
        ? body.questions
        : body?.text
          ? [body as QuizQuestionInput]
          : []

      if (!items.length) {
        throw createError({ statusCode: 400, message: 'Provide a question or questions[]' })
      }

      for (const q of items) {
        const err = validateQuestionInput(q)
        if (err) throw createError({ statusCode: 400, message: err })
      }

      const created = await prisma.$transaction(
        items.map((q) =>
          prisma.quizQuestion.create({
            data: toCreateData(topicId, q) as any,
            select: questionSelect,
          }),
        ),
      )

      return Array.isArray(body?.questions) ? created : created[0]
    } catch (error: any) {
      if (error?.statusCode) throw error
      throw createError({ statusCode: 500, message: error?.message || 'Failed to create quiz questions' })
    }
  }

  if (method === 'PUT') {
    try {
      await requireCatalogWriter(event)
      const body = await readBody(event) as QuizQuestionInput & { id?: string }
      if (!body?.id) {
        throw createError({ statusCode: 400, message: 'Question id is required' })
      }

      const existing = await prisma.quizQuestion.findFirst({
        where: { id: body.id, topicId },
        select: { id: true },
      })
      if (!existing) {
        throw createError({ statusCode: 404, message: 'Question not found for this topic' })
      }

      const err = validateQuestionInput(body)
      if (err) throw createError({ statusCode: 400, message: err })

      const type = body.type || 'multiple_choice'
      const updated = await prisma.$transaction(async (tx) => {
        if (type === 'multiple_choice' && Array.isArray(body.choices)) {
          await tx.quizChoice.deleteMany({ where: { questionId: body.id } })
        }

        return tx.quizQuestion.update({
          where: { id: body.id },
          data: {
            text: body.text.trim(),
            type,
            level: body.level || null,
            audioUrl: body.audioUrl || null,
            targetSentence: body.targetSentence || null,
            solution: body.solution || (['dictation', 'typed_recall', 'cloze'].includes(type) ? body.targetSentence : null) || null,
            scrambleWords: Array.isArray(body.scrambleWords) ? body.scrambleWords.filter(Boolean) : [],
            ...(type === 'multiple_choice' && Array.isArray(body.choices)
              ? {
                  choices: {
                    create: normalizeChoices(body.choices),
                  },
                }
              : {}),
          },
          select: questionSelect,
        })
      })

      return updated
    } catch (error: any) {
      if (error?.statusCode) throw error
      throw createError({ statusCode: 500, message: error?.message || 'Failed to update quiz question' })
    }
  }

  if (method === 'DELETE') {
    try {
      await requireCatalogWriter(event)
      const query = getQuery(event)
      const questionId = String(query.questionId || '')
      if (!questionId) {
        throw createError({ statusCode: 400, message: 'questionId query param is required' })
      }

      const existing = await prisma.quizQuestion.findFirst({
        where: { id: questionId, topicId },
        select: { id: true },
      })
      if (!existing) {
        throw createError({ statusCode: 404, message: 'Question not found for this topic' })
      }

      await prisma.quizQuestion.delete({ where: { id: questionId } })
      return { success: true, id: questionId }
    } catch (error: any) {
      if (error?.statusCode) throw error
      throw createError({ statusCode: 500, message: error?.message || 'Failed to delete quiz question' })
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
