import { fuzzyMatch, levenshtein, normalizeForCompare } from './fuzzy-text'

export type DiffKind = 'match' | 'wrong' | 'missing' | 'extra'

export interface WordDiffToken {
  kind: DiffKind
  expected?: string
  spoken?: string
}

export interface PronunciationTip {
  id: string
  title: string
  detail: string
  focusWords: string[]
}

export interface ShadowingScoreReport {
  score: number
  level: 'exact' | 'close' | 'miss'
  similarity: number
  tokens: WordDiffToken[]
  wrongWords: string[]
  missingWords: string[]
  extraWords: string[]
  tips: PronunciationTip[]
  drillItems: { word: string; phrase: string; tip?: string }[]
}

/**
 * Ngưỡng dùng chung cho mọi màn luyện nói/chép (thang 0–100 của `buildShadowingReport`).
 *
 * Trước đây mỗi trang tự đặt số: Dictation 80, Ôn phát âm 75, Shadowing 60 — cùng
 * một điểm mà ba kết luận đạt/không khác nhau. Riêng Shadowing còn tô màu theo
 * 85/60 nhưng gắn nhãn theo 90/75/60, nên 87 điểm ra màu "xuất sắc" kèm chữ "Tốt".
 */
export const SCORE_EXCELLENT = 90
export const SCORE_GOOD = 75
export const SCORE_FAIR = 60

/** Mức đạt chung — cũng là mức gắn với hệ quả lâu dài (giãn lịch ôn phát âm). */
export const SCORE_PASS = SCORE_GOOD

export type ScoreBand = 'excellent' | 'good' | 'fair' | 'weak'

/** Bậc điểm dùng cho CẢ màu lẫn nhãn, để hai thứ không thể lệch nhau. */
export function scoreBand(score: number): ScoreBand {
  if (score >= SCORE_EXCELLENT) return 'excellent'
  if (score >= SCORE_GOOD) return 'good'
  if (score >= SCORE_FAIR) return 'fair'
  return 'weak'
}

export function isPass(score: number): boolean {
  return score >= SCORE_PASS
}

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  excellent: 'Xuất sắc',
  good: 'Tốt',
  fair: 'Khá — cần ôn vài từ',
  weak: 'Cần luyện thêm',
}

function tokenize(s: string): string[] {
  return normalizeForCompare(s)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

function wordsSimilar(a: string, b: string): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const { similarity } = fuzzyMatch(a, b)
  return similarity >= 0.75 || levenshtein(a, b) <= 1
}

