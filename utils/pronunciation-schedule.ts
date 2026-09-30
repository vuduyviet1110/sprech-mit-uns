/**
 * Lịch giãn cách cho phần luyện phát âm ngắt quãng.
 *
 * Không dùng SM-2 (`server/utils/srs-sm2.ts`): thang của nó là 30–90 ngày cho trí
 * nhớ ngữ nghĩa, quá dài với trí nhớ cơ miệng, và nó cần tín hiệu chất lượng 0–5
 * trong khi ở đây chỉ có đạt/không đạt. Dùng lại sẽ phải ghi đè floor/cap/EF —
 * tức là một scheduler thứ hai khoác áo SM-2.
 *
 * Logic để ở đây (không phải trong composable) để cả client lẫn handler dùng
 * chung một bản, và để test được thật.
 */

export interface DrillScheduleState {
  /** Số lần nhại lệch tích luỹ — dùng xếp thứ tự ưu tiên ôn. */
  failCount: number
  /** Số lần đúng liên tiếp — quyết định giãn cách. */
  successStreak: number
}

/** Giãn cách sau mỗi lần đúng liên tiếp: 1 → 3 → 7 ngày rồi giữ ở 7. */
export const DRILL_INTERVALS_DAYS = [1, 3, 7] as const

/** Số ngày tới hạn kế tiếp, tính theo chuỗi lần đúng liên tiếp hiện có. */
export function nextDrillIntervalDays(successStreak: number): number {
  const i = Math.max(0, Math.floor(successStreak))
  return DRILL_INTERVALS_DAYS[Math.min(i, DRILL_INTERVALS_DAYS.length - 1)]!
}

/**
 * Áp dụng một lần đúng.
 *
 * Bản cũ giảm `failCount` rồi lấy chính nó làm chỉ số thang lịch, nên một từ sai
 * đúng một lần sẽ nhảy thẳng 7 ngày ngay lần đúng đầu tiên — ngược hẳn chú thích
 * "1 → 3 → 7 ngày". Nguyên nhân là `failCount` bị dùng cho hai việc cùng lúc.
 */
export function applyDrillSuccess(state: DrillScheduleState): DrillScheduleState & {
  intervalDays: number
} {
  const successStreak = Math.max(0, Math.floor(state.successStreak || 0))
  const intervalDays = nextDrillIntervalDays(successStreak)
  return {
    failCount: Math.max(0, Math.floor(state.failCount || 0) - 1),
    successStreak: successStreak + 1,
    intervalDays,
  }
}

/** Áp dụng một lần sai: đến hạn ngay, chuỗi đúng về 0. */
export function applyDrillFailure(
  state?: Partial<DrillScheduleState>,
): DrillScheduleState & { intervalDays: 0 } {
  return {
    failCount: Math.max(0, Math.floor(state?.failCount || 0)) + 1,
    successStreak: 0,
    intervalDays: 0,
  }
}

/**
 * Khoá định danh một mục luyện. Giữ đúng biểu thức cũ để dữ liệu đã lưu
 * trong localStorage vẫn khớp khi đồng bộ lên server.
 */
export function drillItemKey(
  language: string,
  word: string,
  phrase: string,
): string {
  return `${language}::${(word || '').toLowerCase()}::${(phrase || '').slice(0, 40)}`
}

/** Mốc tới hạn kế tiếp, tính từ `from` (mặc định: bây giờ). */
export function drillDueDate(intervalDays: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + Math.max(0, Math.floor(intervalDays)))
  return d
}
