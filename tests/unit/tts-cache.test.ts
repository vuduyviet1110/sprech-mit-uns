import { describe, expect, it, beforeEach } from 'vitest'
import {
  _resetTtsCache,
  _ttsCacheSize,
  getCachedTts,
  setCachedTts,
  ttsCacheKey,
} from '~/server/utils/tts-cache'
import { resolveTtsProvider } from '~/server/utils/tts-provider'

describe('tts cache', () => {
  beforeEach(() => {
    _resetTtsCache()
  })

  it('keys differ by lang and text', () => {
    expect(ttsCacheKey('de', 'Hallo')).not.toBe(ttsCacheKey('cs', 'Hallo'))
    expect(ttsCacheKey('de', 'Hallo')).not.toBe(ttsCacheKey('de', 'Hallo!'))
  })

  it('stores and returns buffers (LRU)', () => {
    const key = ttsCacheKey('de', 'Guten Tag')
    const buf = Buffer.from('fake-audio-bytes-here')
    setCachedTts(key, buf)
    expect(_ttsCacheSize()).toBe(1)
    const hit = getCachedTts(key)
    expect(hit?.buf.equals(buf)).toBe(true)
    expect(hit?.contentType).toBe('audio/mpeg')
  })
})

describe('tts provider', () => {
  it('resolves off vs google from env', () => {
    const prev = process.env.SMU_TTS_PROVIDER
    process.env.SMU_TTS_PROVIDER = 'off'
    expect(resolveTtsProvider()).toBe('off')
    process.env.SMU_TTS_PROVIDER = 'google'
    expect(resolveTtsProvider()).toBe('google')
    if (prev === undefined) delete process.env.SMU_TTS_PROVIDER
    else process.env.SMU_TTS_PROVIDER = prev
  })
})
