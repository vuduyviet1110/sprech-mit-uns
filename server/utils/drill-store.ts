import { prisma } from '~/server/ultis/prisma'
import {
  applyDrillFailure,
  applyDrillSuccess,
  drillDueDate,
  drillItemKey,
} from '~/utils/pronunciation-schedule'

/** Hình dạng client đang dùng (`PronunciationDrillItem`). `id` chính là `itemKey`. */
export interface DrillItemDto {
  id: string
  word: string
  phrase: string
  language: string
  tip?: string
  failCount: number
  successStreak: number
  lastFailedAt: string
  nextDueAt: string
}

export const MAX_FAIL_ITEMS_PER_CALL = 50
export const MAX_IMPORT_ITEMS = 200

const MAX_WORD = 64
const MAX_PHRASE = 200
const MAX_TIP = 200

type DrillRow = {
  itemKey: string
  word: string
  phrase: string
  language: string
  tip: string | null
  failCount: number
  successStreak: number
  lastFailedAt: Date
  nextDueAt: Date
}

export function toDto(row: DrillRow): DrillItemDto {
  return {
    id: row.itemKey,
    word: row.word,
    phrase: row.phrase,
    language: row.language,
    ...(row.tip ? { tip: row.tip } : {}),
    failCount: row.failCount,
    successStreak: row.successStreak,
    lastFailedAt: row.lastFailedAt.toISOString(),
    nextDueAt: row.nextDueAt.toISOString(),
  }
}

export interface DrillFailInput {
  word: string
  phrase: string
  tip?: string
}

/** Cắt gọn + loại mục thiếu dữ liệu. Trả mảng rỗng nếu không còn mục nào hợp lệ. */
export function sanitizeFailInputs(raw: unknown): DrillFailInput[] {
  if (!Array.isArray(raw)) return []
  const out: DrillFailInput[] = []
  for (const item of raw.slice(0, MAX_FAIL_ITEMS_PER_CALL)) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const word = typeof r.word === 'string' ? r.word.trim().slice(0, MAX_WORD) : ''
    const phrase =
      typeof r.phrase === 'string' ? r.phrase.trim().slice(0, MAX_PHRASE) : ''
    if (!word || !phrase) continue
    const tip = typeof r.tip === 'string' ? r.tip.trim().slice(0, MAX_TIP) : ''
    out.push({ word, phrase, ...(tip ? { tip } : {}) })
  }
  return out
}

export function normalizeLanguage(raw: unknown): 'de' | 'cs' {
  return String(raw || '').toLowerCase() === 'cs' ? 'cs' : 'de'
}

export async function listDrillItems(
  userId: string,
  language?: 'de' | 'cs',
): Promise<DrillItemDto[]> {
  const rows = await prisma.userPronunciationDrill.findMany({
    where: { userId, ...(language ? { language } : {}) },
    orderBy: [{ nextDueAt: 'asc' }, { failCount: 'desc' }],
  })
  return rows.map(toDto)
}

/** Ghi nhận các từ nhại lệch: đến hạn ngay, chuỗi đúng về 0. */
export async function recordDrillFailures(
  userId: string,
  language: 'de' | 'cs',
  inputs: DrillFailInput[],
): Promise<void> {
  const now = new Date()
  await prisma.$transaction(
    inputs.map((input) => {
      const itemKey = drillItemKey(language, input.word, input.phrase)
      const next = applyDrillFailure()
      return prisma.userPronunciationDrill.upsert({
        where: { userId_itemKey: { userId, itemKey } },
        create: {
          userId,
          itemKey,
          word: input.word,
          phrase: input.phrase,
          language,
          tip: input.tip ?? null,
          failCount: next.failCount,
          successStreak: 0,
          lastFailedAt: now,
          nextDueAt: now,
        },
        update: {
          // Lịch do server suy ra, client không gửi thẳng failCount lên được.
          failCount: { increment: 1 },
          successStreak: 0,
          lastFailedAt: now,
          nextDueAt: now,
          ...(input.tip ? { tip: input.tip } : {}),
        },
      })
    }),
  )
}

/** Một lần đạt: giãn theo thang 1 → 3 → 7 ngày. */
export async function recordDrillSuccess(
  userId: string,
  itemKey: string,
): Promise<boolean> {
  const row = await prisma.userPronunciationDrill.findUnique({
    where: { userId_itemKey: { userId, itemKey } },
  })
  if (!row) return false

  const next = applyDrillSuccess({
    failCount: row.failCount,
    successStreak: row.successStreak,
  })

  await prisma.userPronunciationDrill.update({
    where: { userId_itemKey: { userId, itemKey } },
    data: {
      failCount: next.failCount,
      successStreak: next.successStreak,
      nextDueAt: drillDueDate(next.intervalDays),
    },
  })
  return true
}

/**
 * Nạp một lần dữ liệu cũ từ localStorage. Dòng đã có trên server luôn thắng —
 * không hồi sinh mục đã được xếp lịch lại ở thiết bị khác.
 */
export async function importDrillItems(
  userId: string,
  items: unknown,
): Promise<number> {
  if (!Array.isArray(items)) return 0

  const rows = items
    .slice(0, MAX_IMPORT_ITEMS)
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const r = item as Record<string, unknown>
      const word = typeof r.word === 'string' ? r.word.trim().slice(0, MAX_WORD) : ''
      const phrase =
        typeof r.phrase === 'string' ? r.phrase.trim().slice(0, MAX_PHRASE) : ''
      if (!word || !phrase) return null

      const language = normalizeLanguage(r.language)
      const tip = typeof r.tip === 'string' ? r.tip.trim().slice(0, MAX_TIP) : ''
      const failCount = Math.min(
        Math.max(Math.floor(Number(r.failCount) || 1), 1),
        999,
      )
      const parseDate = (v: unknown, fallback: Date) => {
        const d = new Date(String(v || ''))
        return Number.isNaN(d.getTime()) ? fallback : d
      }
      const now = new Date()

      return {
        userId,
        itemKey: drillItemKey(language, word, phrase),
        word,
        phrase,
        language,
        tip: tip || null,
        failCount,
        // Dữ liệu cũ không có successStreak; coi như chưa đúng lần nào.
        successStreak: 0,
        lastFailedAt: parseDate(r.lastFailedAt, now),
        nextDueAt: parseDate(r.nextDueAt, now),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) return 0

  const res = await prisma.userPronunciationDrill.createMany({
    data: rows,
    skipDuplicates: true,
  })
  return res.count
}
