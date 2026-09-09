import { prisma } from '~/server/ultis/prisma'
import { calculateSM2 } from '~/server/utils/srs-sm2'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const userId = (query.userId as string) || 'user-demo-id'

  // GET: Lấy danh sách từ vựng đến hạn cần ôn tập (Due Reviews)
  if (method === 'GET') {
    const now = new Date()

    const dueWords = await prisma.userWordProgress.findMany({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
      },
      include: {
        word: true,
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
      take: 20,
    })

    const totalDueCount = await prisma.userWordProgress.count({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
      },
    })

    return {
      totalDueCount,
      dueWords,
    }
  }

  // POST: Cập nhật kết quả ôn tập từ vựng (Review Answer Quality 0 - 5)
  if (method === 'POST') {
    const body = await readBody(event)
    const { wordId, quality } = body // quality: 0 (Quên), 3 (Gần nhớ), 5 (Nhớ rõ)

    if (!wordId || quality === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Word ID and quality score (0-5) are required',
      })
    }

    // Tìm progress hiện tại hoặc khởi tạo mới
    let existingProgress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    })

    const currentSM2Input = {
      quality: Number(quality),
      repetitions: existingProgress?.repetitions || 0,
      interval: existingProgress?.interval || 0,
      easinessFactor: existingProgress?.easinessFactor || 2.5,
    }

    const sm2Result = calculateSM2(currentSM2Input)

    const updatedProgress = await prisma.userWordProgress.upsert({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      create: {
        userId,
        wordId,
        nextReviewAt: sm2Result.nextReviewAt,
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        correctCount: quality >= 3 ? 1 : 0,
        incorrectCount: quality < 3 ? 1 : 0,
        lastCorrect: quality >= 3,
        isMastered: sm2Result.isMastered,
      },
      update: {
        nextReviewAt: sm2Result.nextReviewAt,
        easinessFactor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        correctCount: quality >= 3 ? { increment: 1 } : undefined,
        incorrectCount: quality < 3 ? { increment: 1 } : undefined,
        lastReviewedAt: new Date(),
        lastCorrect: quality >= 3,
        isMastered: sm2Result.isMastered,
      },
    })

    return {
      success: true,
      progress: updatedProgress,
      nextReviewDate: sm2Result.nextReviewAt,
    }
  }
})
