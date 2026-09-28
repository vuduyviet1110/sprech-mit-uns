import { prisma } from '~/server/ultis/prisma'

export interface ShadowingLine {
  id: string
  text: string
  meaning?: string | null
  language: string
  level: string
  source: 'example' | 'paragraph'
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.split(/\s+/).length >= 2 && s.split(/\s+/).length <= 18)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const level = ((query.level as string) || 'A1').toUpperCase()
  const lang = ((query.lang as string) || 'de').toLowerCase()
  const limit = Math.min(Number(query.limit) || 12, 24)

  const lines: ShadowingLine[] = []

  const words = await prisma.vocabularyWord.findMany({
    where: {
      language: lang,
      example: { not: null },
      OR: [{ level }, { level: { startsWith: level.charAt(0) } }, { level: null }],
    },
    take: 80,
    orderBy: { createdAt: 'desc' },
  })

  for (const w of words) {
    const example = w.example?.trim()
    if (!example) continue
    const short =
      example.length > 120
        ? null
        : example.replace(/[„“"«»]/g, '').trim()
    if (!short || short.split(/\s+/).length < 2) continue
    lines.push({
      id: `ex-${w.id}`,
      text: short,
      meaning: w.meaning,
      language: w.language || lang,
      level: w.level || level,
      source: 'example',
    })
    if (lines.length >= limit) break
  }

  if (lines.length < limit) {
    const topics = await prisma.topic.findMany({
      where: {
        language: lang,
        paragraph: { not: null },
        OR: [{ level }, { level: { startsWith: level.charAt(0) } }],
      },
      take: 10,
    })

    for (const t of topics) {
      if (!t.paragraph) continue
      for (const sentence of splitSentences(t.paragraph)) {
        lines.push({
          id: `pg-${t.id}-${lines.length}`,
          text: sentence,
          meaning: t.englishTranslation || null,
          language: t.language || lang,
          level: t.level || level,
          source: 'paragraph',
        })
        if (lines.length >= limit) break
      }
      if (lines.length >= limit) break
    }
  }

  // Deduplicate by normalized text
  const seen = new Set<string>()
  const unique = lines.filter((l) => {
    const key = l.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    level,
    lang,
    lines: unique.slice(0, limit),
  }
})
