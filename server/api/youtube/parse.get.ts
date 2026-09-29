import { defineEventHandler, getQuery, createError } from 'h3'
import { YoutubeTranscript } from 'youtube-transcript'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import {
  buildHint,
  segmentCues,
  toRawCues,
} from '~/server/utils/transcript-segment'
import { extractYoutubeId } from '~/utils/youtube-url'

const DEFAULT_LIMIT = 60
const MAX_LIMIT = 200

export default defineEventHandler(async (event) => {
  try {
    await requireUserId(event)
    assertRateLimit(`youtube:parse:${clientIp(event)}`, 30, 60 * 60 * 1000)

    const query = getQuery(event)
    const rawUrl = String(query.url || query.youtubeId || '').trim()

    if (!rawUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vui lòng cung cấp liên kết video YouTube!',
      })
    }

    // Không có video mặc định: link sai phải báo lỗi, không được âm thầm
    // chuyển người học sang một video khác.
    const youtubeId = extractYoutubeId(rawUrl)
    if (!youtubeId) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Liên kết YouTube không hợp lệ! Hãy dán link dạng youtube.com/watch?v=... hoặc youtu.be/...',
      })
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

    // Cửa sổ trượt: video dài hơn `limit` câu phải tải tiếp được, nếu không
    // người học kẹt ở câu 60 của 194 mà không có đường đi tiếp.
    const offset = Math.min(
      Math.max(Number(query.offset) || 0, 0),
      Math.max(segments.length - 1, 0),
    )

    const clips = segments.slice(offset, offset + limit).map((s) => ({
      // `id` là chỉ số segment toàn cục + 1, không phụ thuộc cửa sổ đang tải —
      // nhờ vậy chỉ số mảng phía client luôn trùng khoá trong `clipStates`.
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
    }))

    return {
      success: true,
      youtubeId,
      // Ngôn ngữ phụ đề thực sự dùng được (có thể khác ngôn ngữ đang chọn).
      language: resolvedLang,
      requestedLanguage: targetLang,
      // Client cần biết để cảnh báo: không có video nào sai, nhưng phụ đề không
      // đúng ngôn ngữ đang học thì người dùng phải được nói rõ.
      languageFallback: resolvedLang !== targetLang,
      offset,
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
