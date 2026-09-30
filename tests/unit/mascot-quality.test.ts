import { describe, expect, it } from 'vitest'
import {
  HESITANT_MS,
  INSTANT_MS,
  classifyAnswer,
  qualityTail,
} from '~/utils/mascot-quality'

describe('classifyAnswer', () => {
  it('bật ra ngay', () => {
    expect(classifyAnswer({ ms: 800 })).toBe('instant')
    expect(classifyAnswer({ ms: INSTANT_MS - 1 })).toBe('instant')
  })

  it('nghĩ lâu', () => {
    expect(classifyAnswer({ ms: HESITANT_MS + 1 })).toBe('hesitant')
    expect(classifyAnswer({ ms: 30_000 })).toBe('hesitant')
  })

  it('bình thường ở khoảng giữa', () => {
    expect(classifyAnswer({ ms: INSTANT_MS })).toBe('solid')
    expect(classifyAnswer({ ms: HESITANT_MS })).toBe('solid')
    expect(classifyAnswer({ ms: 5000 })).toBe('solid')
  })

  it('gỡ được sau khi sai đứng trước mọi mốc thời gian', () => {
    expect(classifyAnswer({ ms: 300, afterMistake: true })).toBe('recovered')
    expect(classifyAnswer({ ms: 60_000, afterMistake: true })).toBe('recovered')
    expect(classifyAnswer({ afterMistake: true })).toBe('recovered')
  })

  it('không đo được thì coi như bình thường', () => {
    expect(classifyAnswer(null)).toBe('solid')
    expect(classifyAnswer(undefined)).toBe('solid')
    expect(classifyAnswer({})).toBe('solid')
    expect(classifyAnswer({ ms: 0 })).toBe('solid')
    expect(classifyAnswer({ ms: -5 })).toBe('solid')
    expect(classifyAnswer({ ms: NaN })).toBe('solid')
  })
})

describe('qualityTail', () => {
  it('chỉ thêm câu khi có gì đáng nói', () => {
    expect(qualityTail('solid')).toBeNull()
    expect(qualityTail('instant')).toContain('ngay')
    expect(qualityTail('recovered')).toContain('nhớ thật')
  })

  it('nói rõ thẻ sẽ quay lại khi trả lời chậm', () => {
    expect(qualityTail('hesitant')).toContain('gặp lại')
  })
})
