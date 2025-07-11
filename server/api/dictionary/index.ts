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
  const { search, topic, level, page = '1', limit = '10' } = getQuery(event)

  const pageNum = Number(page) || 1
  const limitNum = Number(limit) || 10
  const skip = (pageNum - 1) * limitNum

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
