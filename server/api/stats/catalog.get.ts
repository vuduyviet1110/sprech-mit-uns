import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async () => {
  const [topics, words, topicsDe, topicsCs, wordsDe, wordsCs] = await Promise.all([
    prisma.topic.count(),
    prisma.vocabularyWord.count(),
    prisma.topic.count({ where: { language: 'de' } }),
    prisma.topic.count({ where: { language: 'cs' } }),
    prisma.vocabularyWord.count({ where: { language: 'de' } }),
    prisma.vocabularyWord.count({ where: { language: 'cs' } }),
  ])

  return {
    topics,
    words,
    byLanguage: {
      de: { topics: topicsDe, words: wordsDe },
      cs: { topics: topicsCs, words: wordsCs },
    },
  }
})
