import { ref, watch, onUnmounted } from 'vue'
import { useSpeechRecognition } from '@vueuse/core'
import {
  buildShadowingReport,
  type ShadowingScoreReport,
} from '~/utils/shadowing-score'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'

export type ShadowingFeedback = ShadowingScoreReport | null

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t))
}

export function useShadowing(opts?: { lang?: () => string }) {
  const { playAudioOrSpeak, playingWord } = useAudioPlayback()

  const recognitionLang = ref('de-DE')
  const lastResult = ref('')
  const feedback = ref<ShadowingFeedback>(null)
  const micError = ref('')
  const listenOnly = ref(false)
  const countdown = ref(0)
  const recordingUrl = ref<string | null>(null)
  const isPlayingSelf = ref(false)
  const isRecording = ref(false)
  const recordSupported = ref(
    typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia,
  )

  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let currentLangCode = 'de'
  let mediaRecorder: MediaRecorder | null = null
  let mediaStream: MediaStream | null = null
  let chunks: BlobPart[] = []
  let selfAudio: HTMLAudioElement | null = null

  const {
    isSupported,
    isListening,
    result,
    start,
    stop,
    error,
  } = useSpeechRecognition({
    lang: recognitionLang,
    interimResults: false,
    continuous: false,
  })

  watch(error, (err) => {
    if (err) micError.value = err.message || 'Không nhận diện được giọng nói'
  })

  watch(result, (r) => {
    if (r) lastResult.value = r
  })

  /** Khi recognition tự tắt → dừng thu âm để tạo file nghe lại */
  watch(isListening, (listening, wasListening) => {
    if (wasListening && !listening) {
      void stopRecording()
    }
  })

  const setLang = (lang: string) => {
    const prefix = (lang || 'de').toLowerCase()
    currentLangCode = prefix.startsWith('cs') ? 'cs' : 'de'
    recognitionLang.value = currentLangCode === 'cs' ? 'cs-CZ' : 'de-DE'
  }

  if (opts?.lang) {
    watch(
      () => opts.lang!(),
      (l) => setLang(l),
      { immediate: true },
    )
  }

  const playLine = (text: string, lang: string) => {
    stopSelfPlayback()
    playAudioOrSpeak({ word: text, lang })
  }

  const startCountdown = (seconds = 2) => {
    countdown.value = seconds
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  }

  const revokeRecording = () => {
    stopSelfPlayback()
    if (recordingUrl.value) {
      URL.revokeObjectURL(recordingUrl.value)
      recordingUrl.value = null
    }
  }

  const stopSelfPlayback = () => {
    if (selfAudio) {
      selfAudio.pause()
      selfAudio = null
    }
    isPlayingSelf.value = false
  }

  const stopMediaTracks = () => {
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }

  const stopRecording = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        isRecording.value = false
        stopMediaTracks()
        resolve()
        return
      }
      mediaRecorder.onstop = () => {
        const mime = mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: mime })
        chunks = []
        if (blob.size > 0) {
          revokeRecording()
          recordingUrl.value = URL.createObjectURL(blob)
        }
        isRecording.value = false
        mediaRecorder = null
        stopMediaTracks()
        resolve()
      }
      try {
        mediaRecorder.stop()
      } catch {
        isRecording.value = false
        mediaRecorder = null
        stopMediaTracks()
        resolve()
      }
    })
  }

  const startRecording = async () => {
    if (!recordSupported.value) return
    revokeRecording()
    chunks = []
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      const mime = pickRecorderMime()
      mediaRecorder = mime
        ? new MediaRecorder(mediaStream, { mimeType: mime })
        : new MediaRecorder(mediaStream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start(200)
      isRecording.value = true
    } catch (e: any) {
      console.warn('MediaRecorder unavailable', e)
      // Recognition vẫn chạy được; chỉ không nghe lại được
      micError.value =
        micError.value ||
        'Không thu được file âm thanh để nghe lại (trình duyệt / quyền mic).'
    }
  }

  const playRecording = async () => {
    if (!recordingUrl.value) return
    stopSelfPlayback()
    // Pause TTS if any
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    selfAudio = new Audio(recordingUrl.value)
    isPlayingSelf.value = true
    selfAudio.onended = () => {
      isPlayingSelf.value = false
    }
    selfAudio.onerror = () => {
      isPlayingSelf.value = false
      micError.value = 'Không phát được bản thu của bạn'
    }
    try {
      await selfAudio.play()
    } catch {
      isPlayingSelf.value = false
    }
  }

  const startMic = async () => {
    micError.value = ''
    lastResult.value = ''
    feedback.value = null
    revokeRecording()
    await startRecording()
    try {
      start()
    } catch (e: any) {
      micError.value = e?.message || 'Không mở được micro'
      await stopRecording()
    }
  }

  const stopMic = async () => {
    stop()
    await stopRecording()
  }

  const clearAttempt = async () => {
    stop()
    await stopRecording()
    lastResult.value = ''
    feedback.value = null
    micError.value = ''
    countdown.value = 0
    revokeRecording()
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  const evaluateAgainst = (target: string, lang?: string) => {
    const spoken = lastResult.value || result.value || ''
    const report = buildShadowingReport(spoken, target, lang || currentLangCode)
    feedback.value = { ...report }
    return feedback.value
  }

  onUnmounted(() => {
    stop()
    void stopRecording()
    revokeRecording()
    if (countdownTimer) clearInterval(countdownTimer)
  })

  return {
    isSupported,
    isListening,
    result,
    lastResult,
    feedback,
    micError,
    listenOnly,
    countdown,
    playingWord,
    recordingUrl,
    isPlayingSelf,
    isRecording,
    recordSupported,
    setLang,
    playLine,
    startCountdown,
    startMic,
    stopMic,
    clearAttempt,
    evaluateAgainst,
    playRecording,
    stopSelfPlayback,
  }
}
