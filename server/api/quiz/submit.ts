import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { applySm2Review } from '~/server/utils/apply-sm2-review'
import { qualityFromBinary } from '~/server/utils/sm2-quality'
import { ensureUser, requireUserId } from '~/server/utils/user'
import { recordStudyActivity } from '~/server/utils/record-study-activity'
import { gradeQuizAnswer } from '~/server/utils/quiz-grade'
import { normalizeAnswerText } from '~/server/utils/demo'

async function applySrsFromAnswers(
  userId: string,
  answers: { questionId: string; isCorrect: boolean }[],
) {
  const questionIds = [...new Set(answers.map((a) => a.questionId))]
  if (!questionIds.length) return { applied: 0 }

  const questions = await prisma.quizQuestion.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      text: true,
      solution: true,
      targetSentence: true,
      topic: {
        select: {
          words: {
            select: {
              word: { select: { id: true, word: true } },
            },
          },
        },
      },
    },
  })

  const byId = new Map(questions.map((q) => [q.id, q]))
  let applied = 0

  for (const ans of answers) {
    const q = byId.get(ans.questionId)
    if (!q) continue
    const haystack = normalizeAnswerText(
      [q.text, q.solution, q.targetSentence].filter(Boolean).join(' '),
    )
    const words = (q.topic?.words || [])
      .map((w) => w.word)
      .filter(Boolean) as { id: string; word: string }[]

    const matched = words.filter((w) => {
      const token = normalizeAnswerText(w.word)
      return token && haystack.includes(token)
    })

    for (const w of matched.slice(0, 3)) {
      try {
        await applySm2Review({
          userId,
          wordId: w.id,
          quality: qualityFromBinary(ans.isCorrect),
        })
        applied += 1
      } catch (e) {
        console.warn('quiz→SRS soft fail', w.id, e)
      }
    }
  }

  return { applied }
}

async function allowedWordIdsForQuestion(
  questionId: string,
  wordIds: string[],
): Promise<string[]> {
  if (!wordIds.length) return []
  const q = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      topic: {
        select: { words: { select: { wordId: true } } },
      },
    },
  })
  const allowed = new Set(
    (q?.topic?.words || []).map((w) => w.wordId).filter(Boolean) as string[],
  )
  return wordIds.filter((id) => allowed.has(id)).slice(0, 5)
}

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  try {
    const body = await readBody(event)
    const userId = await requireUserId(event)
    await ensureUser(userId)
    const { answers } = body as {
      answers: {
        questionId: string
        selectedIndex: number
        isCorrect?: boolean
        typedAnswer?: string
        wordIds?: string[]
      }[]
    }

    if (!Array.isArray(answers)) {
      throw createError({ statusCode: 400, message: 'Invalid payload' })
    }

    const questionIds = [
      ...new Set(answers.map((a) => a.questionId).filter(Boolean)),
    ]
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        type: true,
        solution: true,
        targetSentence: true,
        choices: {
          select: { index: true, isCorrect: true, text: true },
        },
      },
    })
    const byId = new Map(questions.map((q) => [q.id, q]))

    const graded: {
      questionId: string
      selectedIndex: number
      isCorrect: boolean
      wordIds?: string[]
    }[] = []

    for (const ans of answers) {
      const q = byId.get(ans.questionId)
      if (!q) {
        throw createError({
          statusCode: 400,
          message: `Unknown question: ${ans.questionId}`,
        })
      }
      graded.push({
        questionId: ans.questionId,
        selectedIndex: Number(ans.selectedIndex),
        isCorrect: gradeQuizAnswer(
          q,
          Number(ans.selectedIndex),
          typeof ans.typedAnswer === 'string' ? ans.typedAnswer : undefined,
        ),
        wordIds: ans.wordIds,
      })
    }

    const results = []
    for (const ans of graded) {
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

      if (Array.isArray(ans.wordIds) && ans.wordIds.length) {
        const safeIds = await allowedWordIdsForQuestion(
          ans.questionId,
          ans.wordIds,
        )
        for (const wordId of safeIds) {
          try {
            await applySm2Review({
              userId,
              wordId,
              quality: qualityFromBinary(ans.isCorrect),
            })
          } catch (e) {
            console.warn('quiz wordId→SRS soft fail', wordId, e)
          }
        }
      }
    }

    const soft = await applySrsFromAnswers(
      userId,
      graded.filter((a) => !a.wordIds?.length),
    )

    await recordStudyActivity(userId)

    return {
      success: true,
      count: results.length,
      srsApplied: soft.applied,
      results: graded.map((g) => ({
        questionId: g.questionId,
        isCorrect: g.isCorrect,
        selectedIndex: g.selectedIndex,
      })),
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to submit quiz attempts',
    })
  }
})
