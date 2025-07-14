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

  const playAudioOrSpeak = (vocab: {
    word?: string
    paragraph?: string
    audioUrl?: string
  }) => {
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

    if (vocab.audioUrl) {
      try {
        const audio = new Audio(vocab.audioUrl)
        audio.play()
        audio.onended = () => (playingWord.value = null)
        audio.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm thanh'
          playingWord.value = null
        }
      } catch (err) {
        errorMessage.value = 'Lỗi khi phát âm thanh'
        playingWord.value = null
      }
    } else {
      try {
        speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(toSpeak)
        utterance.lang = 'de-DE'
        utterance.rate = 1
        utterance.pitch = 1

        const voices = speechSynthesis.getVoices()
        const germanVoice = voices.find((v) => v.lang === 'de-DE')
        if (germanVoice) {
          utterance.voice = germanVoice
        } else {
          errorMessage.value =
            'Không tìm thấy giọng tiếng Đức, sử dụng giọng mặc định'
        }

        utterance.onend = () => (playingWord.value = null)
        utterance.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm'
          playingWord.value = null
        }

        speechSynthesis.speak(utterance)
      } catch (err) {
        errorMessage.value = 'Lỗi khi sử dụng SpeechSynthesis'
        playingWord.value = null
      }
    }
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
