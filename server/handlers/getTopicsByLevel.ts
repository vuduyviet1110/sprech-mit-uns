import { prisma } from '~/server/ultis/prisma'
import { createError } from 'h3'
import {
  completionRatioFromProgress,
  isWordDoneForUnlock,
} from '~/server/utils/curriculum-progress'

const UNLOCK_RATIO = 0.7

function completionRatio(
  words: {
    userProgress: {
      repetitions?: number | null
      isMastered?: boolean | null
      masteryLevel?: number | null
      lastReviewedAt?: Date | null
    }[]
  }[],
) {
  return completionRatioFromProgress(words)
}

export async function getTopicsByLevel(userId: string, language: string = 'de') {
  const topics = await prisma.topic.findMany({
    where: { language },
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      language: true,
      description: true,
      paragraph: true,
      englishTranslation: true,
      difficulty: true,
      estimatedTime: true,
      sortOrder: true,
      prerequisiteSlug: true,
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
                  repetitions: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
  })

  const ratioBySlug = new Map<string, number>()
  for (const topic of topics) {
    const words = topic.words.map((wt) => wt.word).filter(Boolean) as any[]
    ratioBySlug.set(topic.slug || '', completionRatio(words))
  }

  const topicsData: Record<string, any> = {}
  for (const topic of topics) {
    const level = topic.level || 'Other'
    if (!topicsData[level]) topicsData[level] = []

    const wordsCount = topic.words.length
    const completedWords = topic.words.filter((wordTopic) =>
      wordTopic.word?.userProgress.some((progress) =>
        isWordDoneForUnlock(progress),
      ),
    ).length
    const masteredWords = topic.words.filter((wordTopic) =>
      wordTopic.word?.userProgress.some((progress) => progress.isMastered),
    ).length

    let locked = false
    let unlockHint: string | null = null
    if (topic.prerequisiteSlug) {
      const prereqRatio = ratioBySlug.get(topic.prerequisiteSlug) ?? 0
      if (prereqRatio < UNLOCK_RATIO) {
        locked = true
        const prereq = topics.find((t) => t.slug === topic.prerequisiteSlug)
        unlockHint = `Hoàn thành ≥${Math.round(UNLOCK_RATIO * 100)}% bài «${prereq?.name || topic.prerequisiteSlug}» để mở khóa`
      }
    }

    topicsData[level].push({
      id: topic.id,
      slug: topic.slug,
      title: topic.name,
      language: topic.language,
      description: topic.description,
      paragraph: topic.paragraph,
      englishTranslation: topic.englishTranslation,
      difficulty: topic.difficulty,
      estimatedTime: topic.estimatedTime,
      sortOrder: topic.sortOrder,
      prerequisiteSlug: topic.prerequisiteSlug,
      wordsCount,
      completedWords,
      masteredWords,
      locked,
      unlockHint,
      completionRatio: Math.round((ratioBySlug.get(topic.slug || '') || 0) * 100) / 100,
    })
  }

  return topicsData
}

export async function getTopicDetails(slug: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      language: true,
      description: true,
      paragraph: true,
      englishTranslation: true,
      difficulty: true,
      estimatedTime: true,
      prerequisiteSlug: true,
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
                  repetitions: true,
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

  // Enforce unlock on lesson fetch
  if (topic.prerequisiteSlug) {
    const prereq = await prisma.topic.findUnique({
      where: { slug: topic.prerequisiteSlug },
      include: {
        words: {
          include: {
            word: {
              select: {
                userProgress: {
                  where: { userId },
                  select: { lastReviewedAt: true, masteryLevel: true, repetitions: true, isMastered: true },
                },
              },
            },
          },
        },
      },
    })
    if (prereq) {
      const words = prereq.words.map((w) => w.word).filter(Boolean) as any[]
      if (completionRatio(words) < UNLOCK_RATIO) {
        throw createError({
          statusCode: 403,
          message: `Hoàn thành ≥70% bài «${prereq.name}» trước khi học bài này`,
        })
      }
    }
  }

  const wordsCount = topic.words.length
  const completedWords = topic.words.filter((wordTopic) =>
    wordTopic.word?.userProgress.some((progress) => isWordDoneForUnlock(progress)),
  ).length
  const masteredWords = topic.words.filter((wordTopic) =>
    wordTopic.word?.userProgress.some((progress) => progress.isMastered),
  ).length

  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.name,
    language: topic.language || 'de',
    level: topic.level,
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
