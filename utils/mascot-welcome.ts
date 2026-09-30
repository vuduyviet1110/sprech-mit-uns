/**
 * Lời chào khi người học quay lại, dựa trên khoảng vắng và việc đang tồn đọng.
 *
 * Tách khỏi composable để test được thật: đây là phần dễ sai nhất (múi giờ,
 * ranh giới ngày, số nhiều) và cũng là phần người dùng đọc trực tiếp.
 */

export interface WelcomeInput {
  /** `YYYY-MM-DD` của ngày học gần nhất. `null` = chưa học buổi nào. */
  lastStudyDate: string | null
  /** Chuỗi ngày học liên tiếp hiện tại. */
  streak: number
  /** Số thẻ SRS đang tới hạn. */
  dueCount: number
  /** Hôm nay, dạng `YYYY-MM-DD`. */
  today: string
}

export interface WelcomeLine {
  line: string
  reaction: 'heart' | 'sparkle' | 'sleepy' | 'bashful' | 'wink'
}

/** Số ngày giữa hai mốc `YYYY-MM-DD`. Trả `null` nếu đầu vào không hợp lệ. */
export function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((b - a) / 86_400_000)
}

const dueTail = (n: number) =>
  n > 0 ? ` Kho ôn còn ${n} thẻ đợi bạn.` : ''

/**
 * Trả về lời chào phù hợp, hoặc `null` khi không có gì đáng nói (đã học hôm
 * nay rồi — lúc đó cáo nên im để nhường chỗ cho lời chào theo trang).
 */
export function buildWelcome(input: WelcomeInput): WelcomeLine | null {
  const { lastStudyDate, streak, dueCount, today } = input

  if (!lastStudyDate) {
    return {
      line: 'Lần đầu gặp bạn! Bắt đầu từ khối đầu tiên nhé.',
      reaction: 'bashful',
    }
  }

  const gap = daysBetween(lastStudyDate, today)
  if (gap === null || gap < 0) return null

  // Đã học hôm nay: không chào lại, tránh nói chồng lời chào theo trang.
  if (gap === 0) return null

  if (gap === 1) {
    return streak >= 2
      ? {
          line: `Chuỗi ${streak} ngày đang đẹp — giữ tiếp hôm nay nhé.${dueTail(dueCount)}`,
          reaction: 'sparkle',
        }
      : { line: `Chào bạn trở lại!${dueTail(dueCount)}`, reaction: 'heart' }
  }

  if (gap <= 3) {
    return {
      line: `Vắng ${gap} ngày rồi.${dueTail(dueCount) || ' Làm một khối ngắn cho ấm tay nhé.'}`,
      reaction: 'wink',
    }
  }

  if (gap <= 14) {
    return {
      line: `Lâu không gặp — ${gap} ngày rồi đấy.${dueTail(dueCount) || ' Bắt đầu lại nhẹ nhàng thôi.'}`,
      reaction: 'sleepy',
    }
  }

  return {
    line: 'Lâu lắm rồi! Mình vẫn giữ tiến độ cũ cho bạn.',
    reaction: 'heart',
  }
}
