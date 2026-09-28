import { prisma } from '~/server/ultis/prisma'
import { ensureUser, requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const id = String(event?.context?.params?.id || '')
  const method = event.node.req.method
  const userId = await requireUserId(event)
  await ensureUser(userId)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing entry id' })
  }

  const existing = await prisma.userVocabularyEntry.findFirst({
    where: { id, userId },
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Notebook entry not found' })
  }

  if (method === 'GET') {
    return existing
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { word, meaning, note, language, level, type, example } = body

    if (existing.source === 'dictionary' && existing.wordId) {
      return prisma.userVocabularyEntry.update({
        where: { id },
        data: {
          note: note !== undefined ? note : existing.note,
          meaning: meaning?.trim() ? meaning.trim() : existing.meaning,
        },
      })
    }

    return prisma.userVocabularyEntry.update({
      where: { id },
      data: {
        word: word?.trim() || existing.word,
        meaning: meaning?.trim() || existing.meaning,
        note: note !== undefined ? note : existing.note,
        language: language || existing.language,
        level: level !== undefined ? level : existing.level,
        type: type !== undefined ? type : existing.type,
        example: example !== undefined ? example : existing.example,
      },
    })
  }

  if (method === 'DELETE') {
    await prisma.userVocabularyEntry.delete({ where: { id } })
    return { message: 'Notebook entry deleted' }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
