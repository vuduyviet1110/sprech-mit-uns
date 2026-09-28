import { ref, onMounted, onUnmounted } from 'vue'
import { useSpeechRecognition } from '@vueuse/core'
import { onNuxtReady } from '#app'

export function useAudioPlayback() {
  const playingWord = ref<string | null>(null)
  const errorMessage = ref<string>('')

  const {
    isSupported,
    isListening: isRecognizing,
    result: recognizedText,
    start: startRecognition,
    stop: stopRecognition,
    error: recognitionError,
  } = useSpeechRecognition({
    lang: 'de-DE',
    interimResults: false,
    continuous: false,
  })

  const loadVoices = () => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve()
      } else {
        speechSynthesis.onvoiceschanged = () => {
          resolve()
        }
      }
    })
  }

  const playAudioOrSpeak = (
    vocab: {
      word?: string
      paragraph?: string
      audioUrl?: string
      lang?: string
    }
  ) => {
    if (typeof window === 'undefined') {
      errorMessage.value = 'Không thể phát âm thanh trên server'
      return
    }

    const toSpeak = vocab.word || vocab.paragraph || ''

    if (!toSpeak) {
      errorMessage.value = 'Không có nội dung để đọc'
      return
    }

    playingWord.value = toSpeak
    errorMessage.value = ''

    // Option 1: Custom audioUrl if provided
    if (vocab.audioUrl) {
      try {
        const audio = new Audio(vocab.audioUrl)
        audio.play()
        audio.onended = () => (playingWord.value = null)
        audio.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm thanh'
          playingWord.value = null
        }
        return
      } catch (err) {
        // Fallback to proxy
      }
    }

    // Determine language prefix
    const rawLang = (vocab.lang || 'de').toLowerCase()
    const targetPrefix = rawLang.startsWith('cs') ? 'cs' : rawLang.startsWith('de') ? 'de' : 'en'
    const normLang = targetPrefix === 'cs' ? 'cs-CZ' : targetPrefix === 'de' ? 'de-DE' : 'en-US'

    const speakBrowserFallback = () => {
      try {
        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(toSpeak)
        utterance.lang = normLang
        utterance.rate = 0.9
        const voices = speechSynthesis.getVoices()
        const nativeVoice =
          voices.find(
            (v) =>
              v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix) &&
              (v.localService || v.name.includes('Google') || v.name.includes('Natural')),
          ) || voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix))
        if (nativeVoice) utterance.voice = nativeVoice
        utterance.onend = () => (playingWord.value = null)
        utterance.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm'
          playingWord.value = null
        }
        speechSynthesis.speak(utterance)
      } catch {
        errorMessage.value = 'Lỗi phát âm'
        playingWord.value = null
      }
    }

    let ttsMode = 'auto'
    try {
      ttsMode = String(useRuntimeConfig().public?.ttsMode || 'auto').toLowerCase()
    } catch {
      ttsMode = 'auto'
    }

    if (ttsMode === 'browser' || targetPrefix === 'en') {
      speakBrowserFallback()
      return
    }

    // High quality server TTS with blob check → browser fallback
    void (async () => {
      try {
        const proxyAudioUrl = `/api/tts?text=${encodeURIComponent(toSpeak.slice(0, 300))}&lang=${targetPrefix}`
        const res = await fetch(proxyAudioUrl, { credentials: 'include' })
        if (!res.ok || !(res.headers.get('content-type') || '').includes('audio')) {
          speakBrowserFallback()
          return
        }
        const blob = await res.blob()
        if (blob.size < 64) {
          speakBrowserFallback()
          return
        }
        const objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)
        audio.playbackRate = 0.95
        audio.onended = () => {
          URL.revokeObjectURL(objectUrl)
          playingWord.value = null
        }
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          speakBrowserFallback()
        }
        await audio.play()
      } catch {
        speakBrowserFallback()
      }
    })()
  }

  // Handle recognition errors
  watch(recognitionError, (err) => {
    if (err) {
      errorMessage.value = `Lỗi nhận diện giọng nói: ${err.message}`
    }
  })

  // Check if speech recognition is supported
  watchEffect(() => {
    if (!isSupported.value) {
      errorMessage.value = 'Trình duyệt không hỗ trợ nhận diện giọng nói'
    }
  })

  onMounted(() => {
    onNuxtReady(async () => {
      await loadVoices()
    })
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.cancel()
      stopRecognition()
    }
  })

  return {
    playingWord,
    errorMessage,
    recognizedText,
    isRecognizing,
    startRecognition,
    stopRecognition,
    playAudioOrSpeak,
    isSupported,
  }
}
