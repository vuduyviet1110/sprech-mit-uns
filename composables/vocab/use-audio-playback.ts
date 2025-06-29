import { ref, onMounted, onUnmounted } from 'vue'

interface Vocabulary {
  word: string
  audioUrl?: string
}

export function useAudioPlayback() {
  const isPlaying = ref<boolean>(false)
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

  const playAudioOrSpeak = async (vocab: Vocabulary) => {
    isPlaying.value = true
    errorMessage.value = ''

    if (vocab.audioUrl) {
      try {
        const audio = new Audio(vocab.audioUrl)
        await audio.play()
        audio.onended = () => (isPlaying.value = false)
        audio.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm thanh'
          isPlaying.value = false
        }
      } catch (err) {
        errorMessage.value = 'Lỗi khi phát âm thanh'
        isPlaying.value = false
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

        utterance.onend = () => (isPlaying.value = false)
        utterance.onerror = () => {
          errorMessage.value = 'Lỗi khi phát âm'
          isPlaying.value = false
        }

        speechSynthesis.speak(utterance)
      } catch (err) {
        errorMessage.value = 'Lỗi khi sử dụng SpeechSynthesis'
        isPlaying.value = false
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
    isPlaying,
    errorMessage,
    playAudioOrSpeak,
  }
}
