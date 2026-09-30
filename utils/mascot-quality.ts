/**
 * Chất lượng một câu trả lời đúng.
 *
 * Đúng-nhanh và đúng-sau-hai-lần-sai là hai chuyện khác hẳn nhau với SRS, nhưng
 * cáo trước đây khen y như nhau. Phân loại ở đây để lời khen nói đúng thứ vừa
 * xảy ra — và để người học biết câu nào mình chưa thật sự thuộc.
 */

export type AnswerQuality = 'instant' | 'solid' | 'hesitant' | 'recovered'

export interface AnswerSample {
  /** Thời gian trả lời, mili-giây. `null`/không có = không đo được. */
  ms?: number | null
  /** Vừa sai ít nhất một lần ở chính câu này chưa. */
  afterMistake?: boolean
}

/** Dưới ngưỡng này coi như bật ra ngay, không phải lục trí nhớ. */
export const INSTANT_MS = 2500
/** Trên ngưỡng này là đã phải nghĩ lâu — dấu hiệu chưa thuộc chắc. */
export const HESITANT_MS = 8000

/**
 * Xếp loại một câu đúng.
 *
 * `recovered` đứng trước mọi mốc thời gian: đúng sau khi vừa sai là chuyện đáng
 * ghi nhận riêng, dù nhanh hay chậm.
 */
export function classifyAnswer(sample: AnswerSample | null | undefined): AnswerQuality {
  if (sample?.afterMistake) return 'recovered'

  const ms = Number(sample?.ms)
  if (!Number.isFinite(ms) || ms <= 0) return 'solid'
  if (ms < INSTANT_MS) return 'instant'
  if (ms > HESITANT_MS) return 'hesitant'
  return 'solid'
}

/**
 * Câu tiếng Việt đi kèm lời khen, theo chất lượng. `null` = không thêm gì, để
 * lời khen bằng tiếng đích đứng một mình.
 */
export function qualityTail(quality: AnswerQuality): string | null {
  switch (quality) {
    case 'instant':
      return 'Bật ra ngay luôn!'
    case 'hesitant':
      // Nói thẳng rằng thẻ sẽ quay lại: đó là cách SRS hoạt động, không phải phạt.
      return 'Đúng nhưng còn nghĩ lâu — lát nữa mình cho gặp lại.'
    case 'recovered':
      return 'Sai rồi gỡ được mới là nhớ thật.'
    default:
      return null
  }
}
