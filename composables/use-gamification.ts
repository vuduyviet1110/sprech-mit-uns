import confetti from 'canvas-confetti'

export function useGamification() {
  const { cue } = useStudyMascot()

  /**
   * Bắn pháo hoa rực rỡ khi hoàn thành bài test / đạt điểm tối đa
   */
  const triggerConfetti = () => {
    // Đợt pháo hoa thứ nhất từ góc trái & phải
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.2 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    })
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    })

    // Đợt 2 sau 200ms
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#fbbf24', '#f43f5e', '#a855f7'],
      })
    }, 200)
  }

  /**
   * Phát âm thanh Ting! (đúng) hoặc Bzz! (sai) dùng Web Audio API thuần (không lo thiếu file mp3)
   */
  const playSound = (type: 'correct' | 'wrong' | 'complete') => {
    cue(type)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      if (type === 'correct') {
        // Âm thanh 'Ting!' trong trẻo (chuỗi nốt vui nhộn)
        const now = ctx.currentTime
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()

        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(523.25, now) // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1) // E5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2) // G5

        gain1.gain.setValueAtTime(0.3, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

        osc1.connect(gain1)
        gain1.connect(ctx.destination)

        osc1.start(now)
        osc1.stop(now + 0.35)
      } else if (type === 'wrong') {
        // Âm thanh báo sai trầm (Low Frequency Buzz)
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, now)
        osc.frequency.linearRampToValueAtTime(110, now + 0.25)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.3)
      } else if (type === 'complete') {
        // Âm thanh chúc mừng Fanfare ngắn
        const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const now = ctx.currentTime + idx * 0.1
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()

          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now)

          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

          osc.connect(gain)
          gain.connect(ctx.destination)

          osc.start(now)
          osc.stop(now + 0.3)
        })
      }
    } catch (e) {
      console.warn('Audio Context is not available:', e)
    }
  }

  return {
    triggerConfetti,
    playSound,
  }
}
