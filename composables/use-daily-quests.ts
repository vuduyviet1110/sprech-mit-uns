import { computed, ref } from 'vue'
import { readDailyReviewTarget } from '~/composables/use-learning-settings'

export type DailyQuestId =
  | 'memory_pairs'
  | 'speed_combo'
  | 'story_scenario'
  | 'srs_reviews'
  | 'shadowing_session'
  | 'recall_sentences'

export interface DailyQuest {
  id: DailyQuestId
  title: string
  reward: string
  progress: number
  total: number
  completed: boolean
  xpReward: number
}

const STORAGE_KEY = 'daily_quests_v2'

const getSessionUserId = (): string | null => {
  try {
    const { userId } = useSession()
    return userId.value
  } catch {
    return null
  }
}

const QUEST_DEFS: Omit<DailyQuest, 'progress' | 'completed'>[] = [
  {
    id: 'srs_reviews',
    title: 'Ôn đủ chỉ tiêu thẻ SRS trong ngày',
    reward: '+60 XP',
    total: 20,
    xpReward: 60,
  },
  {
    id: 'shadowing_session',
    title: 'Hoàn thành 1 phiên Shadowing',
    reward: '+70 XP',
    total: 1,
    xpReward: 70,
  },
  {
    id: 'recall_sentences',
    title: 'Viết ≥3 câu Active Recall',
    reward: '+80 XP',
    total: 3,
    xpReward: 80,
  },
  {
    id: 'memory_pairs',
    title: 'Ghép thành công 8 cặp từ vựng',
    reward: '+50 XP',
    total: 8,
    xpReward: 50,
  },
  {
    id: 'speed_combo',
    title: 'Đạt chuỗi Combo x3 ở Đấu trường 60s',
    reward: '+100 XP',
    total: 3,
    xpReward: 100,
  },
  {
    id: 'story_scenario',
    title: 'Hoàn thành 1 kịch bản giao tiếp',
    reward: '+80 XP',
    total: 1,
    xpReward: 80,
  },
]

interface StoredState {
  date: string
  progress: Record<DailyQuestId, number>
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const emptyProgress = (): Record<DailyQuestId, number> => ({
  memory_pairs: 0,
  speed_combo: 0,
  story_scenario: 0,
  srs_reviews: 0,
  shadowing_session: 0,
  recall_sentences: 0,
})

const progressMap = ref<Record<DailyQuestId, number>>(emptyProgress())
const serverXp = ref(0)
const loaded = ref(false)
let syncTimer: ReturnType<typeof setTimeout> | null = null
/** Chuỗi ngày đã báo trong phiên này, để không nhắc lặp. */
let lastNotifiedStreak = 0

// Trước đây hàm này đọc thẳng localStorage key của `use-daily-path`. Giờ hỏi
// đúng chủ sở hữu thiết lập, nên đổi cách lưu trữ ở đó không làm gãy chỗ này.
const getSrsTarget = () => readDailyReviewTarget()

const persistLocal = () => {
  if (!import.meta.client) return
  const payload: StoredState = {
    date: todayKey(),
    progress: { ...progressMap.value },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const syncToServer = () => {
  if (!import.meta.client) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      const uid = getSessionUserId()
      if (!uid) return
      const res = await $fetch<{ xp: number }>('/api/daily/progress', {
        method: 'POST',
        // Không gửi userId: server lấy danh tính từ phiên httpOnly.
        body: {
          date: todayKey(),
          questProgress: { ...progressMap.value },
        },
      })
      if (typeof res?.xp === 'number') serverXp.value = res.xp
    } catch (e) {
      console.warn('daily quests sync failed', e)
    }
  }, 400)
}

const persist = () => {
  persistLocal()
  syncToServer()
}

const loadState = async () => {
  if (!import.meta.client) return
  // Local first
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('daily_quests_v1')
    if (!raw) {
      progressMap.value = emptyProgress()
    } else {
      const parsed = JSON.parse(raw) as StoredState
      progressMap.value =
        parsed.date !== todayKey()
          ? emptyProgress()
          : { ...emptyProgress(), ...parsed.progress }
    }
  } catch {
    progressMap.value = emptyProgress()
  }

  // Merge from server (max wins)
  try {
    const uid = getSessionUserId()
    if (!uid) throw new Error('unauthenticated')
    const res = await $fetch<{
      xp: number
      questProgress: Record<string, number>
    }>(`/api/daily/progress?date=${todayKey()}`)
    serverXp.value = res.xp || 0
    const serverQ = res.questProgress || {}
    const merged = emptyProgress()
    for (const id of Object.keys(merged) as DailyQuestId[]) {
      merged[id] = Math.max(progressMap.value[id] || 0, Number(serverQ[id] || 0))
    }
    progressMap.value = merged
    persistLocal()
  } catch {
    // offline: keep local
  }

  loaded.value = true
}

