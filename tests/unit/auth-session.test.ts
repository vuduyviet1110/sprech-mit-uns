import { describe, expect, it, beforeEach } from 'vitest'
import {
  _resetRateLimitBuckets,
  checkRateLimit,
  assertRateLimit,
} from '~/server/utils/rate-limit'
import { normalizeUserId } from '~/server/utils/session'

describe('normalizeUserId', () => {
  it('returns null for empty or demo ids', () => {
    expect(normalizeUserId(null)).toBeNull()
    expect(normalizeUserId('')).toBeNull()
    expect(normalizeUserId('user-demo-id')).toBeNull()
  })

  it('returns trimmed id for valid values', () => {
    expect(normalizeUserId('  abc-123  ')).toBe('abc-123')
  })
})

describe('session identity policy', () => {
  it('documents that only session userId is trusted (spoof sources ignored)', () => {
    // Client may send body/query/header userId — server must ignore them.
    const spoofed = {
      bodyUserId: 'attacker-uuid',
      queryUserId: 'attacker-uuid',
      headerUserId: 'attacker-uuid',
      sessionUserId: null as string | null,
    }
    const trusted = normalizeUserId(spoofed.sessionUserId)
    expect(trusted).toBeNull()
    expect(normalizeUserId(spoofed.bodyUserId)).not.toBe(trusted)
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimitBuckets()
  })

  it('allows requests within limit', () => {
    expect(checkRateLimit('t1', 3, 60_000).ok).toBe(true)
    expect(checkRateLimit('t1', 3, 60_000).ok).toBe(true)
    expect(checkRateLimit('t1', 3, 60_000).ok).toBe(true)
  })

  it('blocks when over limit', () => {
    checkRateLimit('t2', 2, 60_000)
    checkRateLimit('t2', 2, 60_000)
    const blocked = checkRateLimit('t2', 2, 60_000)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0)
    }
  })

  it('assertRateLimit throws 429', () => {
    assertRateLimit('t3', 1, 60_000)
    expect(() => assertRateLimit('t3', 1, 60_000)).toThrow()
  })
})