/** Align spoken vs expected tokens (edit script). */
export function diffWords(spoken: string, expected: string): WordDiffToken[] {
  const A = tokenize(spoken)
  const B = tokenize(expected)
  const m = A.length
  const n = B.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = wordsSimilar(A[i - 1], B[j - 1]) ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }

  const tokens: WordDiffToken[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsSimilar(A[i - 1], B[j - 1])) {
      tokens.unshift({
        kind: A[i - 1] === B[j - 1] ? 'match' : 'wrong',
        expected: B[j - 1],
        spoken: A[i - 1],
      })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      tokens.unshift({ kind: 'wrong', expected: B[j - 1], spoken: A[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      tokens.unshift({ kind: 'missing', expected: B[j - 1] })
      j--
    } else {
      tokens.unshift({ kind: 'extra', spoken: A[i - 1] })
      i--
    }
  }
  return tokens
}

function tipForWord(word: string, lang: string): PronunciationTip | null {
  const w = word.toLowerCase()
  const isCs = lang.startsWith('cs')
  const isDe = lang.startsWith('de')

  if (isCs && /ř/.test(w)) {
    return {
      id: 'cs-r',
      title: 'Âm ř (tiếng Séc)',
      detail:
        'Đặt lưỡi như phát âm “r” rung, đồng thời thêm hơi xát như “zh”. Luyện chậm: řeka → tři → přes.',
      focusWords: [word],
    }
  }
  if (isCs && /ť|ď|ň/.test(w)) {
    return {
      id: 'cs-soft',
      title: 'Phụ âm mềm ť/ď/ň',
      detail: 'Lưỡi chạm lợi trên nhẹ hơn phụ âm cứng. Nhại từng âm rồi nối vào từ.',
      focusWords: [word],
    }
  }
  if (isCs && /(str|skr|prst|krk|čt)/.test(w) || w.length >= 5 && /[bcdfghjklmnpqrstvwxz]{3,}/.test(w)) {
    return {
      id: 'cs-cluster',
      title: 'Cụm phụ âm liên tiếp',
      detail:
        'Chia nhỏ: nói từng phụ âm rồi tăng tốc (vd. str-č → strč). Shadowing chậm → nhanh.',
      focusWords: [word],
    }
  }
  if (isDe && /ch/.test(w)) {
    return {
      id: 'de-ch',
      title: 'Âm ch (tiếng Đức)',
      detail:
        'Sau i/e/ä/ö/ü: “ich-Laut” (xát nhẹ ở vòm). Sau a/o/u/au: “ach-Laut” (họng sâu hơn).',
      focusWords: [word],
    }
  }
  if (isDe && /ö|ü|ä/.test(w)) {
    return {
      id: 'de-umlaut',
      title: 'Nguyên âm umlaut ä/ö/ü',
      detail: 'Giữ miệng như e/o/u nhưng môi tròn hơn (ö/ü). Nghe TTS từng từ rồi nhại 3 lần.',
      focusWords: [word],
    }
  }
  if (isDe && /sch|ß|tz/.test(w)) {
    return {
      id: 'de-sch',
      title: 'sch / ß / tz',
      detail: 'sch ≈ “sh”; ß ≈ “ss” dài; tz cứng hơn “ts”. Nhấn rõ cuối từ.',
      focusWords: [word],
    }
  }
  return null
}

function buildTips(
  wrong: string[],
  missing: string[],
  lang: string,
  score: number,
): PronunciationTip[] {
  const tips: PronunciationTip[] = []
  const seen = new Set<string>()

  const focus = [...wrong, ...missing]
  for (const w of focus) {
    const tip = tipForWord(w, lang)
    if (tip && !seen.has(tip.id)) {
      seen.add(tip.id)
      tips.push(tip)
    }
  }

  if (missing.length) {
    tips.push({
      id: 'missing',
      title: 'Thiếu từ trong câu',
      detail: `Bạn bỏ sót: ${missing.slice(0, 5).join(', ')}. Nghe lại → tạm dừng → nói từng chunk 2–3 từ.`,
      focusWords: missing.slice(0, 5),
    })
  }
  if (wrong.length) {
    tips.push({
      id: 'wrong',
      title: 'Từ nhận diện khác mẫu',
      detail:
        'Có thể do phát âm lệch hoặc mic. Bấm TTS từng từ sai → nhại 3 lần → nói lại cả câu.',
      focusWords: wrong.slice(0, 5),
    })
  }
  if (score < 70) {
    tips.push({
      id: 'slow',
      title: 'Luyện theo nhịp chậm',
      detail:
        'Shadowing hiệu quả: nghe → nhại ngay ở tốc độ 70% → tăng dần. Não ghi “muscle memory” tốt hơn học dồn.',
      focusWords: focus.slice(0, 3),
    })
  }
  if (!tips.length && score >= 85) {
    tips.push({
      id: 'great',
      title: 'Giữ đà này',
      detail: 'Ôn lại câu này sau 1 ngày (spaced repetition) để củng cố lâu dài.',
      focusWords: [],
    })
  }
  return tips.slice(0, 4)
}

export function buildShadowingReport(
  spoken: string,
  expected: string,
  lang: string = 'de',
): ShadowingScoreReport {
  const { level, similarity } = fuzzyMatch(spoken, expected)
  const tokens = diffWords(spoken || '', expected)
  const wrongWords = tokens
    .filter((t) => t.kind === 'wrong' && t.expected)
    .map((t) => t.expected!)
  const missingWords = tokens
    .filter((t) => t.kind === 'missing' && t.expected)
    .map((t) => t.expected!)
  const extraWords = tokens
    .filter((t) => t.kind === 'extra' && t.spoken)
    .map((t) => t.spoken!)

  // Score: blend string similarity + word accuracy
  const contentTokens = tokens.filter((t) => t.kind !== 'extra')
  const matched = tokens.filter((t) => t.kind === 'match').length
  const wordAcc =
    contentTokens.length > 0 ? matched / Math.max(tokenize(expected).length, 1) : 0
  const score = Math.round(Math.min(100, Math.max(0, (similarity * 0.55 + wordAcc * 0.45) * 100)))

  const tips = buildTips(wrongWords, missingWords, lang, score)

  const drillFocus = [...new Set([...wrongWords, ...missingWords])]
  const drillItems = drillFocus.map((word) => ({
    word,
    phrase: expected,
    tip: tipForWord(word, lang)?.detail,
  }))

  return {
    score,
    level,
    similarity,
    tokens,
    wrongWords,
    missingWords,
    extraWords,
    tips,
    drillItems,
  }
}
