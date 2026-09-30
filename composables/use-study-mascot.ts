import { buildWelcome } from '~/utils/mascot-welcome'
import {
  donePhrase,
  encouragePhrase,
  greetingPhrase,
  praisePhrase,
  withGloss,
} from '~/utils/mascot-phrases'
import { classifyAnswer, qualityTail, type AnswerSample } from '~/utils/mascot-quality'
import { readMascotEnabled, useLearningSettings } from '~/composables/use-learning-settings'
import {
  MASCOT_REACTIONS,
  idleAllowedFor,
  tipPoolFor,
  type MascotReaction,
} from '~/utils/mascot-tips'
import { WRONG_STREAK_LIMIT, pickAction, type MascotAction } from '~/utils/mascot-action'

export type StudyCue =
  | 'correct'
  | 'wrong'
  | 'complete'
  | 'greet'
  | 'idle'
  | 'encourage'
  | 'streak'
  | 'tip'

type CueSpec = {
  reaction: MascotReaction
  line: string
  ms?: number
  /** Nút bấm đi kèm. Lời nói suông thì bỏ trống. */
  action?: MascotAction | null
}

const CUES: Record<'correct' | 'wrong' | 'complete' | 'idle', CueSpec> = {
  correct: { reaction: 'delighted', line: 'Đúng rồi.' },
  wrong: { reaction: 'surprised', line: 'Xem lại đáp án — lỗi cũng là học.' },
  complete: { reaction: 'sparkle', line: 'Xong một lượt. Giỏi!' },
  idle: { reaction: 'sleepy', line: 'Nghỉ ngắn cũng được — quay lại khi sẵn sàng.', ms: 2800 },
}

/** `{lang}` được thay bằng "tiếng Đức" / "tiếng Séc" lúc nói. */
const ROUTE_GREETS: Array<{ match: RegExp; line: string; reaction: MascotReaction }> = [
  { match: /^\/today/, line: 'Hôm nay làm lần lượt 3 khối {lang} là đủ.', reaction: 'wink' },
  { match: /^\/review/, line: 'Ôn đúng lúc sắp quên — mình theo bạn.', reaction: 'sparkle' },
  { match: /^\/lesson/, line: 'Flashcard → đoạn văn → Practice.', reaction: 'delighted' },
  { match: /^\/practice\/pronunciation/, line: 'Đọc to từng từ, miệng nhớ nhanh hơn tai.', reaction: 'heart' },
  { match: /^\/practice\/shadowing/, line: 'Nghe xong nhại lại ngay, đừng chờ hiểu hết.', reaction: 'heart' },
  { match: /^\/practice/, line: 'Luyện đều tay, đừng sợ sai.', reaction: 'heart' },
  { match: /^\/progress/, line: 'Xem tiến độ rồi chọn bài tiếp theo nhé.', reaction: 'wink' },
  { match: /^\/sub-menu\/youtube/, line: 'Nghe hai lần rồi hãy gõ — đừng nhìn đáp án vội.', reaction: 'sparkle' },
  { match: /^\/sub-menu\/news/, line: 'Bấm vào từ lạ để tra nghĩa ngay trong bài.', reaction: 'delighted' },
  { match: /^\/dictionary/, line: 'Lưu từ vào sổ để SRS nhắc lại đúng lúc.', reaction: 'wink' },
  { match: /^\/$/, line: 'Chào! Bấm mình để nhận mẹo học {lang}.', reaction: 'bashful' },
]

const BOOP_PAYOFF = 120
const BOOP_END = 560
const DIZZY_AFTER = 4
const DIZZY_WINDOW = 1600
const DIZZY_END = 1100
const CUE_MS = 2200
const CUE_DEBOUNCE_MS = 700
const IDLE_MS = 50_000
const STREAK_THRESHOLD = 3
/** Nút hành động hiện lâu hơn lời nói thường: người ta cần kịp đọc rồi bấm. */
const ACTION_MS = 7000
/** Số thẻ tới hạn chỉ hỏi lại sau ngần này — tránh gọi API mỗi lần bấm cáo. */
const DUE_TTL_MS = 120_000
const STORAGE_KEY = 'smu-study-mascot-collapsed'
const GREET_SESSION_KEY = 'smu-mascot-greeted-routes'
const TIP_SESSION_KEY = 'smu-mascot-tip-cursors'

