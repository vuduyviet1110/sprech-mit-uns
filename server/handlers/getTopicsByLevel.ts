import { PrismaClient } from '@prisma/client'
import { createError } from 'h3'

const prisma = new PrismaClient()

export async function getTopicsByLevel(userId: string) {
  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      description: true,
      paragraph: true,
      englishTranslation: true,
      difficulty: true,
      estimatedTime: true,
      words: {
        select: {
          word: {
            select: {
              id: true,
              word: true,
              userProgress: {
                where: { userId },
                select: {
                  isMastered: true,
                  masteryLevel: true,
                  lastReviewedAt: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { level: 'asc' },
  })

  const topicsData: Record<string, any> = {}
  for (const topic of topics) {
    const level = topic.level || 'Other'
    if (!topicsData[level]) {
      topicsData[level] = []
    }

    const wordsCount = topic.words.length
    const completedWords = topic.words.filter((wordTopic) =>
      wordTopic.word?.userProgress.some((progress) => progress.lastReviewedAt),
    ).length
    const masteredWords = topic.words.filter((wordTopic) =>
      wordTopic.word?.userProgress.some((progress) => progress.isMastered),
    ).length

    topicsData[level].push({
      id: topic.id,
      slug: topic.slug, // Thêm slug
      title: topic.name,
      description: topic.description,
      paragraph: topic.paragraph,
      englishTranslation: topic.englishTranslation,
      difficulty: topic.difficulty,
      estimatedTime: topic.estimatedTime,
      wordsCount,
      completedWords,
      masteredWords,
    })
  }

  return topicsData
}

export async function getTopicDetails(slug: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { slug }, // Tìm theo slug
    select: {
      id: true,
      name: true,
      slug: true, // Thêm slug
      level: true,
      description: true,
      paragraph: true,
      englishTranslation: true,
      difficulty: true,
      estimatedTime: true,
      words: {
        select: {
          word: {
            select: {
              id: true,
              word: true,
              meaning: true,
              example: true,
              pronunciation: true,
              type: true,
              transcription: true,
              imageUrl: true,
              audioUrl: true,
              synonyms: true,
              antonyms: true,
              level: true,
              userProgress: {
                where: { userId },
                select: {
                  correctCount: true,
                  incorrectCount: true,
                  masteryLevel: true,
                  isMastered: true,
                  lastReviewedAt: true,
                  nextReviewAt: true,
                  streak: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!topic) {
    throw createError({ statusCode: 404, message: 'Topic not found' })
  }

  const wordsCount = topic.words.length
  const completedWords = topic.words.filter((wordTopic) =>
    wordTopic.word?.userProgress.some((progress) => progress.lastReviewedAt),
  ).length
  const masteredWords = topic.words.filter((wordTopic) =>
    wordTopic.word?.userProgress.some((progress) => progress.isMastered),
  ).length

  return {
    id: topic.id,
    slug: topic.slug, // Thêm slug
    title: topic.name,
    description: topic.description,
    paragraph: topic.paragraph,
    englishTranslation: topic.englishTranslation,
    difficulty: topic.difficulty,
    estimatedTime: topic.estimatedTime,
    wordsCount,
    completedWords,
    masteredWords,
    words: topic.words.map((wordTopic) => ({
      id: wordTopic.word?.id,
      word: wordTopic.word?.word,
      meaning: wordTopic.word?.meaning,
      example: wordTopic.word?.example,
      pronunciation: wordTopic.word?.pronunciation,
      type: wordTopic.word?.type,
      transcription: wordTopic.word?.transcription,
      imageUrl: wordTopic.word?.imageUrl,
      audioUrl: wordTopic.word?.audioUrl,
      synonyms: wordTopic.word?.synonyms || [],
      antonyms: wordTopic.word?.antonyms || [],
      level: wordTopic.word?.level,
      progress: wordTopic.word?.userProgress[0] || null,
    })),
  }
}
