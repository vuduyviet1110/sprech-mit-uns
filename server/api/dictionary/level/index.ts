import { prisma } from '~/server/ultis/prisma'
import { getQuery } from 'h3'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

/** Word counts per CEFR level for the dictionary bookshelf. */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const language = query.language === 'cs' ? 'cs' : 'de'

  const [total, rows] = await Promise.all([
    prisma.vocabularyWord.count({ where: { language } }),
    prisma.vocabularyWord.groupBy({
      by: ['level'],
      where: { language },
      _count: { _all: true },
    }),
  ])

  const levels: Record<string, number> = {}
  for (const level of LEVELS) levels[level] = 0
  for (const row of rows) {
    if (!row.level || !(row.level in levels)) continue
    levels[row.level] = row._count._all
  }

  return { language, total, levels }
})
