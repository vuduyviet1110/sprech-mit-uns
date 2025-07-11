import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = String(event?.context?.params?.id || '')
  const method = event.node.req.method

  // GET: Lấy thông tin từ vựng theo ID
  if (method === 'GET') {
    try {
      const vocabulary = await prisma.vocabularyWord.findUnique({
        where: { id },
      })
      if (!vocabulary) {
        throw createError({ statusCode: 404, message: 'Vocabulary not found' })
      }
      return vocabulary
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: 'Error fetching vocabulary',
      })
    }
  }

  // PUT: Cập nhật từ vựng
  if (method === 'PUT') {
    const body = await readBody(event)
    const id = String(event.context.params?.id || '')

    const {
      word,
      meaning,
      pronunciation,
      transcription,
      example,
      audioUrl,
      synonyms,
      imageUrl,
      wordType: type,
      antonyms,
      level,
      topicIds = [],
      topicNames = [],
    } = body

    try {
      // Tạo các topic mới nếu cần
      const createdTopics = await Promise.all(
        (topicNames || []).map(async (name: string) => {
          const existing = await prisma.topic.findFirst({ where: { name } })
          if (existing) return existing
          return await prisma.topic.create({ data: { name } })
        }),
      )

      const allTopicIds = [
        ...topicIds,
        ...createdTopics.map((topic) => topic.id),
      ]

      // Cập nhật thông tin từ vựng (không động đến topics)
      await prisma.vocabularyWord.update({
        where: { id },
        data: {
          word,
          meaning,
          example,
          level,
          audioUrl,
          pronunciation,
          antonyms,
          synonyms,
          imageUrl,
          transcription,
          type,
        },
      })

      // Xoá các WordTopic không còn nữa
      await prisma.wordTopic.deleteMany({
        where: {
          wordId: id,
          NOT: {
            topicId: {
              in: allTopicIds,
            },
          },
        },
      })

      // Upsert từng WordTopic
      await Promise.all(
        allTopicIds.map((topicId) =>
          prisma.wordTopic.upsert({
            where: {
              wordId_topicId: {
                wordId: id,
                topicId,
              },
            },
            update: {},
            create: {
              wordId: id,
              topicId,
            },
          }),
        ),
      )

      // Trả lại vocabulary có topics
      const vocabulary = await prisma.vocabularyWord.findUnique({
        where: { id },
        include: {
          topics: true,
        },
      })

      return vocabulary
    } catch (error) {
      console.error('💥 Update error:', error)
      throw createError({
        statusCode: 500,
        message: 'Error updating vocabulary',
      })
    }
  }

  if (method === 'DELETE') {
    console.log(`Deleting vocabulary with ID: ${id}`)
    try {
      await prisma.vocabularyWord.delete({ where: { id } })
      return { message: 'Vocabulary deleted successfully' }
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: 'Error deleting vocabulary',
      })
    }
  }
})
