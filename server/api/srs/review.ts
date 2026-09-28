import { prisma } from '~/server/ultis/prisma'
import { applySm2Review } from '~/server/utils/apply-sm2-review'
import { getMasteryStage } from '~/server/utils/srs-sm2'
import { ensureUser, requireUserId } from '~/server/utils/user'

function duePriority(p: {
  isMastered: boolean
  repetitions: number
  interval: number
}): number {
  const stage = getMasteryStage(p)
  if (stage === 'learning') return 0
  if (stage === 'reviewing') return 1
  return 2
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const body = method === 'POST' ? await readBody(event) : null
  const userId = await requireUserId(event)
  await ensureUser(userId)

  if (method === 'GET') {
    const now = new Date()
    const lang = query.lang as string | undefined

    const whereCondition: any = {
      userId,
      nextReviewAt: {
        lte: now,
      },
    }

    if (lang) {
      whereCondition.word = {
        language: lang,
      }
    }

    const dueWordsRaw = await prisma.userWordProgress.findMany({
      where: whereCondition,
      include: {
        word: true,
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
      take: 40,
    })

    const dueWords = dueWordsRaw
      .map((p) => {
        const stage = getMasteryStage(p)
        return {
          ...p,
          stage,
          duePriority: duePriority(p),
        }
      })
      .sort((a, b) => {
        if (a.duePriority !== b.duePriority) return a.duePriority - b.duePriority
        return (
          new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
        )
      })
      .slice(0, 20)

    const totalDueCount = await prisma.userWordProgress.count({
      where: whereCondition,
    })

    const deCount = await prisma.userWordProgress.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
        word: { language: 'de' },
      },
    })

    const csCount = await prisma.userWordProgress.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
        word: { language: 'cs' },
      },
    })

    return {
      totalDueCount,
      counts: {
        de: deCount,
        cs: csCount,
      },
      dueWords,
    }
  }

  if (method === 'POST') {
    const { wordId, quality } = body

    if (!wordId || quality === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Word ID and quality score (0-5) are required',
      })
    }

    let targetWord = await prisma.vocabularyWord.findFirst({
      where: {
        OR: [
          { id: wordId },
          { word: { equals: wordId, mode: 'insensitive' } },
        ],
      },
    })

    if (!targetWord) {
      let wordMeaningText = body.meaning
      const wordLang = body.lang || 'cs'

      if (!wordMeaningText || wordMeaningText.includes('Từ vựng')) {
        try {
          const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${wordLang}&tl=vi&dt=t&q=${encodeURIComponent(wordId)}`
          const transRes = await fetch(transUrl)
          if (transRes.ok) {
            const data = await transRes.json()
            if (data && data[0] && Array.isArray(data[0])) {
              wordMeaningText = data[0].map((item: any) => item[0]).join('')
            }
          }
        } catch (e) {
          console.error('Auto translate error on SRS save:', e)
        }
      }

      targetWord = await prisma.vocabularyWord.create({
        data: {
          word: wordId,
          meaning: wordMeaningText || `Nghĩa của từ "${wordId}"`,
          language: wordLang,
          example: body.example || null,
          type: body.asPhrase || String(wordId).trim().split(/\s+/).length >= 3 ? 'Phrase' : null,
        },
      })
    } else if (
      targetWord &&
      (!targetWord.meaning || targetWord.meaning.includes('Từ vựng'))
    ) {
      let updatedMeaning = body.meaning
      const wordLang = body.lang || targetWord.language || 'cs'

      if (!updatedMeaning || updatedMeaning.includes('Từ vựng')) {
        try {
          const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${wordLang}&tl=vi&dt=t&q=${encodeURIComponent(targetWord.word)}`
          const transRes = await fetch(transUrl)
          if (transRes.ok) {
            const data = await transRes.json()
            if (data && data[0] && Array.isArray(data[0])) {
              updatedMeaning = data[0].map((item: any) => item[0]).join('')
            }
          }
        } catch (e) {
          console.error('Auto translate update error on SRS save:', e)
        }
      }

      if (updatedMeaning && !updatedMeaning.includes('Từ vựng')) {
        targetWord = await prisma.vocabularyWord.update({
          where: { id: targetWord.id },
          data: { meaning: updatedMeaning },
        })
      }
    }

    const result = await applySm2Review({
      userId,
      wordId: targetWord.id,
      quality: Number(quality),
      isInitialAdd: Boolean(body.isInitialAdd),
    })

    return {
      success: true,
      progress: result.progress,
      nextReviewDate: result.nextReviewDate,
      interval: result.interval,
      repetitions: result.repetitions,
      isMastered: result.isMastered,
      stage: result.stage,
      message: result.message,
    }
  }
})
