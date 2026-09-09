export interface SM2Input {
  quality: number // Mức độ trả lời từ 0 đến 5 (0: Không nhớ, 3: Nhớ vừa, 5: Nhớ rất rõ)
  repetitions: number
  interval: number
  easinessFactor: number
}

export interface SM2Output {
  repetitions: number
  interval: number // Tính theo ngày
  easinessFactor: number
  nextReviewAt: Date
  isMastered: boolean
}

/**
 * Thuật toán SM-2 (SuperMemo-2) tính toán khoảng thời gian ôn tập tối ưu
 */
export function calculateSM2(input: SM2Input): SM2Output {
  let { quality, repetitions, interval, easinessFactor } = input

  // Ép giá trị quality trong khoảng 0 - 5
  quality = Math.max(0, Math.min(5, quality))

  if (quality >= 3) {
    // Trả lời đúng (Quality >= 3)
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetitions += 1
  } else {
    // Trả lời sai -> Reset chuỗi lặp về ban đầu
    repetitions = 0
    interval = 1
  }

  // Cập nhật hệ số Easiness Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // Giới hạn EF tối thiểu là 1.3
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }

  // Ngày ôn tập tiếp theo
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)

  // Coi như Mastered nếu repetitions >= 4 và interval >= 21 ngày
  const isMastered = repetitions >= 4 && interval >= 21

  return {
    repetitions,
    interval,
    easinessFactor: Number(easinessFactor.toFixed(2)),
    nextReviewAt,
    isMastered,
  }
}
