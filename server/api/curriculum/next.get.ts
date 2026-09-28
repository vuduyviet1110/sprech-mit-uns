import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'
import {
  completionRatioFromProgress,
  isWordDoneForUnlock,
} from '~/server/utils/curriculum-progress'

const UNLOCK_RATIO = 0.7

function topicCompletionRatio(topic: {
  words: {
    word: {
      userProgress: {
        lastReviewedAt?: Date | null
        masteryLevel?: number | null
        repetitions?: number | null
        isMastered?: boolean | null
      }[]
    } | null
  }[]
}) {
  const words = topic.words
    .map((w) => w.word)
    .filter(Boolean)
    .map((w) => ({ userProgress: w!.userProgress }))
  return completionRatioFromProgress(words)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = await requireUserId(event)
  const language = ((query.language as string) || 'de').toLowerCase() === 'cs' ? 'cs' : 'de'

  const topics = await prisma.topic.findMany({
    where: {
      language,
      level: { in: ['A1', 'A2', 'B1'] },
    },
    orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
    include: {
      words: {
        include: {
          word: {
            select: {
              id: true,
              userProgress: {
                where: { userId },
                select: {
                  lastReviewedAt: true,
                  masteryLevel: true,
                  isMastered: true,
                  repetitions: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const bySlug = new Map(topics.map((t) => [t.slug || '', t]))

  const withLock = topics.map((topic) => {
    const ratio = topicCompletionRatio(topic)
    let locked = false
    let unlockHint: string | null = null

    if (topic.prerequisiteSlug) {
      const prereq = bySlug.get(topic.prerequisiteSlug)
      if (prereq) {
        const prereqRatio = topicCompletionRatio(prereq)
        if (prereqRatio < UNLOCK_RATIO) {
          locked = true
          unlockHint = `Hoàn thành ≥${Math.round(UNLOCK_RATIO * 100)}% bài «${prereq.name}» để mở khóa`
        }
      }
    }

    const wordsCount = topic.words.length
    const completedWords = topic.words.filter((wt) =>
      wt.word?.userProgress.some((p) => isWordDoneForUnlock(p)),
    ).length

    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.name,
      name: topic.name,
      level: topic.level,
      language: topic.language,
      description: topic.description,
      sortOrder: topic.sortOrder,
      prerequisiteSlug: topic.prerequisiteSlug,
      locked,
      unlockHint,
      completionRatio: Math.round(ratio * 100) / 100,
      wordsCount,
      completedWords,
      estimatedTime: topic.estimatedTime,
      difficulty: topic.difficulty,
    }
  })

  const next = withLock.find((t) => !t.locked && (t.completionRatio || 0) < UNLOCK_RATIO) || null

  return {
    language,
    unlockRatio: UNLOCK_RATIO,
    topics: withLock,
    next,
  }
})