let timers: number[] = []
let lastCueAt = 0
let lastActivityAt = 0
let boops = { count: 0, at: 0 }
/** Con trỏ xoay vòng mẹo, một cái cho mỗi nhóm mẹo. */
let tipCursors: Record<string, number> | null = null
let correctStreak = 0
let hydrated = false
let idleWatchStarted = false
let idleInterval: number | null = null
/** Đã kiểm tra lời chào quay lại trong phiên này chưa. */
let welcomeChecked = false
/** Lời chào quay lại vừa hiện — để lời chào theo trang nhường chỗ. */
let welcomeShown = false
/** Xoay vòng câu khen để không lặp lại ngay. */
let praiseIndex = 0
/** Xoay vòng câu động viên lúc sai. */
let encourageIndex = 0
/** Xoay vòng câu mừng lúc xong một lượt. */
let doneIndex = 0
/** Số thẻ SRS tới hạn, lấy từ `/api/progress/stats`. `null` = chưa biết. */
let dueCount: number | null = null
/** Lần cuối hỏi server về số thẻ tới hạn. */
let dueFetchedAt = 0
/** Số câu sai liên tiếp — để biết khi nào nên khuyên chậm lại. */
let wrongStreak = 0
/**
 * Tiến độ lộ trình hôm nay, do `use-daily-path` đẩy sang.
 *
 * Đẩy một chiều như vậy thay vì cáo tự đọc ngược: `use-daily-path` vốn đã gọi
 * `cue()`, nên nếu cáo import ngược lại sẽ thành vòng tròn module.
 */
let todayState: { done: number; total: number; next: { title: string; to: string } | null } = {
  done: 0,
  total: 0,
  next: null,
}

/** `use-daily-path` gọi mỗi khi tiến độ hôm nay đổi. */
export function reportTodayState(next: typeof todayState) {
  todayState = {
    done: Math.max(0, Math.floor(Number(next?.done) || 0)),
    total: Math.max(0, Math.floor(Number(next?.total) || 0)),
    next: next?.next?.to ? next.next : null,
  }
}

function readTodayState() {
  return todayState
}

/** Tên ngôn ngữ đang học, để chèn vào lời thoại. */
function langLabel(): string {
  try {
    const { currentLanguage } = useLanguage()
    return currentLanguage.value === 'cs' ? 'tiếng Séc' : 'tiếng Đức'
  } catch {
    return 'tiếng Đức'
  }
}

/** Mã ngôn ngữ đang học. */
function langCode(): string {
  try {
    return useLanguage().currentLanguage.value
  } catch {
    return 'de'
  }
}

/** Thay các ô `{lang}` trong lời thoại bằng ngôn ngữ đang học. */
function fillLine(line: string): string {
  return line.includes('{lang}') ? line.replace(/\{lang\}/g, langLabel()) : line
}

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

function later(ms: number, fn: () => void) {
  timers.push(window.setTimeout(fn, ms))
}

/**
 * Con trỏ mẹo sống qua cả phiên. Trước đây nó là biến module reset mỗi lần tải
 * trang, nên mẹo đầu tiên của mỗi nhóm lặp lại mãi — bấm cáo mười lần trong
 * mười lượt vào app vẫn ra đúng một câu.
 */
