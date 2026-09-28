import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/ultis/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const lang = (query.lang as string) || 'de'
    const limit = parseInt((query.limit as string) || '6', 10)

    // Fetch random vocabulary words
    const words = await prisma.vocabularyWord.findMany({
      where: {
        language: lang,
      },
      take: 40,
    })

    // Shuffle and pick `limit` words
    const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, limit)

    // Create cards array (each word creates 2 cards: 1 term card, 1 meaning card)
    const cards: any[] = []
    shuffledWords.forEach((item, idx) => {
      const pairId = `pair-${idx}-${item.id}`

      // Term card
      cards.push({
        id: `card-${idx}-term`,
        pairId,
        wordId: item.id,
        content: item.word,
        type: 'term',
        language: item.language,
        pronunciation: item.transcription || item.pronunciation || '',
      })

      // Meaning card
      cards.push({
        id: `card-${idx}-meaning`,
        pairId,
        wordId: item.id,
        content: item.meaning,
        type: 'meaning',
        language: item.language,
        example: item.example || '',
      })
    })

    // Shuffle cards so terms and meanings are randomly placed
    const shuffledCards = cards.sort(() => 0.5 - Math.random())

    return {
      success: true,
      totalPairs: shuffledWords.length,
      cards: shuffledCards,
    }
  } catch (error) {
    console.error('Error fetching memory match cards:', error)
    return {
      success: false,
      totalPairs: 0,
      cards: [],
    }
  }
})
