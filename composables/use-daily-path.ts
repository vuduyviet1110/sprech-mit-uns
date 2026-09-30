import { computed, ref, watch } from 'vue'
import {
  readDailyReviewTarget,
  useLearningSettings,
} from '~/composables/use-learning-settings'

export type DailyPathBlockId = 'srs' | 'shadowing' | 'recall'

export interface DailyPathBlock {
  id: DailyPathBlockId
  title: string
  subtitle: string
  durationMin: number
  to: string
  icon: string
  completed: boolean
}

const PATH_STORAGE_KEY = 'daily_path_v1'

const getSessionUserId = (): string | null => {
  try {
    const { userId } = useSession()
    return userId.value
  } catch {
    return null
  }
}

interface PathStoredState {
  date: string
  completed: Record<DailyPathBlockId, boolean>
  srsReviewedCount: number
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const emptyCompleted = (): Record<DailyPathBlockId, boolean> => ({
  srs: false,
  shadowing: false,
  recall: false,
})

const completedMap = ref<Record<DailyPathBlockId, boolean>>(emptyCompleted())
const srsReviewedCount = ref(0)
const pathLoaded = ref(false)
let pathSyncTimer: ReturnType<typeof setTimeout> | null = null

const syncPathToServer = () => {
  if (!import.meta.client) return
  if (pathSyncTimer) clearTimeout(pathSyncTimer)
  pathSyncTimer = setTimeout(async () => {
    try {
      const uid = getSessionUserId()
      if (!uid) return
      // Không gửi userId: server lấy danh tính từ phiên httpOnly và bỏ qua
      // giá trị client gửi lên (có test chốt chính sách này).
      await $fetch('/api/daily/progress', {
        method: 'POST',
        body: {
          date: todayKey(),
          pathCompleted: { ...completedMap.value },
          srsReviewedCount: srsReviewedCount.value,
        },
      })
    } catch (e) {
      console.warn('daily path sync failed', e)
    }
  }, 400)
}

const loadPath = async () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(PATH_STORAGE_KEY)
    if (!raw) {
      completedMap.value = emptyCompleted()
      srsReviewedCount.value = 0
    } else {
      const parsed = JSON.parse(raw) as PathStoredState
      if (parsed.date !== todayKey()) {
        completedMap.value = emptyCompleted()
        srsReviewedCount.value = 0
      } else {
        completedMap.value = { ...emptyCompleted(), ...parsed.completed }
        srsReviewedCount.value = parsed.srsReviewedCount || 0
      }
    }
  } catch {
    completedMap.value = emptyCompleted()
    srsReviewedCount.value = 0
  }

  try {
    const uid = getSessionUserId()
    if (!uid) throw new Error('unauthenticated')
    const res = await $fetch<{
      pathCompleted: Record<string, boolean>
      srsReviewedCount: number
    }>(`/api/daily/progress?date=${todayKey()}`)
    const serverPath = res.pathCompleted || {}
    completedMap.value = {
      srs: !!(completedMap.value.srs || serverPath.srs),
      shadowing: !!(completedMap.value.shadowing || serverPath.shadowing),
      recall: !!(completedMap.value.recall || serverPath.recall),
    }
    srsReviewedCount.value = Math.max(
      srsReviewedCount.value,
      Number(res.srsReviewedCount || 0),
    )
  } catch {
    // offline
  }

  persistPathLocal()
  pathLoaded.value = true
}

const persistPathLocal = () => {
  if (!import.meta.client) return
  const payload: PathStoredState = {
    date: todayKey(),
    completed: { ...completedMap.value },
    srsReviewedCount: srsReviewedCount.value,
  }
  localStorage.setItem(PATH_STORAGE_KEY, JSON.stringify(payload))
}

const persistPath = () => {
  persistPathLocal()
  syncPathToServer()
}

const ensurePathLoaded = () => {
  if (!pathLoaded.value) {
    pathLoaded.value = true
    void loadPath()
  }
}

// Thiết lập học tập đã tách sang `use-learning-settings` — ở đó DB là nguồn sự
// thật và localStorage chỉ là bộ đệm. Trước đây khối này nằm lẫn trong file
// lộ trình, còn `use-daily-quests` thì thò tay đọc thẳng localStorage key của
// nó, nên sửa một chỗ là gãy chỗ kia.

const BLOCK_NAMES: Record<DailyPathBlockId, string> = {
  srs: 'Ôn SRS',
  shadowing: 'Shadowing',
  recall: 'Active Recall',
}

