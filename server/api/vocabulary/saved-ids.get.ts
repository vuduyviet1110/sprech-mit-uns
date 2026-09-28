import { prisma } from '~/server/ultis/prisma'
import { ensureUser, requireUserId } from '~/server/utils/user'

/** Check which dictionary wordIds are already in the user's notebook */
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  await ensureUser(userId)
  const query = getQuery(event)
  const idsRaw = typeof query.ids === 'string' ? query.ids : ''
  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!ids.length) {
    const all = await prisma.userVocabularyEntry.findMany({
      where: { userId, wordId: { not: null } },
      select: { wordId: true },
    })
    return { wordIds: all.map((e) => e.wordId).filter(Boolean) }
  }

  const entries = await prisma.userVocabularyEntry.findMany({
    where: { userId, wordId: { in: ids } },
    select: { wordId: true },
  })
  return { wordIds: entries.map((e) => e.wordId).filter(Boolean) }
})
