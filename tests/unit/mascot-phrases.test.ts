import { describe, expect, it } from 'vitest'
import {
  PHRASE_POOLS,
  donePhrase,
  encouragePhrase,
  greetingPhrase,
  normalizeLang,
  partOfDay,
  praisePhrase,
  withGloss,
} from '~/utils/mascot-phrases'

describe('partOfDay', () => {
  it('chia đúng ba buổi', () => {
    expect(partOfDay(7)).toBe('morning')
    expect(partOfDay(10)).toBe('morning')
    expect(partOfDay(11)).toBe('afternoon')
    expect(partOfDay(17)).toBe('afternoon')
    expect(partOfDay(18)).toBe('evening')
    expect(partOfDay(23)).toBe('evening')
  })

  it('chịu được giờ vô lý', () => {
    expect(partOfDay(-3)).toBe('morning')
    expect(partOfDay(99)).toBe('evening')
    expect(partOfDay(NaN)).toBe('morning')
  })
})

describe('greetingPhrase', () => {
  it('chào đúng ngôn ngữ đang học', () => {
    expect(greetingPhrase('de', 8).text).toBe('Guten Morgen!')
    expect(greetingPhrase('cs', 8).text).toBe('Dobré ráno!')
    expect(greetingPhrase('cs', 20).text).toBe('Dobrý večer!')
  })

  it('ngôn ngữ lạ thì về tiếng Đức', () => {
    expect(greetingPhrase('en', 8).text).toBe('Guten Morgen!')
    expect(greetingPhrase(undefined, 8).text).toBe('Guten Morgen!')
  })

  it('luôn kèm nghĩa tiếng Việt', () => {
    for (const l of ['de', 'cs']) {
      for (const h of [8, 14, 20]) {
        expect(greetingPhrase(l, h).vi.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('praisePhrase', () => {
  it('xoay vòng, không lặp ngay', () => {
    const a = praisePhrase('de', 0)
    const b = praisePhrase('de', 1)
    expect(a.text).not.toBe(b.text)
  })

  it('index lớn hoặc âm vẫn trả câu hợp lệ', () => {
    expect(praisePhrase('cs', 99).text.length).toBeGreaterThan(0)
    expect(praisePhrase('cs', -5).text.length).toBeGreaterThan(0)
  })
})

describe('withGloss', () => {
  it('ghép câu kèm nghĩa', () => {
    expect(withGloss({ text: 'Super!', vi: 'Tuyệt' })).toBe('Super! (Tuyệt)')
  })

  it('ghép thêm phần đuôi tiếng Việt', () => {
    expect(withGloss({ text: 'Guten Tag!', vi: 'Chào' }, 'Học tiếp nhé.')).toBe(
      'Guten Tag! (Chào) — Học tiếp nhé.',
    )
  })
})

describe('normalizeLang', () => {
  it('chỉ nhận de/cs', () => {
    expect(normalizeLang('cs')).toBe('cs')
    expect(normalizeLang('CS')).toBe('cs')
    expect(normalizeLang('de')).toBe('de')
    expect(normalizeLang('xx')).toBe('de')
    expect(normalizeLang(null)).toBe('de')
  })
})

describe('encouragePhrase', () => {
  it('có câu cho lúc sai, bằng đúng ngôn ngữ đang học', () => {
    expect(encouragePhrase('de', 0).text).toBe('Fast!')
    expect(encouragePhrase('cs', 0).text).toBe('Skoro!')
  })

  it('xoay vòng và chịu được index rác', () => {
    expect(encouragePhrase('de', 0).text).not.toBe(encouragePhrase('de', 1).text)
    expect(encouragePhrase('cs', 999).text.length).toBeGreaterThan(0)
    expect(encouragePhrase('de', NaN).text.length).toBeGreaterThan(0)
  })
})

describe('donePhrase', () => {
  it('có câu cho lúc xong một lượt', () => {
    expect(donePhrase('de', 0).text).toBe('Geschafft!')
    expect(donePhrase('cs', 0).text).toBe('Hotovo!')
  })
})

describe('kho câu', () => {
  const pools = [
    ['praise', praisePhrase],
    ['encourage', encouragePhrase],
    ['done', donePhrase],
  ] as const

  it('đủ rộng để một buổi ôn không nghe lặp liên tục', () => {
    // 20 thẻ một buổi mà chỉ 3 câu khen thì nghe lại mỗi câu bảy lần.
    const praise = new Set(Array.from({ length: 40 }, (_, i) => praisePhrase('de', i).text))
    expect(praise.size).toBeGreaterThanOrEqual(12)
  })

  it('không có câu trùng trong cùng một kho', () => {
    for (const [name, pool] of Object.entries(PHRASE_POOLS)) {
      for (const lang of ['de', 'cs'] as const) {
        const texts = pool[lang].map((p) => p.text)
        expect(new Set(texts).size, `${name}/${lang} có câu trùng`).toBe(texts.length)
      }
    }
  })

  it('hai thứ tiếng có số câu bằng nhau ở mọi kho', () => {
    for (const [name, pool] of Object.entries(PHRASE_POOLS)) {
      expect(pool.de.length, `${name}`).toBe(pool.cs.length)
    }
  })

  it('mọi câu đều có nghĩa tiếng Việt và không lẫn tiếng khác', () => {
    for (const [name, fn] of pools) {
      for (const lang of ['de', 'cs'] as const) {
        for (let i = 0; i < 20; i += 1) {
          const p = fn(lang, i)
          expect(p.text.trim().length, `${name}/${lang}`).toBeGreaterThan(1)
          expect(p.vi.trim().length, `${name}/${lang}`).toBeGreaterThan(1)
          // Chặn chữ tiếng Anh lọt vào kho câu tiếng Đức/Séc.
          expect(p.text, `${name}/${lang}`).not.toMatch(/\b(However|Please|Try again)\b/)
        }
      }
    }
  })
})
