import { PrismaClient } from '@prisma/client'
import { defineEventHandler, getQuery, readBody, createError } from 'h3'

const prisma = new PrismaClient()

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

  const where: any = {
    ...(search && {
      word: {
        contains: search.toString(),
        mode: 'insensitive',
      },
    }),
    ...(level && { level: level.toString() }),
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
  const body = await readBody(event)
  const {
    word,
    meaning,
    pronunciation,
    transcription,
    wordType,
    example,
    audioUrl,
    synonyms,
    imageUrl,
    antonyms,
    level,
    topicIds = [],
  } = body

  return prisma.vocabularyWord.create({
    data: {
      word,
      meaning,
      pronunciation,
      type: wordType,
      example,
      audioUrl,
      synonyms,
      transcription,
      imageUrl,
      antonyms,
      level,
      topics: {
        create: topicIds.map((id: string) => ({
          topic: { connect: { id } },
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
}
