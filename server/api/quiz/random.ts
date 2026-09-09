import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  try {
    const questions = await prisma.quizQuestion.findMany({
      take: 30,
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
