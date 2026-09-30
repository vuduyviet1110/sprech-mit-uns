/**
 * Câu chào bằng chính ngôn ngữ đang học.
 *
 * Cáo vốn nói tiếng Việt 100% trong một app dạy tiếng Đức/Séc — mỗi lần nó xuất
 * hiện là một lần tiếp xúc ngôn ngữ bị bỏ lỡ. Ở đây chỉ dùng những câu cực ngắn,
 * quen thuộc, luôn kèm nghĩa tiếng Việt để người mới không bị chặn.
 */

export type LearnLang = 'de' | 'cs'

export interface Phrase {
  /** Câu trong ngôn ngữ đang học. */
  text: string
  /** Nghĩa tiếng Việt, hiện ngay sau câu trên. */
  vi: string
}

/** Chào theo buổi trong ngày. */
const GREETINGS: Record<LearnLang, { morning: Phrase; afternoon: Phrase; evening: Phrase }> = {
  de: {
    morning: { text: 'Guten Morgen!', vi: 'Chào buổi sáng' },
    afternoon: { text: 'Guten Tag!', vi: 'Chào buổi trưa' },
    evening: { text: 'Guten Abend!', vi: 'Chào buổi tối' },
  },
  cs: {
    morning: { text: 'Dobré ráno!', vi: 'Chào buổi sáng' },
    afternoon: { text: 'Dobrý den!', vi: 'Chào buổi trưa' },
    evening: { text: 'Dobrý večer!', vi: 'Chào buổi tối' },
  },
}

/**
 * Khen khi làm đúng — đổi qua lại để không nhàm.
 *
 * Trước chỉ có 3 câu mỗi thứ tiếng, nên một buổi ôn 20 thẻ là nghe lại "Super!"
 * bảy lần. Mở rộng lên 12 câu: vẫn toàn từ A1–A2, mỗi câu là một lần tiếp xúc
 * thật chứ không phải tiếng động cổ vũ.
 */
const PRAISE: Record<LearnLang, Phrase[]> = {
  de: [
    { text: 'Super!', vi: 'Tuyệt' },
    { text: 'Genau!', vi: 'Chính xác' },
    { text: 'Weiter so!', vi: 'Cứ thế nhé' },
    { text: 'Richtig!', vi: 'Đúng rồi' },
    { text: 'Sehr gut!', vi: 'Rất tốt' },
    { text: 'Prima!', vi: 'Hay lắm' },
    { text: 'Stimmt!', vi: 'Chuẩn' },
    { text: 'Klasse!', vi: 'Cừ thật' },
    { text: 'Gut gemacht!', vi: 'Làm tốt lắm' },
    { text: 'Perfekt!', vi: 'Hoàn hảo' },
    { text: 'Bravo!', vi: 'Giỏi quá' },
    { text: 'Toll!', vi: 'Tuyệt vời' },
  ],
  cs: [
    { text: 'Výborně!', vi: 'Xuất sắc' },
    { text: 'Přesně tak!', vi: 'Chính xác' },
    { text: 'Jen tak dál!', vi: 'Cứ thế nhé' },
    { text: 'Správně!', vi: 'Đúng rồi' },
    { text: 'Velmi dobře!', vi: 'Rất tốt' },
    { text: 'Skvělé!', vi: 'Hay lắm' },
    { text: 'Souhlasí!', vi: 'Chuẩn' },
    { text: 'Paráda!', vi: 'Cừ thật' },
    { text: 'Dobrá práce!', vi: 'Làm tốt lắm' },
    { text: 'Perfektní!', vi: 'Hoàn hảo' },
    { text: 'Bravo!', vi: 'Giỏi quá' },
    { text: 'Úžasné!', vi: 'Tuyệt vời' },
  ],
}

/**
 * Câu cho lúc sai. Không câu nào mang nghĩa trách — sai là bước bình thường của
 * việc học, và người đang nản cần nghe "thử lại" chứ không phải "bạn sai rồi".
 */
const ENCOURAGE: Record<LearnLang, Phrase[]> = {
  de: [
    { text: 'Fast!', vi: 'Gần đúng rồi' },
    { text: 'Kein Problem!', vi: 'Không sao đâu' },
    { text: 'Noch einmal!', vi: 'Thử lại nào' },
    { text: 'Nicht aufgeben!', vi: 'Đừng bỏ cuộc' },
    { text: 'Weiter geht’s!', vi: 'Đi tiếp thôi' },
    { text: 'Das kommt noch!', vi: 'Rồi sẽ thuộc thôi' },
  ],
  cs: [
    { text: 'Skoro!', vi: 'Gần đúng rồi' },
    { text: 'Nevadí!', vi: 'Không sao đâu' },
    { text: 'Ještě jednou!', vi: 'Thử lại nào' },
    { text: 'Nevzdávej to!', vi: 'Đừng bỏ cuộc' },
    { text: 'Jdeme dál!', vi: 'Đi tiếp thôi' },
    { text: 'Ono to přijde!', vi: 'Rồi sẽ thuộc thôi' },
  ],
}

/** Câu cho lúc xong một lượt / một khối. */
const DONE: Record<LearnLang, Phrase[]> = {
  de: [
    { text: 'Geschafft!', vi: 'Xong rồi' },
    { text: 'Fertig!', vi: 'Hoàn thành' },
    { text: 'Gut gearbeitet!', vi: 'Học chăm lắm' },
  ],
  cs: [
    { text: 'Hotovo!', vi: 'Xong rồi' },
    { text: 'Dokončeno!', vi: 'Hoàn thành' },
    { text: 'Dobrá práce!', vi: 'Học chăm lắm' },
  ],
}

/**
 * Các kho câu, phơi ra để test kiểm được nội dung thật (trùng lặp, thiếu nghĩa)
 * thay vì phải đoán độ dài kho qua việc gọi hàm nhiều lần.
 */
export const PHRASE_POOLS = { praise: PRAISE, encourage: ENCOURAGE, done: DONE } as const

export function normalizeLang(raw: unknown): LearnLang {
  return String(raw || '').toLowerCase() === 'cs' ? 'cs' : 'de'
}

/** `morning` < 11h, `afternoon` < 18h, còn lại `evening`. */
export function partOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  const h = Number.isFinite(hour) ? Math.max(0, Math.min(23, Math.floor(hour))) : 9
  if (h < 11) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export function greetingPhrase(lang: unknown, hour: number): Phrase {
  return GREETINGS[normalizeLang(lang)][partOfDay(hour)]
}

/** Lấy phần tử thứ `index` theo vòng, an toàn với đầu vào rác. */
function atIndex(pool: Phrase[], index: number): Phrase {
  const i = Number.isFinite(index) ? Math.abs(Math.floor(index)) : 0
  return pool[i % pool.length]!
}

export function praisePhrase(lang: unknown, index: number): Phrase {
  return atIndex(PRAISE[normalizeLang(lang)], index)
}

export function encouragePhrase(lang: unknown, index: number): Phrase {
  return atIndex(ENCOURAGE[normalizeLang(lang)], index)
}

export function donePhrase(lang: unknown, index: number): Phrase {
  return atIndex(DONE[normalizeLang(lang)], index)
}

/** Ghép thành một dòng: `Guten Morgen! (chào buổi sáng) — …` */
export function withGloss(phrase: Phrase, tail = ''): string {
  const head = `${phrase.text} (${phrase.vi})`
  return tail ? `${head} — ${tail}` : head
}
