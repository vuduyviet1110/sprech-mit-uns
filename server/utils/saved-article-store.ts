import { prisma } from '~/server/ultis/prisma'
import {
  MAX_SAVED_ARTICLES,
  sanitizeSavedArticle,
  type SavedArticleInput,
} from '~/utils/saved-article'

/** Hình dạng `Article` mà trang Tin tức đang dùng. */
export interface SavedArticleDto {
  id: string
  title: string
  date: string
  level: string
  summary: string
  content: string
  sourceUrl?: string
  sourceName?: string
  lang: 'de' | 'cs'
  isSaved: true
}

type SavedRow = {
  articleId: string
  title: string
  date: string
  level: string
  summary: string
  content: string
  sourceUrl: string | null
  sourceName: string | null
  language: string
}

export function toDto(row: SavedRow): SavedArticleDto {
  return {
    id: row.articleId,
    title: row.title,
    date: row.date,
    level: row.level,
    summary: row.summary,
    content: row.content,
    ...(row.sourceUrl ? { sourceUrl: row.sourceUrl } : {}),
    ...(row.sourceName ? { sourceName: row.sourceName } : {}),
    lang: row.language === 'cs' ? 'cs' : 'de',
    isSaved: true,
  }
}

export async function listSavedArticles(
  userId: string,
  language?: 'de' | 'cs',
): Promise<SavedArticleDto[]> {
  const rows = await prisma.userSavedArticle.findMany({
    where: { userId, ...(language ? { language } : {}) },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toDto)
}

/**
 * Cắt bớt bài cũ nhất khi vượt hạn mức. Trả về số bài đã bỏ.
 *
 * Chuyển sang Postgres mà không có hạn mức thì chỉ là dời chỗ chứa vấn đề —
 * toàn văn bài báo có thể vài chục KB mỗi bài.
 */
export async function enforceSavedArticleCap(userId: string): Promise<number> {
  const total = await prisma.userSavedArticle.count({ where: { userId } })
  if (total <= MAX_SAVED_ARTICLES) return 0

  const excess = total - MAX_SAVED_ARTICLES
  const oldest = await prisma.userSavedArticle.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: excess,
    select: { id: true },
  })
  if (oldest.length === 0) return 0

  const res = await prisma.userSavedArticle.deleteMany({
    where: { userId, id: { in: oldest.map((r) => r.id) } },
  })
  return res.count
}

export async function upsertSavedArticle(
  userId: string,
  input: SavedArticleInput,
): Promise<void> {
  const { articleId, ...rest } = input
  await prisma.userSavedArticle.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: { userId, articleId, ...rest },
    update: rest,
  })
}

/** Nạp một lần dữ liệu cũ từ localStorage. Bài đã có trên server giữ nguyên. */
export async function importSavedArticles(
  userId: string,
  raw: unknown,
): Promise<number> {
  if (!Array.isArray(raw)) return 0

  const rows = raw
    .slice(0, MAX_SAVED_ARTICLES)
    .map((item) => sanitizeSavedArticle(item))
    .filter((r): r is SavedArticleInput => r !== null)
    .map((r) => ({ userId, ...r }))

  if (rows.length === 0) return 0

  const res = await prisma.userSavedArticle.createMany({
    data: rows,
    skipDuplicates: true,
  })
  return res.count
}
