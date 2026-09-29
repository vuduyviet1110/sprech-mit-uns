import { describe, expect, it } from 'vitest'
import {
  buildHint,
  normalizeCueText,
  segmentCues,
  toRawCues,
  type RawCue,
} from '~/server/utils/transcript-segment'

/** Sinh chuỗi cue liền kề, mỗi cue `duration` giây. */
function stream(texts: string[], duration = 1.2, startAt = 0): RawCue[] {
  return texts.map((text, i) => ({
    start: startAt + i * duration,
    duration,
    text,
  }))
}

describe('normalizeCueText', () => {
  it('decodes entities and collapses whitespace', () => {
    expect(normalizeCueText('Wie  geht&#39;s   dir')).toBe("Wie geht's dir")
  })
})

describe('toRawCues', () => {
  it('converts ms to seconds and defaults missing duration', () => {
    const cues = toRawCues([{ text: 'hallo', offset: 1500 }])
    expect(cues[0]!.start).toBe(1.5)
    expect(cues[0]!.duration).toBe(2)
  })
})

describe('segmentCues — unpunctuated ASR captions', () => {
  // Đây là ca gây bug gốc: không có dấu câu nào, trước đây ra đúng 1 đoạn.
  const cues = stream(
    Array.from({ length: 24 }, (_, i) => `wort${i} noch${i} mehr${i}`),
    1.2,
  )
  const segments = segmentCues(cues)

  it('produces many segments, not one', () => {
    expect(segments.length).toBeGreaterThan(1)
  })

  it('respects the word cap', () => {
    for (const s of segments) expect(s.wordCount).toBeLessThanOrEqual(15)
  })

  it('respects the word floor except possibly the last segment', () => {
    for (const s of segments.slice(0, -1))
      expect(s.wordCount).toBeGreaterThanOrEqual(5)
  })

  it('keeps monotonically increasing starts', () => {
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i]!.start).toBeGreaterThan(segments[i - 1]!.start)
    }
  })
})

describe('segmentCues — single run-on cue', () => {
  const words = Array.from({ length: 45 }, (_, i) => `w${i}`).join(' ')
  const segments = segmentCues([{ start: 0, duration: 30, text: words }])

  it('chunks one long cue into several segments', () => {
    expect(segments.length).toBeGreaterThanOrEqual(3)
  })

  it('keeps each chunk within the word cap', () => {
    for (const s of segments) expect(s.wordCount).toBeLessThanOrEqual(15)
  })

  it('allocates time proportionally with increasing starts', () => {
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i]!.start).toBeGreaterThan(segments[i - 1]!.start)
    }
  })
})

describe('segmentCues — punctuated captions', () => {
  const segments = segmentCues([
    { start: 0, duration: 3, text: 'Guten Morgen wie geht es dir heute.' },
    { start: 3, duration: 3, text: 'Ich komme aus Berlin und lerne Deutsch?' },
    {
      start: 6,
      duration: 3,
      text: 'Das ist wirklich sehr interessant fuer mich!',
    },
  ])

  it('splits on sentence punctuation', () => {
    expect(segments).toHaveLength(3)
  })

  it('keeps terminal punctuation in the text', () => {
    expect(segments[0]!.text.endsWith('.')).toBe(true)
    expect(segments[1]!.text.endsWith('?')).toBe(true)
    expect(segments[2]!.text.endsWith('!')).toBe(true)
  })
})

describe('segmentCues — silence gap', () => {
  const segments = segmentCues([
    { start: 0, duration: 3, text: 'eins zwei drei vier fuenf sechs' },
    // khoảng lặng 1.5s
    { start: 4.5, duration: 3, text: 'sieben acht neun zehn elf zwoelf' },
  ])

  it('splits at the gap even without punctuation', () => {
    expect(segments).toHaveLength(2)
  })

  it('puts the boundary at the gap', () => {
    expect(segments[0]!.text).toContain('sechs')
    expect(segments[1]!.text).toContain('sieben')
  })
})

