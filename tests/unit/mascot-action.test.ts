import { describe, expect, it } from 'vitest'
import {
  DUE_NUDGE_MIN,
  WRONG_STREAK_LIMIT,
  pickAction,
  type MascotActionState,
} from '~/utils/mascot-action'

const base: MascotActionState = {
  dueCount: 0,
  path: '/',
  blocksDone: 0,
  blocksTotal: 3,
  wrongStreak: 0,
  nextBlock: { title: 'Trưa — Shadowing hội thoại', to: '/practice/shadowing' },
}

describe('pickAction — kho ôn dồn', () => {
  it('mời ôn khi đủ ngưỡng', () => {
    const a = pickAction({ ...base, dueCount: 12 })
    expect(a?.to).toBe('/review')
    expect(a?.label).toBe('Ôn ngay')
    expect(a?.line).toContain('12')
  })

  it('im khi chưa đủ ngưỡng', () => {
    expect(pickAction({ ...base, dueCount: DUE_NUDGE_MIN - 1 })).toBeNull()
  })

  it('không mời sang trang đang đứng', () => {
    expect(pickAction({ ...base, dueCount: 30, path: '/review' })).toBeNull()
    expect(pickAction({ ...base, dueCount: 30, path: '/review/abc' })).toBeNull()
  })
})

describe('pickAction — đang vấp', () => {
  it('khuyên xem lại khi sai liên tiếp', () => {
    const a = pickAction({ ...base, wrongStreak: WRONG_STREAK_LIMIT })
    expect(a?.to).toBe('/dictionary')
    expect(a?.reaction).toBe('surprised')
  })

  it('việc đang vấp đứng trước kho ôn', () => {
    const a = pickAction({ ...base, wrongStreak: 5, dueCount: 40 })
    expect(a?.to).toBe('/dictionary')
  })

  it('im khi chưa sai đủ nhiều', () => {
    expect(pickAction({ ...base, wrongStreak: WRONG_STREAK_LIMIT - 1 })).toBeNull()
  })
})

describe('pickAction — khối Today', () => {
  it('mời khối kế tiếp khi đã làm được ít nhất một khối', () => {
    const a = pickAction({ ...base, blocksDone: 1 })
    expect(a?.to).toBe('/practice/shadowing')
    expect(a?.label).toBe('Làm tiếp')
    expect(a?.line).toContain('1/3')
  })

  it('không đẩy người vừa mở app đi đâu cả', () => {
    expect(pickAction({ ...base, blocksDone: 0 })).toBeNull()
  })

  it('im khi đã xong hết', () => {
    expect(pickAction({ ...base, blocksDone: 3, nextBlock: null })).toBeNull()
  })

  it('không mời sang khối đang làm dở', () => {
    expect(
      pickAction({ ...base, blocksDone: 1, path: '/practice/shadowing' }),
    ).toBeNull()
  })

  it('kho ôn đứng trước khối Today', () => {
    const a = pickAction({ ...base, blocksDone: 1, dueCount: 20 })
    expect(a?.to).toBe('/review')
  })
})

describe('pickAction — đầu vào hỏng', () => {
  it('không vỡ với số âm hay giá trị rác', () => {
    expect(pickAction({ ...base, dueCount: -5 })).toBeNull()
    expect(
      pickAction({ ...base, dueCount: NaN, wrongStreak: NaN, path: '' }),
    ).toBeNull()
  })

  it('bỏ qua khối kế tiếp không có đường đi', () => {
    expect(
      pickAction({
        ...base,
        blocksDone: 1,
        nextBlock: { title: 'x', to: '' },
      }),
    ).toBeNull()
  })
})
