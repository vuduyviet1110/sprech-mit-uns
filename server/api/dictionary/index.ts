import { prisma } from '~/server/ultis/prisma'
import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { requireAdmin } from '~/server/utils/admin'

export default defineEventHandler((event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return handleGet(event)
  }

  if (method === 'POST') {
    return handlePost(event)
  }

  throw createError({
    statusCode: 405,
    statusMessage: `Method ${method} not allowed`,
  })
})

async function handleGet(event: any) {
  const {
    search,
    topic,
    level,
    type,
    language,
    date,
    page = '1',
    limit = '10',
  } = getQuery(event)

  const pageNum = Number(page) || 1
  const limitNum = Number(limit) || 10
  const skip = (pageNum - 1) * limitNum

  let dateFilter = {}
  const now = new Date()
  if (date) {
    switch (date.toString()) {
      case 'today': {
        const startOfToday = new Date(now.setHours(0, 0, 0, 0))
        const endOfToday = new Date(now.setHours(23, 59, 59, 999))
        dateFilter = {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        }
        break
      }
      case 'yesterday': {
        const startOfYesterday = new Date(now)
        startOfYesterday.setDate(now.getDate() - 1)
        startOfYesterday.setHours(0, 0, 0, 0)
        const endOfYesterday = new Date(startOfYesterday)
        endOfYesterday.setHours(23, 59, 59, 999)
        dateFilter = {
          createdAt: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
        }
        break
      }
      case 'last_3_days': {
        const startOfThreeDaysAgo = new Date(now)
        startOfThreeDaysAgo.setDate(now.getDate() - 2)
        startOfThreeDaysAgo.setHours(0, 0, 0, 0)
        dateFilter = {
          createdAt: {
            gte: startOfThreeDaysAgo,
          },
        }
        break
      }
      case 'this_week': {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1)
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter = {
          createdAt: {
            gte: startOfWeek,
          },
        }
        break
      }
    }
  }

  const typeStr = type ? type.toString() : ''
  const typeFilter = typeStr
    ? typeStr === 'Phrase'
      ? { type: { in: ['Phrase', 'Interjection'] } }
      : { type: { equals: typeStr, mode: 'insensitive' } }
    : {}

  const searchStr = search ? search.toString().trim() : ''

  const where: any = {
    ...(searchStr && {
      OR: [
        { word: { contains: searchStr, mode: 'insensitive' } },
        { meaning: { contains: searchStr, mode: 'insensitive' } },
        { example: { contains: searchStr, mode: 'insensitive' } },
      ],
    }),
    ...(level && { level: level.toString() }),
    ...(language && { language: language.toString() }),
    ...typeFilter,
    ...(topic && {
      topics: {
        some: {
          topic: {
            name: topic.toString(),
          },
        },
      },
    }),
    ...dateFilter,
  }

  const [items, totalCount] = await Promise.all([
    prisma.vocabularyWord.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        topics: {
          include: {
            topic: true,
          },
        },
      },
    }),
    prisma.vocabularyWord.count({ where }),
  ])

  return {
    items,
    meta: {
      hasMore: skip + items.length < totalCount,
      totalCount,
      currentPage: pageNum,
      currentTotal: items.length + limitNum * (pageNum - 1),
      totalPages: Math.ceil(totalCount / limitNum),
    },
  }
}

async function handlePost(event: any) {
  await requireAdmin(event)
  const body = await readBody(event)
  const {
    word,
    meaning,
    pronunciation,
    transcription,
    type: bodyType,
    wordType,
    example,
    audioUrl,
    synonyms,
    imageUrl,
    antonyms,
    level,
    language,
    topicId,
    topicIds = [],
  } = body
  const type = bodyType || wordType
  const headword = String(word || '').trim()
  const gloss = String(meaning || '').trim()
  const lang = language === 'cs' ? 'cs' : 'de'

  if (!headword || !gloss) {
    throw createError({
      statusCode: 400,
      message: 'Cần có từ và nghĩa',
    })
  }

  const ids = [
    ...(Array.isArray(topicIds) ? topicIds : []),
    ...(topicId ? [topicId] : []),
  ].filter((id: unknown) => typeof id === 'string' && id)

  const duplicate = await prisma.vocabularyWord.findFirst({
    where: {
      word: { equals: headword, mode: 'insensitive' },
      language: lang,
      ...(level ? { level: String(level) } : {}),
    },
    select: { id: true },
  })
  if (duplicate) {
    throw createError({
      statusCode: 409,
      message: 'Từ này đã có trong từ điển ở cấp độ đó',
    })
  }

  return prisma.vocabularyWord.create({
    data: {
      word: headword,
      meaning: gloss,
      pronunciation,
      type,
      example: example ? String(example) : null,
      audioUrl,
      synonyms,
      transcription,
      imageUrl,
      antonyms,
      level: level ? String(level) : null,
      language: lang,
      topics: ids.length
        ? {
            create: ids.map((id: string) => ({
              topic: { connect: { id } },
            })),
          }
        : undefined,
    },
    include: {
      topics: {
        include: {
          topic: true,
        },
      },
    },
  })
}
