import { prisma } from '~/server/ultis/prisma'

const SUPPORTED_TYPES = new Set([
  'multiple_choice',
  'sentence_builder',
  'dictation',
  'typed_recall',
  'cloze',
])

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawTypes = typeof query.types === 'string' ? query.types : ''
    const requestedTypes = rawTypes
      .split(',')
      .map((t) => t.trim())
      .filter((t) => SUPPORTED_TYPES.has(t))

    const take = Math.min(Math.max(Number(query.limit) || 30, 1), 50)

    const questions = await prisma.quizQuestion.findMany({
      take,
      where: requestedTypes.length
        ? { type: { in: requestedTypes } }
        : undefined,
      include: {
        choices: true,
      },
    })

    // Shuffle questions randomly
    const shuffled = questions.sort(() => 0.5 - Math.random())

    return shuffled.map((q: any) => ({
      id: q.id,
      text: q.text,
      type: q.type || 'multiple_choice',
      level: q.level || 'A1',
      audioUrl: q.audioUrl,
      targetSentence: q.targetSentence,
      solution: q.solution,
      scrambleWords: q.scrambleWords || [],
      choices: q.choices.map((c: any) => ({
        id: c.id,
        index: c.index,
        text: c.text,
        isCorrect: c.isCorrect,
      })),
    }))
  } catch (error) {
    console.error('Error fetching random quiz questions:', error)
    return []
  }
})
