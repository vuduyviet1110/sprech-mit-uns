import { ref, onMounted, onUnmounted } from 'vue'

interface Vocabulary {
  word: string
  audioUrl?: string
}

export function useAudioPlayback() {
  const playingWord = ref<string | null>(null)
  const errorMessage = ref<string>('')
  const loadVoices = () => {
    return new Promise<void>((resolve) => {
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

  const playAudioOrSpeak = (vocab: Vocabulary) => {
    playingWord.value = vocab.word
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
        const utterance = new SpeechSynthesisUtterance(vocab.word)
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

  onMounted(async () => {
    if (typeof window !== 'undefined') {
      await loadVoices()
    }
  })

  onUnmounted(() => {
    speechSynthesis.cancel()
  })

  return {
    playingWord,
    errorMessage,
    playAudioOrSpeak,
  }
}
