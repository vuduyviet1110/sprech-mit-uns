import { defineEventHandler } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)

    const progressRecords = await prisma.userWordProgress.findMany({
      where: { userId },
    })

    const totalLearned = progressRecords.length
    const masteredCount = progressRecords.filter((p) => p.isMastered).length
    const totalCorrect = progressRecords.reduce(
      (sum, p) => sum + (p.correctCount || 0),
      0,
    )

    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { studyStreak: true },
    })
    const userStreak = userRow?.studyStreak || 0

    const today = new Date()
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const dailyRow = await prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId, date: dateKey } },
    })
    const computedXp = Math.min(totalLearned * 20 + totalCorrect * 10, 500)
    const dailyXp = dailyRow
      ? Math.min(Math.max(dailyRow.xp, computedXp), 500)
      : computedXp

    const topUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        progress: {
          select: {
            correctCount: true,
            masteryLevel: true,
          },
        },
      },
    })

    const leaderboards = topUsers.map((user, idx) => {
      const userTotalScore = user.progress.reduce(
        (sum, p) => sum + p.correctCount * 50 + p.masteryLevel * 20,
        0,
      )
      const name =
        user.id === userId ? 'Bạn' : user.email.split('@')[0] || `Học viên #${idx + 1}`
      return {
        rank: idx + 1,
        name: user.id === userId ? `${name} (Bạn)` : name,
        score: userTotalScore,
        avatar:
          idx === 0 ? '👨‍🎓' : idx === 1 ? '🥷' : idx === 2 ? '👩‍💻' : idx === 3 ? '👨‍🔬' : '👩‍🎨',
        isUser: user.id === userId,
      }
    })

    leaderboards.sort((a, b) => b.score - a.score)
    leaderboards.forEach((u, i) => {
      u.rank = i + 1
    })

    return {
      success: true,
      userStreak,
      dailyXp,
      dailyXpTarget: 500,
      leaderboards,
      masteredCount,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Error fetching quiz stats:', error)
    return {
      success: false,
      userStreak: 0,
      dailyXp: 0,
      dailyXpTarget: 500,
      leaderboards: [],
    }
  }
})
