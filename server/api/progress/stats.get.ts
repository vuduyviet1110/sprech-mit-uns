import { defineEventHandler } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { studyStreak: true, lastStudyDate: true },
  })

  const totalLearned = await prisma.userWordProgress.count({
    where: { userId },
  })

  const masteredCount = await prisma.userWordProgress.count({
    where: {
      userId,
      isMastered: true,
    },
  })

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const learnedThisWeek = await prisma.userWordProgress.count({
    where: {
      userId,
      lastReviewedAt: { gte: oneWeekAgo },
    },
  })

  const totalVocabWords = await prisma.vocabularyWord.count()

  const now = new Date()
  const dueSrsCount = await prisma.userWordProgress.count({
    where: {
      userId,
      nextReviewAt: { lte: now },
    },
  })

  const quizWins = await prisma.quizAttempt.count({
    where: { userId, isCorrect: true },
  })

  const currentStreak = user?.studyStreak || 0

  return {
    wordsLearned: totalLearned,
    learnedThisWeek,
    masteredCount,
    masteryRate: totalLearned > 0 ? Math.round((masteredCount / totalLearned) * 100) : 0,
    currentStreak,
    streak: currentStreak,
    lastStudyDate: user?.lastStudyDate || null,
    dueSrsCount,
    weeklyGoalTarget: 50,
    weeklyGoalCurrent: Math.min(learnedThisWeek, 50),
    totalVocabWords,
    quizWins,
  }
})
