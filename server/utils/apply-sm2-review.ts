import { prisma } from '~/server/ultis/prisma'
import { calculateSM2, type MasteryStage } from '~/server/utils/srs-sm2'
import {
  masteryLevelFromSm2,
  qualityFromBinary,
} from '~/server/utils/sm2-quality'
import { recordStudyActivity } from '~/server/utils/record-study-activity'

export type ApplySm2Options = {
  userId: string
  wordId: string
  quality: number
  /** When true, card is due immediately (initial add to deck). */
  isInitialAdd?: boolean
}

export type ApplySm2Result = {
  progress: Awaited<ReturnType<typeof prisma.userWordProgress.upsert>>
  nextReviewDate: Date
  interval: number
  repetitions: number
  isMastered: boolean
  stage: MasteryStage
  easinessFactor: number
  message: string
}

export { masteryLevelFromSm2, qualityFromBinary }

/**
 * Single write path for vocabulary retention — always SM-2.
 */
export async function applySm2Review(
  opts: ApplySm2Options,
): Promise<ApplySm2Result> {
  const quality = Math.max(0, Math.min(5, Number(opts.quality)))
  const { userId, wordId, isInitialAdd = false } = opts

  const existingProgress = await prisma.userWordProgress.findUnique({
    where: { userId_wordId: { userId, wordId } },
  })

  const sm2Result = calculateSM2({
    quality,
    repetitions: existingProgress?.repetitions || 0,
    interval: existingProgress?.interval || 0,
    easinessFactor: existingProgress?.easinessFactor || 2.5,
    isMastered: existingProgress?.isMastered || false,
  })

  const reviewDueDate =
    isInitialAdd || !existingProgress ? new Date() : sm2Result.nextReviewAt

  const mirroredLevel = masteryLevelFromSm2({
    repetitions: sm2Result.repetitions,
    isMastered: sm2Result.isMastered,
    quality,
  })

  const wordStreak =
    quality >= 3 ? (existingProgress?.streak || 0) + 1 : 0

  const updatedProgress = await prisma.userWordProgress.upsert({
    where: { userId_wordId: { userId, wordId } },
    create: {
      userId,
      wordId,
      nextReviewAt: reviewDueDate,
      easinessFactor: sm2Result.easinessFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      correctCount: quality >= 3 ? 1 : 0,
      incorrectCount: quality < 3 ? 1 : 0,
      lastCorrect: quality >= 3,
      isMastered: sm2Result.isMastered,
      masteryLevel: mirroredLevel,
      streak: wordStreak,
      lastReviewedAt: new Date(),
    },
    update: {
      nextReviewAt: isInitialAdd ? new Date() : sm2Result.nextReviewAt,
      easinessFactor: sm2Result.easinessFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      correctCount: quality >= 3 ? { increment: 1 } : undefined,
      incorrectCount: quality < 3 ? { increment: 1 } : undefined,
      lastReviewedAt: new Date(),
      lastCorrect: quality >= 3,
      isMastered: sm2Result.isMastered,
      masteryLevel: mirroredLevel,
      streak: wordStreak,
    },
  })

  try {
    await recordStudyActivity(userId)
  } catch (e) {
    console.warn('recordStudyActivity failed:', e)
  }

  const message =
    quality < 3
      ? 'Đã quên — lịch ôn reset, học lại từ đầu.'
      : sm2Result.isMastered
        ? `Đã thuộc (ôn thưa) — lần tới sau ${sm2Result.interval} ngày.`
        : `Lần ôn tới: sau ${sm2Result.interval} ngày · chuỗi nhớ ${sm2Result.repetitions}/4.`

  return {
    progress: updatedProgress,
    nextReviewDate: sm2Result.nextReviewAt,
    interval: sm2Result.interval,
    repetitions: sm2Result.repetitions,
    isMastered: sm2Result.isMastered,
    stage: sm2Result.stage,
    easinessFactor: sm2Result.easinessFactor,
    message,
  }
}
