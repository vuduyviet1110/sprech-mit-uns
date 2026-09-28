import { computed, ref } from 'vue'

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
const SETTINGS_STORAGE_KEY = 'app_learning_settings_v1'
const DEFAULT_REVIEW_TARGET = 20

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

interface LearningSettings {
  dailyReviewTarget: number
  primaryLang: string
  speechRate: number
  dailyReminder: boolean
  autoPlayAudio: boolean
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
      await $fetch('/api/daily/progress', {
        method: 'POST',
        body: {
          userId: uid,
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
    }>(`/api/daily/progress?userId=${uid}&date=${todayKey()}`)
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

const settings = ref<LearningSettings>({
  dailyReviewTarget: DEFAULT_REVIEW_TARGET,
  primaryLang: 'de',
  speechRate: 0.85,
  dailyReminder: true,
  autoPlayAudio: true,
})
const settingsLoaded = ref(false)

const persistSettings = () => {
  if (!import.meta.client) return
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  // Also persist to DB (fire-and-forget)
  const uid = getSessionUserId()
  if (!uid) return
  void $fetch('/api/settings', {
    method: 'POST',
    body: {
      userId: uid,
      ...settings.value,
    },
  }).catch(() => {})
}

const ensureSettingsLoaded = () => {
  if (!settingsLoaded.value) void loadSettings()
}

const loadSettings = async () => {
  if (!import.meta.client) return
  // Local first
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LearningSettings>
      settings.value = {
        dailyReviewTarget:
          typeof parsed.dailyReviewTarget === 'number' && parsed.dailyReviewTarget > 0
            ? parsed.dailyReviewTarget
            : DEFAULT_REVIEW_TARGET,
        primaryLang: parsed.primaryLang || 'de',
        speechRate: typeof parsed.speechRate === 'number' ? parsed.speechRate : 0.85,
        dailyReminder: parsed.dailyReminder !== false,
        autoPlayAudio: parsed.autoPlayAudio !== false,
      }
    }
  } catch {
    // keep defaults
  }

  // Prefer server if available
  try {
    const uid = getSessionUserId()
    if (!uid) throw new Error('unauthenticated')
    const res = await $fetch<LearningSettings & { persisted?: boolean }>(
      `/api/settings?userId=${uid}`,
    )
    if (res?.persisted) {
      settings.value = {
        dailyReviewTarget: res.dailyReviewTarget || DEFAULT_REVIEW_TARGET,
        primaryLang: res.primaryLang || 'de',
        speechRate: typeof res.speechRate === 'number' ? res.speechRate : 0.85,
        dailyReminder: res.dailyReminder !== false,
        autoPlayAudio: res.autoPlayAudio !== false,
      }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
    }
  } catch {
    // offline
  }

  settingsLoaded.value = true
}

const markBlockComplete = (id: DailyPathBlockId) => {
  ensurePathLoaded()
  if (completedMap.value[id]) return
  completedMap.value = { ...completedMap.value, [id]: true }
  persistPath()
}

const recordSrsReview = (count = 1) => {
  ensurePathLoaded()
  ensureSettingsLoaded()
  srsReviewedCount.value += count
  const target = settings.value.dailyReviewTarget
  if (srsReviewedCount.value >= target) {
    completedMap.value = { ...completedMap.value, srs: true }
  }
  persistPath()
}

const setDailyReviewTarget = (n: number) => {
  ensureSettingsLoaded()
  settings.value = {
    ...settings.value,
    dailyReviewTarget: Math.max(1, Math.min(200, Math.round(n) || DEFAULT_REVIEW_TARGET)),
  }
  persistSettings()
}

const saveLearningSettings = (partial: Partial<LearningSettings>) => {
  ensureSettingsLoaded()
  settings.value = { ...settings.value, ...partial }
  if (typeof partial.dailyReviewTarget === 'number') {
    settings.value.dailyReviewTarget = Math.max(
      1,
      Math.min(200, Math.round(partial.dailyReviewTarget) || DEFAULT_REVIEW_TARGET),
    )
  }
  persistSettings()
}

const dailyReviewTarget = computed(() => {
  ensureSettingsLoaded()
  return settings.value.dailyReviewTarget
})

const srsTodayProgress = computed(() => {
  ensurePathLoaded()
  ensureSettingsLoaded()
  const target = settings.value.dailyReviewTarget
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

export function useDailyPath() {
  ensurePathLoaded()
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
