import { defineEventHandler, getQuery, createError } from 'h3'
import { YoutubeTranscript } from 'youtube-transcript'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawUrl = (query.url as string) || (query.youtubeId as string) || 'https://www.youtube.com/watch?v=4-eDoThe6qo'

    let youtubeId = '4-eDoThe6qo'
    const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    if (match && match[1]) {
      youtubeId = match[1]
    }

    const targetLang = (query.language as string) || (query.lang as string) || 'de'
    let transcripts: any[] = []

    // Thử lấy phụ đề theo đúng ngôn ngữ đang chọn (de hoặc cs) trước, sau đó mới fallback
    try {
      transcripts = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: targetLang })
    } catch {
      const fallbackLang = targetLang === 'cs' ? 'de' : 'cs'
      try {
        transcripts = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: fallbackLang })
      } catch {
        try {
          transcripts = await YoutubeTranscript.fetchTranscript(youtubeId)
        } catch {
          transcripts = []
        }
      }
    }

    if (!transcripts || transcripts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Không thể tải phụ đề của video này! Đảm bảo video có bật phụ đề/phụ đề tự động (CC).'
      })
    }

    // Clean natural cue aggregator: Use exact original YouTube CC cue start & end timestamps
    const rawClips: any[] = []
    let currentText = ''
    let currentStart = -1
    let currentEnd = 0

    for (let i = 0; i < transcripts.length; i++) {
      const item = transcripts[i]
      const rawText = item.text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim()
      if (!rawText) continue

      const itemStart = item.offset / 1000
      const itemDuration = (item.duration || 2000) / 1000
      const itemEnd = itemStart + itemDuration

      if (currentStart < 0) {
        currentStart = itemStart
      }
      currentEnd = itemEnd
      currentText = currentText ? `${currentText} ${rawText}` : rawText

      const trimmedText = currentText.trim()
      // Tách câu CHỈ KHI gặp dấu ngắt câu (. ! ?) ở cuối câu hoặc ở dòng phụ đề cuối cùng
      const hasSentencePunctuation = /[.!?]$/.test(trimmedText)

      if (hasSentencePunctuation || i === transcripts.length - 1) {
        const words: string[] = trimmedText.split(/\s+/)
        const hint = words.map((w: string) => {
          if (w.length <= 2) return w
          return w[0] + '_'.repeat(w.length - 2) + w[w.length - 1]
        }).join(' ')

        const keyWords: string[] = Array.from(new Set(words.filter((w: string) => w.length >= 4).map((w: string) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')))).slice(0, 3)
        const vocabularies = keyWords.map((kw: string) => ({
          word: kw,
          type: kw[0] === kw[0].toUpperCase() ? 'Noun / Word' : 'Verb / Word',
          meaning: `Từ vựng trong đoạn thoại`,
        }))

        const duration = Math.max(currentEnd - currentStart, 1.5)

        rawClips.push({
          id: rawClips.length + 1,
          youtubeId,
          start: currentStart,
          end: currentEnd,
          duration,
          germanText: trimmedText,
          hint,
          vocabularies,
          englishTranslation: ''
        })

        currentText = ''
        currentStart = -1
      }
    }

    const clips = rawClips.slice(0, 20)

    return {
      success: true,
      youtubeId,
      totalClips: clips.length,
      clips
    }
  } catch (error: any) {
    console.error('Error parsing YouTube transcript:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Không thể tải phụ đề của video này'
    })
  }
})
