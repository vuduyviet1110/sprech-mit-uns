/**
 * Chia phụ đề YouTube thành các đoạn ngắn để chép chính tả.
 *
 * Phụ đề tự động (ASR) của YouTube không có dấu câu, nên không thể tách đoạn
 * chỉ bằng `[.!?]`. Thuật toán ở đây dùng ràng buộc kép: thời lượng 2–8s VÀ
 * 5–15 từ, cộng với khoảng lặng giữa các cue và dấu câu khi có.
 */

export interface RawCue {
  /** Giây */
  start: number
  /** Giây */
  duration: number
  text: string
}

export interface SegmentOptions {
  minDuration?: number
  maxDuration?: number
  minWords?: number
  maxWords?: number
  gapThreshold?: number
  padStart?: number
  padEnd?: number
}

export interface Segment {
  index: number
  start: number
  end: number
  duration: number
  text: string
  wordCount: number
}

interface ResolvedOptions extends Required<SegmentOptions> {}

const DEFAULTS: ResolvedOptions = {
  minDuration: 2,
  maxDuration: 8,
  minWords: 5,
  maxWords: 15,
  gapThreshold: 0.8,
  padStart: 0.25,
  padEnd: 0.35,
}

/** Giải HTML entity và chuẩn hoá khoảng trắng trong một dòng phụ đề. */
export function normalizeCueText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Chuyển output của `youtube-transcript` (offset/duration tính bằng ms) sang giây. */
export function toRawCues(
  items: Array<{ text: string; offset: number; duration?: number }>,
): RawCue[] {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    start: (Number(item.offset) || 0) / 1000,
    duration: (Number(item.duration) || 2000) / 1000,
    text: normalizeCueText(item.text),
  }))
}

interface WorkingCue {
  start: number
  end: number
  text: string
}

interface Buffer {
  start: number
  end: number
  words: string[]
}

