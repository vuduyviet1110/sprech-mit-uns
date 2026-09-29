import { onUnmounted, ref } from 'vue'

/**
 * Bọc YouTube IFrame Player API để phát chính xác một đoạn A-B.
 *
 * Cách cũ (`setTimeout` theo thời lượng đoạn + postMessage thô) nổ theo
 * wall-clock nên lệch mỗi khi video buffer. Ở đây ta poll `getCurrentTime()`
 * bằng requestAnimationFrame và pause đúng mốc `end`.
 */

export interface UseYoutubePlayerOptions {
  /** id của thẻ div sẽ bị YT API thay thế bằng iframe */
  elementId: string
  /** gọi khi phát tới hết đoạn hiện tại */
  onEnd?: () => void
  onStateChange?: (state: number) => void
  onReady?: () => void
}

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

const API_SCRIPT_ID = 'yt-iframe-api'
let apiPromise: Promise<any> | null = null

/** Nạp https://www.youtube.com/iframe_api một lần duy nhất cho cả app. */
function loadYTApi(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('YouTube IFrame API chỉ khả dụng trên client'),
    )
  }
  const w = window as any
  if (w.YT?.Player) return Promise.resolve(w.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    // Nối vào hook có sẵn thay vì ghi đè, tránh phá consumer khác.
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve(w.YT)
    }
    if (!document.getElementById(API_SCRIPT_ID)) {
      const s = document.createElement('script')
      s.id = API_SCRIPT_ID
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  })

  return apiPromise
}

export function useYoutubePlayer(opts: UseYoutubePlayerOptions) {
  const isReady = ref(false)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const playbackRate = ref(1)

  let player: any = null
  let rafId = 0
  let destroyed = false

  /** Biên của đoạn đang luyện. Giữ nguyên sau khi pause để `replaySegment` dùng lại. */
  let segmentStart = 0
  let segmentEnd = Infinity
  /** Có đang theo dõi để tự pause hay không. Tách khỏi `segmentEnd` để việc
   *  pause không xoá mất biên đoạn (nếu xoá, lần nghe lại sẽ chạy vô hạn). */
  let watching = false

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const tick = () => {
    rafId = requestAnimationFrame(tick)
    if (!player?.getCurrentTime) return
    const t = player.getCurrentTime()
    if (typeof t !== 'number' || Number.isNaN(t)) return
    currentTime.value = t

    if (!watching) return

    // Chỉ pause khi player thực sự đang phát. Ngay sau `seekTo` + `playVideo`,
    // player còn ở trạng thái seek/buffer và `getCurrentTime()` vẫn trả mốc cũ;
    // gọi `pauseVideo()` lúc đó bị YouTube bỏ qua và đoạn sẽ chạy quá biên.
    const state =
      typeof player.getPlayerState === 'function'
        ? player.getPlayerState()
        : YT_STATE.PLAYING
    if (state !== YT_STATE.PLAYING) return

    if (t >= segmentEnd) {
      watching = false
      stopLoop()
      try {
        player.pauseVideo()
      } catch {
        /* player có thể đã bị destroy */
      }
      isPlaying.value = false
      opts.onEnd?.()
    }
  }

  const startLoop = () => {
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  /** Tạo player lần đầu. Idempotent. */
  const mount = async (videoId: string, startSeconds = 0): Promise<void> => {
    if (typeof window === 'undefined' || destroyed) return
    if (player) {
      await loadVideo(videoId, startSeconds)
      return
    }

    const YT = await loadYTApi()
    if (destroyed) return

    await new Promise<void>((resolve) => {
      player = new YT.Player(opts.elementId, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          playsinline: 1,
          start: Math.floor(startSeconds),
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            isReady.value = true
            opts.onReady?.()
            resolve()
          },
          onStateChange: (e: any) => {
            const state = e?.data
            isPlaying.value = state === YT_STATE.PLAYING
            if (state === YT_STATE.ENDED) {
              watching = false
              stopLoop()
            }
            opts.onStateChange?.(state)
          },
        },
      })
    })
  }

  /** Đổi video mà không huỷ player — không remount iframe, không buffer lại từ đầu. */
  const loadVideo = async (
    videoId: string,
    startSeconds = 0,
  ): Promise<void> => {
    if (!player) {
      await mount(videoId, startSeconds)
      return
    }
    watching = false
    segmentStart = 0
    segmentEnd = Infinity
    stopLoop()
    isPlaying.value = false
    player.cueVideoById({ videoId, startSeconds })
  }

  /** Phát từ `start` và tự pause đúng tại `end`. */
  const playSegment = (start: number, end: number) => {
    if (!player?.seekTo) return
    segmentStart = start
    segmentEnd = end
    watching = true
    player.seekTo(start, true)
    try {
      player.playVideo()
    } catch {
      isPlaying.value = false
    }
    startLoop()
  }

  /** Phát lại đúng đoạn vừa nghe. */
  const replaySegment = () => {
    if (segmentEnd === Infinity) return
    playSegment(segmentStart, segmentEnd)
  }

  const play = () => {
    if (!player?.playVideo) return
    player.playVideo()
    startLoop()
  }

  const pause = () => {
    if (!player?.pauseVideo) return
    // Người dùng chủ động dừng: thôi theo dõi biên, nhưng giữ `segmentStart/End`
    // để vẫn nghe lại được đúng đoạn.
    watching = false
    stopLoop()
    player.pauseVideo()
    isPlaying.value = false
  }

  const togglePlay = () => {
    if (isPlaying.value) pause()
    else play()
  }

  const seekTo = (seconds: number) => {
    if (!player?.seekTo) return
    player.seekTo(seconds, true)
  }

  const setRate = (rate: number) => {
    if (!player?.setPlaybackRate) return
    player.setPlaybackRate(rate)
    playbackRate.value = rate
  }

  const destroy = () => {
    destroyed = true
    stopLoop()
    if (player?.destroy) {
      try {
        player.destroy()
      } catch {
        /* ignore */
      }
    }
    player = null
    isReady.value = false
    isPlaying.value = false
  }

  onUnmounted(destroy)

  return {
    isReady,
    isPlaying,
    currentTime,
    playbackRate,
    mount,
    loadVideo,
    playSegment,
    replaySegment,
    play,
    pause,
    togglePlay,
    seekTo,
    setRate,
    destroy,
  }
}
