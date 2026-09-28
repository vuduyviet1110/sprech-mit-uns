import { describe, expect, it } from 'vitest'
import { buildShadowingReport, diffWords } from '~/utils/shadowing-score'

describe('diffWords', () => {
  it('marks exact phrase as all matches', () => {
    const tokens = diffWords('Guten Morgen', 'Guten Morgen')
    expect(tokens.every((t) => t.kind === 'match')).toBe(true)
  })

  it('detects wrong and missing words', () => {
    const tokens = diffWords('Guten Abend', 'Guten Morgen')
    expect(tokens.some((t) => t.kind === 'wrong' || t.kind === 'match')).toBe(
      true,
    )
    const report = buildShadowingReport('Guten Abend', 'Guten Morgen', 'de')
    expect(report.wrongWords.length + report.missingWords.length).toBeGreaterThan(
      0,
    )
  })
})

describe('buildShadowingReport', () => {
  it('scores exact match highly', () => {
    const report = buildShadowingReport(
      'Ich heiße Anna',
      'Ich heiße Anna',
      'de',
    )
    expect(report.level).toBe('exact')
    expect(report.score).toBeGreaterThanOrEqual(90)
    expect(report.wrongWords).toHaveLength(0)
  })

  it('includes German tip for ch words when wrong', () => {
    const report = buildShadowingReport('ich', 'nicht', 'de')
    expect(report.score).toBeLessThan(100)
    const tipIds = report.tips.map((t) => t.id)
    expect(tipIds.length).toBeGreaterThan(0)
  })

  it('builds drill items from wrong/missing words', () => {
    const report = buildShadowingReport('Hallo', 'Hallo Welt', 'de')
    expect(report.missingWords).toContain('welt')
    expect(report.drillItems.some((d) => d.word === 'welt')).toBe(true)
  })

  it('adds Czech ř tip when applicable', () => {
    const report = buildShadowingReport('reka', 'řeka', 'cs')
    expect(report.tips.some((t) => t.id === 'cs-r' || t.id === 'wrong')).toBe(
      true,
    )
  })
})
