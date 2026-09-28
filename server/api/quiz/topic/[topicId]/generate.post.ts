import { defineEventHandler, getRouterParams, getQuery, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { generateQuestionsFromVocab } from '~/server/utils/quiz-generate'
import { toCreateData, validateQuestionInput } from '~/server/utils/quiz-validate'
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
  const { topicId } = getRouterParams(event)
  if (!topicId) {
    throw createError({ statusCode: 400, message: 'topicId is required' })
  }

  const query = getQuery(event)
  const persist = String(query.persist || '') === 'true'
  if (persist) {
    await requireCatalogWriter(event)
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      level: true,
      language: true,
      words: {
        select: {
          word: {
            select: {
              word: true,
              meaning: true,
              example: true,
              level: true,
              language: true,
            },
          },
        },
      },
    },
  })

  if (!topic) {
    throw createError({ statusCode: 404, message: 'Topic not found' })
  }

  const topicWords = topic.words
    .map((wt) => wt.word)
    .filter((w): w is NonNullable<typeof w> => Boolean(w?.word && w?.meaning))

  if (!topicWords.length) {
    throw createError({
      statusCode: 400,
      message: 'Topic has no vocabulary words to generate quiz from',
    })
  }

  let distractorPool: typeof topicWords = []
  if (topicWords.length < 4) {
    const extra = await prisma.vocabularyWord.findMany({
      where: { language: topic.language || 'de' },
      select: {
        word: true,
        meaning: true,
        example: true,
        level: true,
        language: true,
      },
      take: 24,
    })
    const topicKeys = new Set(topicWords.map((v) => v.word.toLowerCase()))
    distractorPool = extra.filter((w) => !topicKeys.has(w.word.toLowerCase()))
  }

  const drafts = generateQuestionsFromVocab(topicWords, {
    maxQuestions: 8,
    level: topic.level,
    distractorPool,
  })

  if (!drafts.length) {
    throw createError({
      statusCode: 400,
      message: 'Could not generate any questions from this topic vocabulary',
    })
  }

  for (const q of drafts) {
    const err = validateQuestionInput(q)
    if (err) throw createError({ statusCode: 400, message: err })
  }

  if (!persist) {
    return { persisted: false, questions: drafts }
  }

  const created = await prisma.$transaction(
    drafts.map((q) =>
      prisma.quizQuestion.create({
        data: toCreateData(topicId, q) as any,
        select: questionSelect,
      }),
    ),
  )

  return { persisted: true, questions: created }
})