describe('segmentCues — padding', () => {
  it('clamps a padded start to zero', () => {
    const segments = segmentCues([
      { start: 0.1, duration: 3, text: 'eins zwei drei vier fuenf sechs' },
    ])
    expect(segments[0]!.start).toBe(0)
  })

  it('extends the end by padEnd', () => {
    const segments = segmentCues([
      { start: 10, duration: 3, text: 'eins zwei drei vier fuenf sechs' },
    ])
    expect(segments[0]!.end).toBeCloseTo(13.35, 3)
    expect(segments[0]!.start).toBeCloseTo(9.75, 3)
  })
})

describe('segmentCues — degenerate input', () => {
  it('returns empty for no cues', () => {
    expect(segmentCues([])).toEqual([])
  })

  it('returns empty for blank-only cues', () => {
    expect(segmentCues([{ start: 0, duration: 2, text: '   ' }])).toEqual([])
  })
})

describe('segmentCues — rolling (overlapping) captions', () => {
  // Timing thật lấy từ video Easy Czech 9-4SJ_1Ypv0: mỗi cue khai báo duration
  // ~7-8s nhưng cue kế tiếp bắt đầu sau ~4s, nên các cue chồng lên nhau.
  const cues: RawCue[] = [
    {
      start: 0.2,
      duration: 8.16,
      text: 'Ahoj, tady Lucka a vitejte u dalsiho',
    },
    {
      start: 4.24,
      duration: 7.48,
      text: 'super easy check videa. Dnes jsme s',
    },
    {
      start: 8.36,
      duration: 6.64,
      text: 'Anickou v Praze. Budeme se tu prochazet',
    },
    {
      start: 11.72,
      duration: 6.92,
      text: 'a budeme vam ukazovat, co vidime kolem',
    },
    { start: 15.0, duration: 6.76, text: 'sebe a budeme se snazit pouzivat' },
    {
      start: 18.64,
      duration: 7.44,
      text: 'jednoducha slovicka a jako vzdy se',
    },
    {
      start: 21.76,
      duration: 8.08,
      text: 'budeme snazit mluvit velmi pomalu. Tak',
    },
    { start: 26.08, duration: 3.76, text: 'jo, jdem na to.' },
  ]
  const segments = segmentCues(cues)

  it('does not inflate durations past the cap', () => {
    // Không cắt overlap thì đoạn đầu phồng lên >15s.
    for (const s of segments) expect(s.duration).toBeLessThanOrEqual(8.6)
  })

  it('does not exceed the word cap', () => {
    for (const s of segments) expect(s.wordCount).toBeLessThanOrEqual(15)
  })

  it('keeps segments in order without large overlap', () => {
    for (let i = 1; i < segments.length; i++) {
      // Chỉ được chồng đúng phần padding (padStart + padEnd = 0.6s).
      expect(segments[i]!.start).toBeGreaterThanOrEqual(
        segments[i - 1]!.end - 0.61,
      )
    }
  })
})

describe('segmentCues — word cap with multi-word cues', () => {
  it('flushes before a cue that would push past maxWords', () => {
    // Mỗi cue 6 từ: 2 cue = 12 từ (ok), cue thứ 3 sẽ thành 18 > 15 nên phải cắt trước.
    const cues = stream(
      Array.from(
        { length: 6 },
        (_, i) => `a${i} b${i} c${i} d${i} e${i} f${i}`,
      ),
      0.9,
    )
    const segments = segmentCues(cues)
    for (const s of segments) expect(s.wordCount).toBeLessThanOrEqual(15)
  })
})

describe('segmentCues — tail merge', () => {
  it('does not leave a one-word orphan segment', () => {
    const cues: RawCue[] = [
      ...stream(
        Array.from({ length: 12 }, (_, i) => `wort${i} noch${i} mehr${i}`),
        1.2,
      ),
      { start: 14.4, duration: 0.5, text: 'ende' },
    ]
    const segments = segmentCues(cues)
    expect(segments[segments.length - 1]!.wordCount).toBeGreaterThan(1)
    expect(segments[segments.length - 1]!.text).toContain('ende')
  })
})

describe('buildHint', () => {
  it('masks inner letters and keeps short words intact', () => {
    expect(buildHint('Morgen du')).toBe('M____n du')
  })
})
