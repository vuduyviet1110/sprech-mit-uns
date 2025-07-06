import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    const { level, page, limit } = getQuery(event)
    const where = typeof level === 'string' ? { level } : {}

    const pageNum = Number(page) || 1
    const limitNum = Number(limit) || 20

    const vocabulary = await prisma.vocabularyWord.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    })

    return vocabulary
  } else if (method === 'POST') {
    const {
      word,
      meaning,
      example,
      level,
      audioUrl,
      imageUrl,
      transcription,
      type,
    } = await readBody(event)
    const vocabulary = await prisma.vocabularyWord.create({
      data: {
        word,
        meaning,
        example,
        level,
        audioUrl,
        imageUrl,
        transcription,
        type,
      },
    })
    return vocabulary
  }
})
