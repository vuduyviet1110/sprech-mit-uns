import { defineEventHandler, getQuery, createError } from 'h3'
import { YoutubeTranscript } from 'youtube-transcript'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import {
  buildHint,
  pickVocabularies,
  segmentCues,
  toRawCues,
} from '~/server/utils/transcript-segment'

const DEFAULT_LIMIT = 60
const MAX_LIMIT = 200

export default defineEventHandler(async (event) => {
  try {
    await requireUserId(event)
    assertRateLimit(`youtube:parse:${clientIp(event)}`, 30, 60 * 60 * 1000)

    const query = getQuery(event)
    const rawUrl =
      (query.url as string) ||
      (query.youtubeId as string) ||
      'https://www.youtube.com/watch?v=3iV2WK1-IV8'

    let youtubeId = '3iV2WK1-IV8'
    const match = rawUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    )
    if (match && match[1]) {
      youtubeId = match[1]
    }

    const targetLang =
      (query.language as string) || (query.lang as string) || 'de'
    let transcripts: any[] = []

    // Chỉ nhận phụ đề của ngôn ngữ đang học. Fallback "bất kỳ ngôn ngữ nào"
    // từng nhặt về cả tiếng Ả Rập cho video tiếng Đức — vô dụng để chép chính tả
    // và khiến người học tưởng tính năng hỏng.
    const langCandidates = targetLang === 'cs' ? ['cs', 'de'] : ['de', 'cs']
    let resolvedLang = ''

    for (const lang of langCandidates) {
      try {
        transcripts = await YoutubeTranscript.fetchTranscript(youtubeId, {
          lang,
        })
        if (transcripts && transcripts.length > 0) {
          resolvedLang = lang
          break
        }
      } catch {
        transcripts = []
      }
    }

    if (!transcripts || transcripts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Video này không có phụ đề tiếng Đức hoặc tiếng Séc! Hãy chọn video có bật phụ đề (CC) ở một trong hai ngôn ngữ đó.',
      })
    }

    // Chia đoạn theo ràng buộc kép (thời lượng + số từ + khoảng lặng), hoạt động
    // cả với phụ đề tự động không có dấu câu.
    const segments = segmentCues(toRawCues(transcripts))

    if (segments.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Phụ đề của video này trống hoặc không thể chia đoạn.',
      })
    }

    const limit = Math.min(
      Math.max(Number(query.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    )

    const clips = segments.slice(0, limit).map((s) => ({
      id: s.index + 1,
      youtubeId,
      start: s.start,
      end: s.end,
      duration: s.duration,
      text: s.text,
      // Giữ `germanText` cho tương thích ngược với code/dữ liệu cũ.
      germanText: s.text,
      wordCount: s.wordCount,
      hint: buildHint(s.text),
      vocabularies: pickVocabularies(s.text),
      englishTranslation: '',
    }))

    return {
      success: true,
      youtubeId,
      // Ngôn ngữ phụ đề thực sự dùng được (có thể khác ngôn ngữ đang chọn).
      language: resolvedLang,
      totalClips: clips.length,
      totalSegments: segments.length,
      clips,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Error parsing YouTube transcript:', error)
    throw createError({
      statusCode: 500,
      statusMessage:
        error.statusMessage ||
        error.message ||
        'Không thể tải phụ đề của video này',
    })
  }
})
