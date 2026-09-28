import { createHash } from 'node:crypto'

const MAX_ENTRIES = 200
const cache = new Map<string, { buf: Buffer; contentType: string; at: number }>()

export function ttsCacheKey(lang: string, text: string): string {
  return createHash('sha256').update(`${lang}:${text}`).digest('hex')
}

export function getCachedTts(key: string): { buf: Buffer; contentType: string } | null {
  const hit = cache.get(key)
  if (!hit) return null
  // refresh LRU order
  cache.delete(key)
  cache.set(key, hit)
  return { buf: hit.buf, contentType: hit.contentType }
}

export function setCachedTts(key: string, buf: Buffer, contentType = 'audio/mpeg') {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { buf, contentType, at: Date.now() })
}

/** Test helper */
export function _resetTtsCache() {
  cache.clear()
}

export function _ttsCacheSize() {
  return cache.size
}
