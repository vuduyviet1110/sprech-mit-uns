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
    try {
      const vocabulary = await prisma.vocabularyWord.update({
        where: { id },
        data: {
          word: body.word,
          meaning: body.meaning,
          example: body.example,
          level: body.level,
          audioUrl: body.audioUrl,
          imageUrl: body.imageUrl,
        },
      })
      return vocabulary
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: 'Error updating vocabulary',
      })
    }
  }

  // DELETE: Xóa từ vựng
  if (method === 'DELETE') {
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