const markBlockComplete = (id: DailyPathBlockId) => {
  ensurePathLoaded()
  if (completedMap.value[id]) return
  completedMap.value = { ...completedMap.value, [id]: true }
  persistPath()

  // Cáo đồng hành từng chỉ biết đúng/sai từng câu, im lặng đúng lúc người học
  // vừa xong cả một khối — tức là khoảnh khắc đáng ghi nhận nhất.
  const done = Object.values(completedMap.value).filter(Boolean).length
  const total = Object.keys(completedMap.value).length
  const { cue } = useStudyMascot()
  cue(
    'streak',
    done >= total
      ? `Xong cả ${total} khối hôm nay. Nghỉ được rồi!`
      : `Xong khối ${BLOCK_NAMES[id]}. Còn ${total - done} khối nữa.`,
  )
}

const recordSrsReview = (count = 1) => {
  ensurePathLoaded()
  const before = srsReviewedCount.value
  srsReviewedCount.value += count
  const target = readDailyReviewTarget()
  if (srsReviewedCount.value >= target) {
    // Chỉ mừng đúng một lần, ở đúng thẻ vừa chạm chỉ tiêu. `markBlockComplete`
    // tự thoát sớm nếu khối đã xong nên không nói chồng lời.
    if (before < target) {
      useStudyMascot().cue('encourage', `Đủ ${target} thẻ hôm nay rồi!`)
    }
    markBlockComplete('srs')
  }
  persistPath()
}

const srsTodayProgress = computed(() => {
  ensurePathLoaded()
  const target = readDailyReviewTarget()
  return {
    count: srsReviewedCount.value,
    target,
    pct: Math.min(100, Math.round((srsReviewedCount.value / target) * 100)),
    done: srsReviewedCount.value >= target || completedMap.value.srs,
  }
})

const pathBlocks = computed<DailyPathBlock[]>(() => {
  ensurePathLoaded()
  return [
    {
      id: 'srs',
      title: 'Sáng — Ôn Flashcard SRS',
      subtitle: 'Spaced repetition · lật thẻ & tự chấm',
      durationMin: 15,
      to: '/review',
      icon: 'lucide:brain',
      completed: completedMap.value.srs,
    },
    {
      id: 'shadowing',
      title: 'Trưa — Shadowing hội thoại',
      subtitle: 'Nghe bản xứ → nhại lại ngay',
      durationMin: 20,
      to: '/practice/shadowing',
      icon: 'lucide:mic',
      completed: completedMap.value.shadowing,
    },
    {
      id: 'recall',
      title: 'Tối — Active Recall viết câu',
      subtitle: 'Tự viết 3–5 câu từ trí nhớ',
      durationMin: 15,
      to: '/practice/recall',
      icon: 'lucide:pen-line',
      completed: completedMap.value.recall,
    },
  ]
})

const pathCompletionCount = computed(
  () => pathBlocks.value.filter((b) => b.completed).length,
)

/**
 * Đẩy tiến độ hôm nay sang cáo để nó biết mời khối kế tiếp.
 *
 * Đẩy một chiều: cáo không import ngược file này (file này đã gọi `cue()`, nếu
 * hai bên import nhau sẽ thành vòng tròn module).
 */
watch(
  pathBlocks,
  (blocks) => {
    if (!import.meta.client) return
    const next = blocks.find((b) => !b.completed) ?? null
    reportTodayState({
      done: blocks.filter((b) => b.completed).length,
      total: blocks.length,
      next: next ? { title: next.title, to: next.to } : null,
    })
  },
  { immediate: true, deep: true },
)

export function useDailyPath() {
  ensurePathLoaded()

  // Re-export thiết lập để các trang đang dùng `useDailyPath()` không phải sửa.
  // Gọi trong hàm chứ không ở module scope: `useLearningSettings` dùng
  // `useSession()`, vốn cần Nuxt context.
  const {
    settings,
    dailyReviewTarget,
    load: loadSettings,
    ensureLoaded: ensureSettingsLoaded,
    saveSettings: saveLearningSettings,
    setDailyReviewTarget,
  } = useLearningSettings()

  ensureSettingsLoaded()

  return {
    pathBlocks,
    pathCompletionCount,
    markBlockComplete,
    recordSrsReview,
    srsTodayProgress,
    dailyReviewTarget,
    setDailyReviewTarget,
    settings,
    saveLearningSettings,
    loadSettings,
    reloadPath: loadPath,
  }
}
