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
      include: {
        topics: {
          include: {
            topic: true,
          },
        },
      },
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
      topicIds = [], // 🆕 Thêm topicIds
      topicNames = [], // 🆕 Optional: hỗ trợ tạo mới
    } = await readBody(event)

    try {
      // 🆕 Tạo topic mới nếu có topicNames
      const createdTopics = await Promise.all(
        topicNames.map(async (name: string) => {
          const existing = await prisma.topic.findFirst({ where: { name } })
          if (existing) return existing
          return await prisma.topic.create({ data: { name } })
        }),
      )

      const allTopicIds = [...topicIds, ...createdTopics.map((t) => t.id)]

      // 🧠 Tạo vocabulary + liên kết topicIds
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
          topics: {
            create: allTopicIds.map((topicId: string) => ({
              topic: { connect: { id: topicId } },
            })),
          },
        },
        include: {
          topics: {
            include: {
              topic: true,
            },
          },
        },
      })

      return vocabulary
    } catch (error) {
      console.error(' Create error:', error)
      throw createError({
        statusCode: 500,
        message: 'Error creating vocabulary',
      })
    }
  }
})
