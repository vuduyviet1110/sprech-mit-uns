import { defineEventHandler, getQuery, createError, setResponseHeader } from 'h3'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { getCachedTts, setCachedTts, ttsCacheKey } from '~/server/utils/tts-cache'
import { fetchGoogleTtsAudio, resolveTtsProvider } from '~/server/utils/tts-provider'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  assertRateLimit(`tts:${clientIp(event)}`, 60, 60 * 1000)

  const query = getQuery(event)
  const text = ((query.text as string) || '').slice(0, 300).trim()
  const lang = ((query.lang as string) || 'cs').startsWith('cs') ? 'cs' : 'de'

  if (!text) {
    throw createError({ statusCode: 400, message: 'Text parameter is required' })
  }

  const provider = resolveTtsProvider()
  if (provider === 'off') {
    setResponseHeader(event, 'X-TTS-Fallback', 'browser')
    throw createError({
      statusCode: 503,
      message: 'Server TTS disabled — use browser speech',
    })
  }

  const key = ttsCacheKey(lang, text)
  const cached = getCachedTts(key)
  if (cached) {
    setResponseHeader(event, 'Content-Type', cached.contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
    setResponseHeader(event, 'X-TTS-Cache', 'HIT')
    return cached.buf
  }

  try {
    const buf = await fetchGoogleTtsAudio(text, lang)
    setCachedTts(key, buf)
    setResponseHeader(event, 'Content-Type', 'audio/mpeg')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
    setResponseHeader(event, 'X-TTS-Cache', 'MISS')
    return buf
  } catch (err: any) {
    setResponseHeader(event, 'X-TTS-Fallback', 'browser')
    throw createError({
      statusCode: 503,
      message: err?.message || 'TTS unavailable — use browser speech',
    })
  }
})