const ensureLoaded = () => {
  if (!loaded.value) {
    loaded.value = true
    void loadState()
  }
}

const dailyQuests = computed<DailyQuest[]>(() => {
  ensureLoaded()
  const srsTarget = getSrsTarget()
  return QUEST_DEFS.map((def) => {
    const total = def.id === 'srs_reviews' ? srsTarget : def.total
    const progress = Math.min(progressMap.value[def.id] || 0, total)
    return {
      ...def,
      total,
      progress,
      completed: progress >= total,
    }
  })
})

const setProgress = (id: DailyQuestId, value: number) => {
  ensureLoaded()
  const def = QUEST_DEFS.find((q) => q.id === id)
  if (!def) return
  const total = id === 'srs_reviews' ? getSrsTarget() : def.total
  const next = Math.max(progressMap.value[id] || 0, Math.min(value, total))
  if (next === progressMap.value[id]) return
  const wasComplete = (progressMap.value[id] || 0) >= total
  progressMap.value = { ...progressMap.value, [id]: next }
  persist()
  // award XP once when completing
  if (!wasComplete && next >= total) {
    void awardXp(def.xpReward)
  }
}

const addProgress = (id: DailyQuestId, amount: number) => {
  ensureLoaded()
  const def = QUEST_DEFS.find((q) => q.id === id)
  if (!def) return
  const total = id === 'srs_reviews' ? getSrsTarget() : def.total
  const current = progressMap.value[id] || 0
  if (current >= total) return
  const next = Math.min(current + amount, total)
  progressMap.value = { ...progressMap.value, [id]: next }
  persist()
  if (current < total && next >= total) {
    void awardXp(def.xpReward)
  }
}

const awardXp = async (amount: number) => {
  if (!import.meta.client || amount <= 0) return
  try {
    const uid = getSessionUserId()
    if (!uid) return
    const res = await $fetch<{ xp: number; studyStreak?: number }>(
      '/api/daily/progress',
      { method: 'POST', body: { date: todayKey(), xpDelta: amount } },
    )
    if (typeof res?.xp === 'number') serverXp.value = res.xp

    // Server vẫn luôn trả `studyStreak` nhưng client chưa bao giờ đọc, nên
    // chuỗi ngày học — mốc có sức nặng nhất — trôi qua không ai nhắc.
    const streak = Number(res?.studyStreak)
    if (Number.isFinite(streak) && streak >= 2 && streak !== lastNotifiedStreak) {
      lastNotifiedStreak = streak
      useStudyMascot().cue('streak', `Ngày thứ ${streak} liên tiếp. Đừng đứt nhé!`)
    }
  } catch {
    // ignore
  }
}

export function syncSrsQuestTotal(target: number) {
  const def = QUEST_DEFS.find((q) => q.id === 'srs_reviews')
  if (def && target > 0) def.total = target
}

export function recordMemoryPairMatch(count = 1) {
  addProgress('memory_pairs', count)
}

export function recordSpeedCombo(combo: number) {
  if (combo < 1) return
  setProgress('speed_combo', Math.min(combo, 3))
}

export function recordStoryScenarioComplete() {
  setProgress('story_scenario', 1)
}

export function recordSrsReviewQuest(count = 1) {
  addProgress('srs_reviews', count)
}

export function recordShadowingSessionComplete() {
  setProgress('shadowing_session', 1)
}

export function recordRecallSentences(count = 1) {
  addProgress('recall_sentences', count)
}

export function useDailyQuests() {
  ensureLoaded()

  return {
    dailyQuests,
    serverXp,
    recordMemoryPairMatch,
    recordSpeedCombo,
    recordStoryScenarioComplete,
    recordSrsReviewQuest,
    recordShadowingSessionComplete,
    recordRecallSentences,
    syncSrsQuestTotal,
    reload: loadState,
    awardXp,
  }
}
