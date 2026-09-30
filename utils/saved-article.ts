/**
 * Chuẩn hoá bài báo trước khi lưu xuống DB.
 *
 * Trước đây toàn văn bài báo nằm trong localStorage, không giới hạn số lượng lẫn
 * kích thước. Chuyển sang Postgres mà không đặt hạn mức thì chỉ là dời chỗ chứa
 * vấn đề, nên cắt ngay tại tầng ghi.
 */

/** Số bài tối đa giữ cho mỗi người dùng. Vượt thì bỏ bài cũ nhất. */
export const MAX_SAVED_ARTICLES = 100
/** Độ dài tối đa của toàn văn bài báo. */
export const MAX_ARTICLE_CONTENT = 40_000

const MAX_TITLE = 300
const MAX_SUMMARY = 1000
const MAX_SOURCE_NAME = 120
const MAX_SOURCE_URL = 2000
const MAX_DATE = 40

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
export type ArticleLevel = (typeof LEVELS)[number]

export interface SavedArticleInput {
  articleId: string
  title: string
  date: string
  level: ArticleLevel
  summary: string
  content: string
  sourceUrl: string | null
  sourceName: string | null
  language: 'de' | 'cs'
}

const str = (value: unknown, max: number): string => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const optionalStr = (value: unknown, max: number): string | null => {
  const s = str(value, max)
  return s ? s : null
}

/**
 * Trả về bản đã cắt gọn, hoặc `null` nếu thiếu trường bắt buộc.
 * Field lạ bị loại — không cho client tự nhét thêm cột.
 */
export function sanitizeSavedArticle(input: unknown): SavedArticleInput | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>

  // Client gọi trường id là `id`; DB gọi là `articleId`.
  const articleId = str(raw.articleId ?? raw.id, 200)
  const title = str(raw.title, MAX_TITLE)
  const content = str(raw.content, MAX_ARTICLE_CONTENT)

  if (!articleId || !title || !content) return null

  const rawLevel = str(raw.level, 8).toUpperCase() as ArticleLevel
  const rawLang = str(raw.language ?? raw.lang, 8).toLowerCase()

  return {
    articleId,
    title,
    date: str(raw.date, MAX_DATE),
    level: LEVELS.includes(rawLevel) ? rawLevel : 'A2',
    summary: str(raw.summary, MAX_SUMMARY),
    content,
    sourceUrl: optionalStr(raw.sourceUrl, MAX_SOURCE_URL),
    sourceName: optionalStr(raw.sourceName, MAX_SOURCE_NAME),
    language: rawLang === 'cs' ? 'cs' : 'de',
  }
}
