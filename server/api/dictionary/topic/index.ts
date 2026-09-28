import { prisma } from '~/server/ultis/prisma'
import { defineEventHandler, readBody, getQuery, createError, sendError } from 'h3'
import { requireCatalogWriter } from '~/server/utils/catalog-write'

const DEFAULT_LIMIT = 4
const MAX_LIMIT = 12

type WordSelect = {
  id: true
  word: true
  type: true
  pronunciation: true
  meaning: true
  example: true
  audioUrl: true
  level: true
  language: true
}

const wordSelect: WordSelect = {
  id: true,
  word: true,
  type: true,
  pronunciation: true,
  meaning: true,
  example: true,
  audioUrl: true,
  level: true,
  language: true,
}

function buildWordFilter(query: Record<string, unknown>) {
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const level = typeof query.level === 'string' ? query.level.trim() : ''
  const type = typeof query.type === 'string' ? query.type.trim() : ''

  const where: Record<string, unknown> = {}

  if (level) {
    where.level = { equals: level, mode: 'insensitive' }
  }

  if (type) {
    if (type === 'Phrase') {
      where.type = { in: ['Phrase', 'Interjection'] }
    } else {
      where.type = { equals: type, mode: 'insensitive' }
    }
  }

  if (search) {
    where.OR = [
      { word: { contains: search, mode: 'insensitive' } },
      { meaning: { contains: search, mode: 'insensitive' } },
      { example: { contains: search, mode: 'insensitive' } },
    ]
  }

  return Object.keys(where).length ? where : undefined
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  try {
    if (method === 'GET') {
      const query = getQuery(event)
      const lang = query.lang as string
      const pageNum = Math.max(1, Number(query.page) || 1)
      const limitNum = Math.min(
        MAX_LIMIT,
        Math.max(1, Number(query.limit) || DEFAULT_LIMIT),
      )
      const skip = (pageNum - 1) * limitNum
      const wordFilter = buildWordFilter(query as Record<string, unknown>)

      const langWhere =
        lang === 'cs' || lang === 'de' ? { language: lang } : undefined

      const topicWhere: Record<string, unknown> = {
        ...(langWhere || {}),
      }
      if (wordFilter) {
        topicWhere.words = {
          some: {
            word: wordFilter,
          },
        }
      }

      const [totalTopics, totalWords, topics] = await Promise.all([
        prisma.topic.count({ where: topicWhere as any }),
        prisma.vocabularyWord.count({
          where: {
            ...(langWhere || {}),
            ...(wordFilter || {}),
          } as any,
        }),
        prisma.topic.findMany({
          where: topicWhere as any,
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            language: true,
            description: true,
            words: {
              where: wordFilter ? { word: wordFilter } : undefined,
              select: {
                word: { select: wordSelect },
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip,
          take: limitNum,
        }),
      ])

      const mapped = topics.map((t) => ({
        ...t,
        words: t.words.map((w) => w.word).filter(Boolean),
      }))

      return {
        topics: mapped,
        meta: {
          page: pageNum,
          limit: limitNum,
          hasMore: skip + mapped.length < totalTopics,
          totalTopics,
          totalWords,
        },
      }
    }

    if (method === 'POST') {
      await requireCatalogWriter(event)
      const body = await readBody(event)
      if (!body.name || typeof body.name !== 'string') {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Invalid topic name' }),
        )
      }

      const name = body.name.trim()
      const slug =
        body.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') ||
        `topic-${Date.now()}`

      const created = await prisma.topic.upsert({
        where: { name },
        update: {
          level: body.level || undefined,
          description: body.description || undefined,
        },
        create: {
          name,
          slug,
          level: body.level || 'A1',
          description: body.description || '',
        },
      })

      return created
    }

    if (method === 'PUT') {
      await requireCatalogWriter(event)
      const query = getQuery(event)
      const id = query.id as string
      const body = await readBody(event)

      if (!id || !body.name || typeof body.name !== 'string') {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Invalid input' }),
        )
      }

      const updated = await prisma.topic.update({
        where: { id },
        data: { name: body.name },
      })

      return updated
    }

    if (method === 'DELETE') {
      await requireCatalogWriter(event)
      const query = getQuery(event)
      const id = query.id as string

      if (!id) {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Missing topic ID' }),
        )
      }

      const deleted = await prisma.topic.delete({
        where: { id },
      })

      return deleted
    }

    return sendError(
      event,
      createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }),
    )
  } catch (err: any) {
    return sendError(
      event,
      createError({ statusCode: 500, statusMessage: err.message }),
    )
  }
})