const SENTENCE_END = /[.!?…]["»”')\]]?$/

/**
 * Băm một cue quá dài (thường là cue ASR gộp nhiều câu) thành nhiều đoạn,
 * phân bổ thời gian tỉ lệ theo số từ.
 */
function flushRunOnCue(cue: WorkingCue, o: ResolvedOptions): Buffer[] {
  const words = cue.text.split(/\s+/).filter(Boolean)
  const total = words.length
  const chunks = Math.max(1, Math.ceil(total / o.maxWords))
  const per = Math.ceil(total / chunks)
  const cueDuration = Math.max(cue.end - cue.start, 0.5)

  const out: Buffer[] = []
  let cursor = cue.start
  for (let i = 0; i < total; i += per) {
    const slice = words.slice(i, i + per)
    const share = (cueDuration * slice.length) / total
    out.push({ start: cursor, end: cursor + share, words: slice })
    cursor += share
  }
  return out
}

/**
 * Gộp các cue phụ đề thành đoạn chép chính tả.
 *
 * Cắt khi: đạt cap cứng (maxWords / maxDuration), hết stream, hoặc gặp dấu câu
 * / khoảng lặng >= gapThreshold *khi đã đạt cả hai ngưỡng min*.
 */
export function segmentCues(
  cues: RawCue[],
  opts: SegmentOptions = {},
): Segment[] {
  const o: ResolvedOptions = { ...DEFAULTS, ...opts }

  const cs: WorkingCue[] = (Array.isArray(cues) ? cues : [])
    .map((c) => ({
      start: Number(c.start) || 0,
      end: (Number(c.start) || 0) + (Number(c.duration) || 2),
      text: normalizeCueText(c.text),
    }))
    .filter((c) => c.text.length > 0)

  if (cs.length === 0) return []

  // Phụ đề "rolling" của YouTube khai báo duration chồng lên cue sau (cue 0 kéo
  // 8s nhưng cue 1 đã bắt đầu ở giây 4). Nếu không cắt, mọi phép tính thời lượng
  // sẽ phồng lên gấp đôi. Cắt end về mốc bắt đầu của cue kế tiếp.
  for (let i = 0; i < cs.length - 1; i++) {
    const cur = cs[i]!
    const next = cs[i + 1]!
    if (next.start > cur.start && cur.end > next.start) {
      cur.end = next.start
    }
  }

  const segments: Buffer[] = []
  let buf: Buffer = { start: -1, end: 0, words: [] }
  const reset = (): Buffer => ({ start: -1, end: 0, words: [] })

  for (let i = 0; i < cs.length; i++) {
    const cue = cs[i]!
    const next = cs[i + 1]
    const cueWords = cue.text.split(/\s+/).filter(Boolean)
    if (cueWords.length === 0) continue

    // Thêm cue này sẽ vượt cap: chốt buffer hiện tại trước, rồi mở buffer mới.
    // Nếu không, một cue nhiều từ có thể đẩy đoạn lên quá maxWords/maxDuration.
    if (buf.words.length > 0) {
      const wouldExceedWords = buf.words.length + cueWords.length > o.maxWords
      const wouldExceedDuration = cue.end - buf.start > o.maxDuration
      if (wouldExceedWords || wouldExceedDuration) {
        segments.push({ start: buf.start, end: buf.end, words: buf.words })
        buf = reset()
      }
    }

    // Cue đơn lẻ dài hơn maxWords: băm nội bộ thay vì để thành một đoạn khổng lồ.
    if (buf.words.length === 0 && cueWords.length > o.maxWords) {
      segments.push(...flushRunOnCue(cue, o))
      buf = reset()
      continue
    }

    if (buf.words.length === 0) buf.start = cue.start
    buf.words.push(...cueWords)
    buf.end = cue.end

    const duration = buf.end - buf.start
    const n = buf.words.length
    const lastWord = buf.words[n - 1] || ''
    const endsSentence = SENTENCE_END.test(lastWord)
    const gapAhead = next ? next.start - cue.end >= o.gapThreshold : true
    const isLast = next === undefined
    const meetsMins = duration >= o.minDuration && n >= o.minWords

    const shouldSplit =
      n >= o.maxWords ||
      duration >= o.maxDuration ||
      isLast ||
      ((endsSentence || gapAhead) && meetsMins)

    if (shouldSplit) {
      segments.push({ start: buf.start, end: buf.end, words: buf.words })
      buf = reset()
    }
  }

  // Đoạn cuối quá ngắn theo cả hai ngưỡng thì gộp về đoạn trước.
  if (segments.length >= 2) {
    const last = segments[segments.length - 1]!
    if (
      last.end - last.start < o.minDuration &&
      last.words.length < o.minWords
    ) {
      const prev = segments[segments.length - 2]!
      prev.end = last.end
      prev.words.push(...last.words)
      segments.pop()
    }
  }

  // Padding áp dụng sau khi gộp để không cộng dồn.
  return segments.map((s, index) => {
    const start = Math.max(0, s.start - o.padStart)
    const end = s.end + o.padEnd
    return {
      index,
      start: round3(start),
      end: round3(end),
      duration: round3(end - start),
      text: s.words.join(' '),
      wordCount: s.words.length,
    }
  })
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** Che các chữ giữa của mỗi từ: "Morgen" -> "M____n". */
export function buildHint(text: string): string {
  return (text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w.length <= 2 ? w : w[0] + '_'.repeat(w.length - 2) + w[w.length - 1],
    )
    .join(' ')
}

/** Chọn vài từ dài làm từ vựng gợi ý (heuristic đơn giản, không tra từ điển). */
export function pickVocabularies(
  text: string,
): Array<{ word: string; type: string; meaning: string }> {
  const words = (text || '').split(/\s+/).filter(Boolean)
  const keyWords = Array.from(
    new Set(
      words
        .filter((w) => w.length >= 4)
        .map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'„“]/g, ''))
        .filter((w) => w.length >= 4),
    ),
  ).slice(0, 3)

  return keyWords.map((word) => ({
    word,
    type: word[0] === word[0]!.toUpperCase() ? 'Noun / Word' : 'Verb / Word',
    meaning: 'Từ vựng trong đoạn thoại',
  }))
}
