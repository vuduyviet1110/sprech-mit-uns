import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = await requireUserId(event)
  const lang = ((query.lang as string) || 'de').toLowerCase()
  const limit = Math.min(Number(query.limit) || 8, 16)

  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)

  let progress = await prisma.userWordProgress.findMany({
    where: {
      userId,
      word: { language: lang },
      OR: [
        { lastReviewedAt: { gte: dayStart } },
        { nextReviewAt: { lte: now } },
      ],
    },
    include: { word: true },
    take: limit * 2,
    orderBy: { lastReviewedAt: 'desc' },
  })

  if (progress.length < 3) {
    progress = await prisma.userWordProgress.findMany({
      where: {
        userId,
        word: { language: lang },
      },
      include: { word: true },
      take: limit,
      orderBy: { lastReviewedAt: 'desc' },
    })
  }

  if (progress.length < 3) {
    const words = await prisma.vocabularyWord.findMany({
      where: { language: lang },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    return {
      prompts: words.map((w) => ({
        id: w.id,
        word: w.word,
        meaning: w.meaning,
        example: w.example,
        language: w.language,
        level: w.level,
      })),
    }
  }

  const seen = new Set<string>()
  const prompts = []
  for (const p of progress) {
    if (!p.word || seen.has(p.word.id)) continue
    seen.add(p.word.id)
    prompts.push({
      id: p.word.id,
      word: p.word.word,
      meaning: p.word.meaning,
      example: p.word.example,
      language: p.word.language,
      level: p.word.level,
    })
    if (prompts.length >= limit) break
  }

  return { prompts }
})
