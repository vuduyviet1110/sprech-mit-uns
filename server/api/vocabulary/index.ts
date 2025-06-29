import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    const { level } = getQuery(event)
    const where = typeof level === 'string' ? { level } : {}
    const vocabulary = await prisma.vocabularyWord.findMany({ where })
    return vocabulary
  } else if (method === 'POST') {
    const { word, meaning, example, level, audioUrl, imageUrl } =
      await readBody(event)
    const vocabulary = await prisma.vocabularyWord.create({
      data: { word, meaning, example, level, audioUrl, imageUrl },
    })
    return vocabulary
  }
})
