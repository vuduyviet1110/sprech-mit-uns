export function speakText(text: string, lang = 'de-DE') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech Synthesis API is not supported in this browser.')
    return
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const Utterance = window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance
    if (!Utterance) return

    const u = new Utterance(text)
    u.lang = lang
    u.rate = 0.9 // Slightly slower for clear learning pronunciation

    // Find German voice if available
    const voices = window.speechSynthesis.getVoices()
    const germanVoice = voices.find((v) => v.lang.startsWith('de'))
    if (germanVoice) {
      u.voice = germanVoice
    }

    window.speechSynthesis.speak(u)
  } catch (err) {
    console.error('TTS error:', err)
  }
}
