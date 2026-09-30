/**
 * Việc cáo đề nghị làm tiếp.
 *
 * Cáo vốn chỉ nói rồi thôi: người học đọc "còn 12 thẻ tới hạn" xong vẫn phải tự
 * tìm đường sang `/review`. Ở đây chọn đúng MỘT việc đáng làm nhất theo trạng
 * thái hiện tại, kèm nút bấm thẳng tới đó.
 *
 * Tách khỏi composable vì đây là phần dễ sai nhất (thứ tự ưu tiên, ngưỡng, tránh
 * mời đúng việc đang làm) và là thứ người dùng bấm thật.
 */

import type { MascotReaction } from '~/utils/mascot-tips'

export interface MascotActionState {
  /** Số thẻ SRS đang tới hạn. */
  dueCount: number
  /** Đường dẫn trang hiện tại. */
  path: string
  /** Số khối Today đã xong. */
  blocksDone: number
  /** Tổng số khối Today. */
  blocksTotal: number
  /** Số câu sai liên tiếp vừa rồi. */
  wrongStreak: number
  /** Khối Today kế tiếp chưa làm, `null` nếu xong hết. */
  nextBlock: { title: string; to: string } | null
}

export interface MascotAction {
  line: string
  label: string
  to: string
  reaction: MascotReaction
}

/** Dưới ngưỡng này thì kho ôn chưa đáng để cắt ngang việc đang làm. */
export const DUE_NUDGE_MIN = 5
/** Sai liên tiếp tới mức này thì đề nghị chậm lại. */
export const WRONG_STREAK_LIMIT = 3

/** Đang ở ngay trang đó rồi thì đừng mời sang. */
function alreadyThere(path: string, to: string): boolean {
  const here = String(path || '')
  return here === to || here.startsWith(`${to}/`)
}

/**
 * Chọn việc đáng đề nghị nhất, hoặc `null` khi không có gì đáng cắt ngang.
 *
 * Thứ tự ưu tiên: đang vấp (cần dừng) → kho ôn dồn → khối Today còn dở. Việc
 * "đang vấp" đứng trước vì nó nói về ngay phút này; hai cái sau là kế hoạch.
 */
export function pickAction(state: MascotActionState): MascotAction | null {
  const dueCount = Math.max(0, Math.floor(Number(state?.dueCount) || 0))
  const wrongStreak = Math.max(0, Math.floor(Number(state?.wrongStreak) || 0))
  const path = String(state?.path || '')

  // Vấp liên tiếp: mời xem lại từ đang sai thay vì cắm đầu làm tiếp.
  if (wrongStreak >= WRONG_STREAK_LIMIT && !alreadyThere(path, '/dictionary')) {
    return {
      line: `Sai ${wrongStreak} câu liền rồi — xem lại mặt chữ một lượt nhé.`,
      label: 'Mở sổ từ',
      to: '/dictionary',
      reaction: 'surprised',
    }
  }

  // Kho ôn dồn: chỉ nhắc khi đủ nhiều để bõ công, và khi chưa ngồi trong đó.
  if (dueCount >= DUE_NUDGE_MIN && !alreadyThere(path, '/review')) {
    return {
      line: `${dueCount} thẻ tới hạn rồi. Làm 5 thẻ thôi cũng được.`,
      label: 'Ôn ngay',
      to: '/review',
      reaction: 'sparkle',
    }
  }

  // Khối Today còn dở: chỉ mời khi đã bắt tay vào ít nhất một khối, để người
  // vừa mở app không bị đẩy đi ngay khi chưa kịp nhìn.
  const next = state?.nextBlock
  if (next?.to && state.blocksDone > 0 && state.blocksDone < state.blocksTotal) {
    if (!alreadyThere(path, next.to)) {
      return {
        line: `Xong ${state.blocksDone}/${state.blocksTotal} khối. Tiếp "${next.title}" chứ?`,
        label: 'Làm tiếp',
        to: next.to,
        reaction: 'delighted',
      }
    }
  }

  return null
}
