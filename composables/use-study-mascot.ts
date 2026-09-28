export const MASCOT_REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

export type MascotReaction = (typeof MASCOT_REACTIONS)[number]
export type StudyCue =
  | 'correct'
  | 'wrong'
  | 'complete'
  | 'greet'
  | 'idle'
  | 'encourage'
  | 'streak'
  | 'tip'

type CueSpec = { reaction: MascotReaction; line: string; ms?: number }

const CUES: Record<'correct' | 'wrong' | 'complete' | 'idle', CueSpec> = {
  correct: { reaction: 'delighted', line: 'Đúng rồi.' },
  wrong: { reaction: 'surprised', line: 'Xem lại đáp án — lỗi cũng là học.' },
  complete: { reaction: 'sparkle', line: 'Xong một lượt. Giỏi!' },
  idle: { reaction: 'sleepy', line: 'Nghỉ ngắn cũng được — quay lại khi sẵn sàng.', ms: 2800 },
}

const ROUTE_GREETS: Array<{ match: RegExp; line: string; reaction: MascotReaction }> = [
  { match: /^\/today/, line: 'Hôm nay làm lần lượt 3 khối là đủ.', reaction: 'wink' },
  { match: /^\/review/, line: 'Ôn đúng lúc sắp quên — mình theo bạn.', reaction: 'sparkle' },
  { match: /^\/lesson/, line: 'Flashcard → đoạn văn → Practice.', reaction: 'delighted' },
  { match: /^\/practice/, line: 'Luyện đều tay, đừng sợ sai.', reaction: 'heart' },
  { match: /^\/progress/, line: 'Xem tiến độ rồi chọn bài tiếp theo nhé.', reaction: 'wink' },
  { match: /^\/$/, line: 'Chào! Bấm mình để nhận mẹo học.', reaction: 'bashful' },
]

const CLICK_TIPS = [
  { reaction: 'wink' as const, line: 'Bấm mình khi cần động viên nhé.' },
  { reaction: 'heart' as const, line: 'Học 15 phút đều tốt hơn 2 giờ một lần.' },
  { reaction: 'sparkle' as const, line: 'Sai một câu không sao — SRS sẽ nhắc lại.' },
  { reaction: 'bashful' as const, line: 'Đọc to giúp nhớ phát âm lâu hơn.' },
  { reaction: 'delighted' as const, line: 'Xong một khối Today là thắng nhỏ rồi.' },
]

const PAYOFFS: MascotReaction[] = ['heart', 'sparkle', 'delighted']
const BOOP_PAYOFF = 120
const BOOP_END = 560
const DIZZY_AFTER = 4
const DIZZY_WINDOW = 1600
const DIZZY_END = 1100
const CUE_MS = 2200
const CUE_DEBOUNCE_MS = 700
const IDLE_MS = 50_000
const STREAK_THRESHOLD = 3
const STORAGE_KEY = 'smu-study-mascot-collapsed'
const GREET_SESSION_KEY = 'smu-mascot-greeted-routes'

let timers: number[] = []
let lastCueAt = 0
let lastActivityAt = 0
let boops = { count: 0, at: 0 }
let tipIndex = 0
let correctStreak = 0
let hydrated = false
let idleWatchStarted = false
let idleInterval: number | undefined

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

function later(ms: number, fn: () => void) {
  timers.push(window.setTimeout(fn, ms))
}

function greetedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(GREET_SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function markGreeted(key: string) {
  const set = greetedSet()
  set.add(key)
  sessionStorage.setItem(GREET_SESSION_KEY, JSON.stringify([...set]))
}

export function useStudyMascot() {
  const reaction = useState<MascotReaction | null>('study-mascot-reaction', () => null)
  const line = useState<string | null>('study-mascot-line', () => null)
  const collapsed = useState('study-mascot-collapsed', () => false)
  const actionLabel = useState<string | null>('study-mascot-action', () => null)

  function hydrateCollapsed() {
    if (!import.meta.client || hydrated) return
    hydrated = true
    collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
    lastActivityAt = Date.now()
    startIdleWatch()
  }

  function touch() {
    lastActivityAt = Date.now()
  }

  function speak(spec: CueSpec) {
    clearTimers()
    touch()
    if (collapsed.value) setCollapsed(false)
    reaction.value = spec.reaction
    line.value = spec.line
    const ms = spec.ms ?? CUE_MS
    later(ms, () => {
      reaction.value = null
      line.value = null
    })
  }

  function startIdleWatch() {
    if (!import.meta.client || idleWatchStarted) return
    idleWatchStarted = true
    idleInterval = window.setInterval(() => {
      if (collapsed.value) return
      if (Date.now() - lastActivityAt < IDLE_MS) return
      if (line.value) return
      speak(CUES.idle)
    }, 8_000)
  }

  function cue(type: StudyCue, extra?: string) {
    if (!import.meta.client) return
    const now = Date.now()
    if (type === 'correct' || type === 'wrong' || type === 'complete') {
      if (now - lastCueAt < CUE_DEBOUNCE_MS) return
      lastCueAt = now
    }

    if (type === 'correct') {
      correctStreak += 1
      if (correctStreak >= STREAK_THRESHOLD && correctStreak % STREAK_THRESHOLD === 0) {
        speak({
          reaction: 'sparkle',
          line: `Chuỗi ${correctStreak} câu đúng! Giữ nhịp này.`,
          ms: 2600,
        })
        return
      }
      speak(CUES.correct)
      return
    }

    if (type === 'wrong') {
      correctStreak = 0
      speak(CUES.wrong)
      return
    }

    if (type === 'complete') {
      correctStreak = 0
      speak(CUES.complete)
      return
    }

    if (type === 'idle') {
      speak(CUES.idle)
      return
    }

    if (type === 'encourage') {
      speak({
        reaction: 'heart',
        line: extra || 'Bạn đang học đều — tiếp tục nhé.',
      })
      return
    }

    if (type === 'streak') {
      speak({
        reaction: 'sparkle',
        line: extra || 'Chuỗi đang cháy!',
        ms: 2600,
      })
      return
    }

    if (type === 'tip') {
      speak({
        reaction: 'wink',
        line: extra || CLICK_TIPS[tipIndex % CLICK_TIPS.length].line,
        ms: 3200,
      })
      return
    }

    if (type === 'greet') {
      speak({
        reaction: 'bashful',
        line: extra || 'Chào bạn — mình theo cùng buổi học này.',
        ms: 2800,
      })
    }
  }

  function greetForPath(path: string) {
    if (!import.meta.client || collapsed.value) return
    const hit = ROUTE_GREETS.find((r) => r.match.test(path))
    if (!hit) return
    const key = hit.match.source
    if (greetedSet().has(key)) return
    markGreeted(key)
    // Small delay so the page paints first
    later(500, () => {
      speak({ reaction: hit.reaction, line: hit.line, ms: 3000 })
    })
  }

  /** Click the fox. Returns true when the squash animation should play. */
  function boop() {
    if (!import.meta.client) return false
    touch()

    const now = Date.now()
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1
    boops.at = now

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0
      clearTimers()
      reaction.value = 'dizzy'
      line.value = 'Ui chóng mặt quá!'
      later(DIZZY_END, () => {
        reaction.value = null
        line.value = null
      })
    } else {
      // Useful click: cycle study tips instead of empty decoration-only boops
      const tip = CLICK_TIPS[tipIndex % CLICK_TIPS.length]
      tipIndex += 1
      clearTimers()
      reaction.value = 'blink'
      later(BOOP_PAYOFF, () => {
        reaction.value = tip.reaction
        line.value = tip.line
      })
      later(Math.max(BOOP_END, 2600), () => {
        reaction.value = null
        line.value = null
      })
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function askTip() {
    if (!import.meta.client) return
    const tip = CLICK_TIPS[tipIndex % CLICK_TIPS.length]
    tipIndex += 1
    cue('tip', tip.line)
  }

  function setCollapsed(next: boolean) {
    collapsed.value = next
    touch()
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    }
  }

  function setActionLabel(label: string | null) {
    actionLabel.value = label
  }

  return {
    reaction,
    line,
    collapsed,
    actionLabel,
    cue,
    boop,
    askTip,
    greetForPath,
    setCollapsed,
    setActionLabel,
    hydrateCollapsed,
    touch,
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (idleInterval) window.clearInterval(idleInterval)
    idleWatchStarted = false
  })
}
