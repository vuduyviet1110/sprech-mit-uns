import { prisma } from '~/server/ultis/prisma'
import { nextStudyStreak, todayKey } from '~/server/utils/study-streak'

/** Record that the user studied today; updates calendar studyStreak. */
export async function recordStudyActivity(
  userId: string,
  date = todayKey(),
): Promise<{ studyStreak: number; lastStudyDate: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { studyStreak: true, lastStudyDate: true },
  })
  if (!user) {
    return { studyStreak: 0, lastStudyDate: date }
  }

  const next = nextStudyStreak({
    studyStreak: user.studyStreak,
    lastStudyDate: user.lastStudyDate,
    today: date,
  })

  if (
    user.lastStudyDate === next.lastStudyDate &&
    user.studyStreak === next.studyStreak
  ) {
    return next
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      studyStreak: next.studyStreak,
      lastStudyDate: next.lastStudyDate,
    },
  })
  return next
}
