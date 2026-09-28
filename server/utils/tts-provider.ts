/**
 * Fetch Google Translate TTS with one retry. Unofficial upstream — treat as best-effort.
 * Prefer client Web Speech when this fails (see SMU_TTS_PROVIDER=off / NUXT_PUBLIC_TTS_MODE).
 */
export async function fetchGoogleTtsAudio(
  text: string,
  lang: 'de' | 'cs',
): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Referer: 'https://translate.google.com/',
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const audioRes = await fetch(url, { headers })
      if (!audioRes.ok) {
        throw new Error(`TTS upstream ${audioRes.status}`)
      }
      const buf = Buffer.from(await audioRes.arrayBuffer())
      if (buf.byteLength < 64) {
        throw new Error('TTS upstream returned empty audio')
      }
      return buf
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }
  }
  throw lastError || new Error('TTS upstream failed')
}

/** google | off — off forces clients to use browser speech */
export function resolveTtsProvider(): 'google' | 'off' {
  const raw = (process.env.SMU_TTS_PROVIDER || 'google').toLowerCase()
  return raw === 'off' ? 'off' : 'google'
}