function readTipCursors(): Record<string, number> {
  if (tipCursors) return tipCursors
  try {
    const raw = sessionStorage.getItem(TIP_SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    tipCursors = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    tipCursors = {}
  }
  return tipCursors!
}

function bumpTipCursor(key: string): number {
  const cursors = readTipCursors()
  const current = Number.isFinite(cursors[key]) ? cursors[key]! : 0
  cursors[key] = current + 1
  try {
    sessionStorage.setItem(TIP_SESSION_KEY, JSON.stringify(cursors))
  } catch {
    /* hết dung lượng: con trỏ chỉ sống trong bộ nhớ, vẫn xoay vòng đúng */
  }
  return current
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
  const action = useState<MascotAction | null>('study-mascot-action', () => null)
  const { mascotEnabled } = useLearningSettings()

  function hydrateCollapsed() {
    if (!import.meta.client || hydrated || !readMascotEnabled()) return
    hydrated = true
    collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
    lastActivityAt = Date.now()
    startIdleWatch()
  }

  function touch() {
    lastActivityAt = Date.now()
  }

  function speak(spec: CueSpec) {
    // Thu nhỏ cáo là người học đang nói "đừng chiếm chỗ". Trước đây `speak` tự
    // bung cáo ra và ghi đè lựa chọn đó vào localStorage, nên thu nhỏ không bao
    // giờ sống qua lần tải trang sau. Giờ bị thu nhỏ thì cáo im hẳn.
    if (collapsed.value) return

    clearTimers()
    touch()
    reaction.value = spec.reaction
    line.value = fillLine(spec.line)
    action.value = spec.action ?? null
    const ms = spec.ms ?? (spec.action ? ACTION_MS : CUE_MS)
    later(ms, () => {
      reaction.value = null
      line.value = null
      action.value = null
    })
  }

  /**
   * Số thẻ SRS tới hạn, có nhớ tạm. Cáo cần con số này để đề nghị việc đúng lúc,
   * nhưng không được hỏi server mỗi lần người dùng bấm vào nó.
   */
  async function refreshDue(force = false): Promise<number> {
    if (!import.meta.client) return 0
    const now = Date.now()
    if (!force && dueCount !== null && now - dueFetchedAt < DUE_TTL_MS) return dueCount
    try {
      const stats: any = await $fetch('/api/progress/stats')
      dueCount = Math.max(0, Number(stats?.dueSrsCount) || 0)
      dueFetchedAt = now
    } catch {
      // Chưa đăng nhập hoặc ngoại tuyến: coi như không có gì tới hạn, cáo im.
      dueCount = dueCount ?? 0
      dueFetchedAt = now
    }
    return dueCount
  }

  /**
   * Việc đáng đề nghị lúc này, hoặc `null`. Đọc trạng thái Today qua tham số để
   * `use-daily-path` không phải phụ thuộc ngược vào composable này.
   */
  function currentAction(): MascotAction | null {
    if (!import.meta.client) return null
    const today = readTodayState()
    return pickAction({
      dueCount: dueCount ?? 0,
      path: window.location.pathname,
      wrongStreak,
      blocksDone: today.done,
      blocksTotal: today.total,
      nextBlock: today.next,
    })
  }

  /** Bấm nút đề nghị: đi tới đó rồi tắt bong bóng. */
  async function runAction() {
    const target = action.value
    if (!target) return
    action.value = null
    line.value = null
    reaction.value = null
    clearTimers()
    await navigateTo(target.to)
  }

  function startIdleWatch() {
    if (!import.meta.client || idleWatchStarted) return
    idleWatchStarted = true

    const tick = () => {
      if (collapsed.value) return
      if (!idleAllowedFor(window.location.pathname)) return
      if (Date.now() - lastActivityAt < IDLE_MS) return
      if (line.value) return
      speak(CUES.idle)
    }

    // Tab ẩn thì dừng hẳn: trước đây interval vẫn chạy 8 giây một lần suốt
    // phiên dù không ai nhìn. Quay lại tab được tính là có hoạt động, nên cáo
    // không buồn ngủ ngay khi người học vừa trở lại.
    const start = () => {
      if (idleInterval) return
      idleInterval = window.setInterval(tick, 8_000)
    }
    const stop = () => {
      if (!idleInterval) return
      window.clearInterval(idleInterval)
      idleInterval = null
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop()
      } else {
        touch()
        start()
      }
    })

    if (!document.hidden) start()
  }

  /**
   * @param extra Lời thay thế, dùng cho `encourage` / `streak` / `tip`.
   * @param sample Dữ liệu chất lượng câu trả lời, chỉ có nghĩa với `correct`.
   */
  function cue(type: StudyCue, extra?: string, sample?: AnswerSample) {
    if (!import.meta.client || !readMascotEnabled()) return
    const now = Date.now()
    if (type === 'correct' || type === 'wrong' || type === 'complete') {
      if (now - lastCueAt < CUE_DEBOUNCE_MS) return
      lastCueAt = now
    }

    if (type === 'correct') {
      correctStreak += 1
      wrongStreak = 0
      if (correctStreak >= STREAK_THRESHOLD && correctStreak % STREAK_THRESHOLD === 0) {
        speak({
          reaction: 'sparkle',
          line: `Chuỗi ${correctStreak} câu đúng! Giữ nhịp này.`,
          ms: 2600,
        })
        return
      }
      // Khen bằng chính ngôn ngữ đang học — mỗi lần đúng là một lần tiếp xúc
      // thêm với tiếng đang học, thay vì chỉ nghe tiếng Việt.
      praiseIndex += 1
      // Đúng-nhanh, đúng-chậm và đúng-sau-khi-sai là ba chuyện khác nhau với
      // SRS; khen y như nhau thì người học không biết câu nào mình chưa chắc.
      const quality = classifyAnswer(sample)
      const tail = qualityTail(quality)
      speak({
        reaction: quality === 'instant' ? 'sparkle' : CUES.correct.reaction,
        line: withGloss(praisePhrase(langCode(), praiseIndex), tail ?? ''),
        ms: tail ? 3000 : undefined,
      })
      return
    }

    if (type === 'wrong') {
      correctStreak = 0
      wrongStreak += 1
      // Vấp liên tiếp thì đổi từ an ủi sang đề nghị việc cụ thể.
      const suggestion = currentAction()
      if (suggestion && wrongStreak >= WRONG_STREAK_LIMIT) {
        wrongStreak = 0
        speak({ reaction: suggestion.reaction, line: suggestion.line, action: suggestion })
        return
      }
      encourageIndex += 1
      speak({
        reaction: CUES.wrong.reaction,
        line: withGloss(
          encouragePhrase(langCode(), encourageIndex),
          'Xem lại đáp án — lỗi cũng là học.',
        ),
      })
      return
    }

    if (type === 'complete') {
      correctStreak = 0
      wrongStreak = 0
      doneIndex += 1
      speak({
        reaction: CUES.complete.reaction,
        line: withGloss(donePhrase(langCode(), doneIndex), 'Xong một lượt.'),
      })
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
      if (extra) {
        speak({ reaction: 'wink', line: extra, ms: 3200 })
      } else {
        askTip()
      }
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

  /**
   * Chào lại khi quay lại sau một thời gian vắng. Chạy một lần mỗi phiên và
   * được ưu tiên hơn lời chào theo trang — người vắng 5 ngày cần nghe điều đó
   * trước, không phải mẹo của trang họ vô tình mở.
   */
  async function welcomeBack() {
    if (!import.meta.client || welcomeChecked || !readMascotEnabled()) return
    welcomeChecked = true

    try {
      const stats: any = await $fetch('/api/progress/stats')
      const today = new Date()
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const w = buildWelcome({
        lastStudyDate: stats?.lastStudyDate ?? null,
        streak: Number(stats?.currentStreak) || 0,
        dueCount: Number(stats?.dueSrsCount) || 0,
        today: todayKey,
      })
      if (!w) return

      // Chào bằng chính ngôn ngữ đang học, luôn kèm nghĩa tiếng Việt.
      const phrase = greetingPhrase(langCode(), today.getHours())
      welcomeShown = true

      // Lời chào quay lại là lúc đắt nhất để mời làm việc đầu tiên: người học
      // vừa mở app và chưa chọn gì cả.
      dueCount = Number(stats?.dueSrsCount) || 0
      dueFetchedAt = Date.now()
      const suggestion = currentAction()

      speak({
        reaction: w.reaction,
        line: withGloss(phrase, w.line),
        ms: suggestion ? ACTION_MS : 4200,
        action: suggestion,
      })
    } catch {
      /* chưa đăng nhập hoặc ngoại tuyến: bỏ qua, không phiền người dùng */
    }
  }

  function greetForPath(path: string) {
    if (!import.meta.client || collapsed.value || !readMascotEnabled()) return
    const hit = ROUTE_GREETS.find((r) => r.match.test(path))
    if (!hit) return
    const key = hit.match.source
    if (greetedSet().has(key)) return
    markGreeted(key)
    // Small delay so the page paints first
    later(500, () => {
      // Lời chào quay lại vừa hiện thì nhường chỗ, đừng nói chồng.
      if (welcomeShown) {
        welcomeShown = false
        return
      }
      speak({ reaction: hit.reaction, line: hit.line, ms: 3000 })
    })
  }

  /** Click the fox. Returns true when the squash animation should play. */
  function boop() {
    if (!import.meta.client || !readMascotEnabled()) return false
    touch()

    const now = Date.now()
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1
    boops.at = now

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0
      clearTimers()
      reaction.value = 'dizzy'
      line.value = 'Ui chóng mặt quá!'
      action.value = null
      later(DIZZY_END, () => {
        reaction.value = null
        line.value = null
      })
    } else {
      // Bấm cáo trả về mẹo học thay vì chỉ nhấp nháy cho vui. Ưu tiên mẹo của
      // trang đang đứng — trước đây luôn lấy từ danh sách mẹo chung nên bấm ở
      // màn chép chính tả hay màn ôn SRS đều ra cùng một câu.
      const suggestion = currentAction()
      const payload = suggestion
        ? { reaction: suggestion.reaction, line: suggestion.line, action: suggestion }
        : { ...pickTip(), action: null }

      clearTimers()
      reaction.value = 'blink'
      later(BOOP_PAYOFF, () => {
        reaction.value = payload.reaction
        line.value = payload.line
        action.value = payload.action
      })
      later(payload.action ? ACTION_MS : Math.max(BOOP_END, 2600), () => {
        reaction.value = null
        line.value = null
        action.value = null
      })
      // Làm mới số thẻ tới hạn cho lần bấm sau, không chặn lần này.
      void refreshDue()
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /** Mẹo kế tiếp: của trang đang đứng nếu có, không thì mẹo chung. */
  function pickTip(): { reaction: MascotReaction; line: string } {
    const { key, tips } = tipPoolFor(window.location.pathname)
    return tips[bumpTipCursor(key) % tips.length]!
  }

  /**
   * Bấm "Mẹo". Có việc đáng làm ngay thì đề nghị việc kèm nút — hữu ích hơn một
   * câu khuyên chung. Không có thì quay về mẹo của trang đang đứng.
   */
  function askTip() {
    if (!import.meta.client || !readMascotEnabled()) return

    // Trả lời ngay bằng dữ liệu đang có. Trước đây hàm này chờ `refreshDue()`
    // xong mới nói, nên khi mạng chậm — hoặc khi `/api/progress/stats` hỏng lúc
    // chưa đăng nhập — bấm nút Mẹo không ra phản hồi nào.
    const suggestion = currentAction()
    if (suggestion) {
      speak({ reaction: suggestion.reaction, line: suggestion.line, action: suggestion })
    } else {
      const tip = pickTip()
      speak({ reaction: tip.reaction, line: tip.line, ms: 3200 })
    }

    // Làm mới cho lần bấm sau, không chặn lần này.
    void refreshDue()
  }

  function setCollapsed(next: boolean) {
    collapsed.value = next
    touch()
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    }
  }

  return {
    reaction,
    line,
    collapsed,
    action,
    enabled: mascotEnabled,
    cue,
    runAction,
    refreshDue,
    boop,
    askTip,
    greetForPath,
    welcomeBack,
    setCollapsed,
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
