import { prisma } from '~/server/ultis/prisma'
import { ensureUser, requireUserId } from '~/server/utils/user'

function dateFilter(date?: string) {
  if (!date) return undefined
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (date === 'today') {
    return { gte: start }
  }
  if (date === 'yesterday') {
    const y = new Date(start)
    y.setDate(y.getDate() - 1)
    return { gte: y, lt: start }
  }
  if (date === 'last_3_days') {
    const d = new Date(start)
    d.setDate(d.getDate() - 2)
    return { gte: d }
  }
  if (date === 'this_week') {
    const d = new Date(start)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - (day - 1))
    return { gte: d }
  }
  return undefined
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    const query = getQuery(event)
    const userId = await requireUserId(event)
    await ensureUser(userId)

    const pageNum = Number(query.page) || 1
    const limitNum = Number(query.limit) || 20
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const level = typeof query.level === 'string' ? query.level : undefined
    const language =
      typeof query.language === 'string' && query.language
        ? query.language
        : undefined
    const source =
      typeof query.source === 'string' && query.source
        ? query.source
        : undefined
    const createdAt = dateFilter(
      typeof query.date === 'string' ? query.date : undefined,
    )

    const where: any = {
      userId,
      ...(level ? { level } : {}),
      ...(language ? { language } : {}),
      ...(source ? { source } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(search
        ? {
            OR: [
              { word: { contains: search, mode: 'insensitive' } },
              { meaning: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [items, totalCount] = await Promise.all([
      prisma.userVocabularyEntry.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          vocabularyWord: {
            select: {
              id: true,
              pronunciation: true,
              audioUrl: true,
              transcription: true,
            },
          },
        },
      }),
      prisma.userVocabularyEntry.count({ where }),
    ])

    const currentTotal = Math.min(pageNum * limitNum, totalCount)

    return {
      items,
      meta: {
        hasMore: currentTotal < totalCount,
        totalCount,
        currentTotal,
        page: pageNum,
        limit: limitNum,
      },
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const userId = await requireUserId(event)
    await ensureUser(userId)

    const {
      wordId,
      word,
      meaning,
      note,
      language = 'de',
      level,
      type,
      example,
      source = wordId ? 'dictionary' : 'manual',
    } = body

    if (!word?.trim() || !meaning?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'word and meaning are required',
      })
    }

    // Save from dictionary: upsert by userId+wordId
    if (wordId) {
      const catalog = await prisma.vocabularyWord.findUnique({
        where: { id: wordId },
      })
      if (!catalog) {
        throw createError({ statusCode: 404, message: 'Dictionary word not found' })
      }

      const entry = await prisma.userVocabularyEntry.upsert({
        where: {
          userId_wordId: { userId, wordId },
        },
        create: {
          userId,
          wordId,
          word: catalog.word,
          meaning: catalog.meaning,
          language: catalog.language || language,
          level: catalog.level || level || null,
          type: catalog.type || type || null,
          example: catalog.example || example || null,
          note: note || null,
          source: 'dictionary',
        },
        update: {
          note: note !== undefined ? note : undefined,
        },
      })
      return entry
    }

    // Manual add
    const entry = await prisma.userVocabularyEntry.create({
      data: {
        userId,
        word: word.trim(),
        meaning: meaning.trim(),
        note: note || null,
        language,
        level: level || null,
        type: type || null,
        example: example || null,
        source: source === 'dictionary' ? 'dictionary' : 'manual',
      },
    })
    return entry
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
