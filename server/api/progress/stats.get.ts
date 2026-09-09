import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = (query.userId as string) || 'user-demo-id'

  // Total learned words for user
  const totalLearned = await prisma.userWordProgress.count({
    where: { userId },
  })

  // Mastered words count
  const masteredCount = await prisma.userWordProgress.count({
    where: {
      userId,
      OR: [
        { isMastered: true },
        { masteryLevel: { gte: 4 } },
      ],
    },
  })

  // Words learned this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const learnedThisWeek = await prisma.userWordProgress.count({
    where: {
      userId,
      lastReviewedAt: { gte: oneWeekAgo },
    },
  })

  // Total vocabulary words in system
  const totalVocabWords = await prisma.vocabularyWord.count()

  // Due count for SRS
  const now = new Date()
  const dueSrsCount = await prisma.userWordProgress.count({
    where: {
      userId,
      nextReviewAt: { lte: now },
    },
  })

  // Calculate streak
  const maxStreak = await prisma.userWordProgress.aggregate({
    where: { userId },
    _max: { streak: true },
  })

  return {
    wordsLearned: totalLearned,
    learnedThisWeek,
    masteredCount,
    masteryRate: totalLearned > 0 ? Math.round((masteredCount / totalLearned) * 100) : 0,
    currentStreak: maxStreak._max.streak || (totalLearned > 0 ? 1 : 0),
    dueSrsCount,
    weeklyGoalTarget: 50,
    weeklyGoalCurrent: Math.min(learnedThisWeek, 50),
    totalVocabWords,
  }
})
