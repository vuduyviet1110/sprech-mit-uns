/**
 * Stable client TTS: optional server proxy → always fall back to Web Speech.
 * Modes via NUXT_PUBLIC_TTS_MODE: auto | browser | proxy
 */

function resolveLang(text: string, lang: string): { prefix: 'de' | 'cs' | 'en'; bcp47: string } {
  const lowerLang = (lang || '').toLowerCase()
  let prefix: 'de' | 'cs' | 'en' = 'de'
  if (lowerLang.includes('cs') || lowerLang.includes('czech') || lowerLang.includes('séc')) {
    prefix = 'cs'
  } else if (lowerLang.includes('de') || lowerLang.includes('german') || lowerLang.includes('đức')) {
    prefix = 'de'
  } else if (/^(die|der|das|ein|eine|einen|einem|einer)\s+/i.test(text.trim())) {
    prefix = 'de'
  } else if (lowerLang.startsWith('en')) {
    prefix = 'en'
  }
  const bcp47 = prefix === 'cs' ? 'cs-CZ' : prefix === 'de' ? 'de-DE' : 'en-US'
  return { prefix, bcp47 }
}

function speakBrowser(text: string, bcp47: string, prefix: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const Utterance = window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance
  if (!Utterance) return
  const u = new Utterance(text)
  u.lang = bcp47
  u.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const native =
    voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(prefix) &&
        (v.localService || v.name.includes('Google') || v.name.includes('Natural')),
    ) || voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix))
  if (native) u.voice = native
  window.speechSynthesis.speak(u)
}

async function playProxyAudio(text: string, prefix: 'de' | 'cs' | 'en'): Promise<boolean> {
  if (prefix === 'en') return false
  try {
    const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${prefix}`
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return false
    const type = res.headers.get('content-type') || ''
    if (!type.includes('audio')) return false
    const blob = await res.blob()
    if (blob.size < 64) return false
    const objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    audio.playbackRate = 0.95
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl)
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('audio play failed'))
      }
      audio.play().catch(reject)
    })
    return true
  } catch {
    return false
  }
}

export function speakText(text: string, lang = 'de-DE') {
  if (typeof window === 'undefined') return

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    const cleanText = text.replace(/###\s*/g, '').trim().slice(0, 250)
    if (!cleanText) return

    const { prefix, bcp47 } = resolveLang(cleanText, lang)

    let mode = 'auto'
    try {
      const config = useRuntimeConfig()
      mode = String(config.public?.ttsMode || 'auto').toLowerCase()
    } catch {
      mode = 'auto'
    }

    if (mode === 'browser') {
      speakBrowser(cleanText, bcp47, prefix)
      return
    }

    if (mode === 'proxy' || mode === 'auto') {
      void playProxyAudio(cleanText, prefix).then((ok) => {
        if (!ok) speakBrowser(cleanText, bcp47, prefix)
      })
      return
    }

    speakBrowser(cleanText, bcp47, prefix)
  } catch (err) {
    console.error('TTS error:', err)
  }
}
