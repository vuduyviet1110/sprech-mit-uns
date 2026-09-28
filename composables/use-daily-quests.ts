import { computed, ref } from 'vue'

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
  claimed: Record<DailyQuestId, boolean>
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

const emptyClaimed = (): Record<DailyQuestId, boolean> => ({
  memory_pairs: false,
  speed_combo: false,
  story_scenario: false,
  srs_reviews: false,
  shadowing_session: false,
  recall_sentences: false,
})

const progressMap = ref<Record<DailyQuestId, number>>(emptyProgress())
const claimedMap = ref<Record<DailyQuestId, boolean>>(emptyClaimed())
const serverXp = ref(0)
const loaded = ref(false)
let syncTimer: ReturnType<typeof setTimeout> | null = null

const getSrsTarget = () => {
  let srsTarget = 20
  try {
    if (import.meta.client) {
      const raw = localStorage.getItem('app_learning_settings_v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.dailyReviewTarget === 'number' && parsed.dailyReviewTarget > 0) {
          srsTarget = parsed.dailyReviewTarget
        }
      }
    }
  } catch {
    // keep default
  }
  return srsTarget
}

const persistLocal = () => {
  if (!import.meta.client) return
  const payload: StoredState = {
    date: todayKey(),
    progress: { ...progressMap.value },
    claimed: { ...claimedMap.value },
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
        body: {
          userId: uid,
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
      claimedMap.value = emptyClaimed()
    } else {
      const parsed = JSON.parse(raw) as StoredState
      if (parsed.date !== todayKey()) {
        progressMap.value = emptyProgress()
        claimedMap.value = emptyClaimed()
      } else {
        progressMap.value = { ...emptyProgress(), ...parsed.progress }
        claimedMap.value = { ...emptyClaimed(), ...parsed.claimed }
      }
    }
  } catch {
    progressMap.value = emptyProgress()
    claimedMap.value = emptyClaimed()
  }

  // Merge from server (max wins)
  try {
    const uid = getSessionUserId()
    if (!uid) throw new Error('unauthenticated')
    const res = await $fetch<{
      xp: number
      questProgress: Record<string, number>
    }>(`/api/daily/progress?userId=${uid}&date=${todayKey()}`)
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
    const res = await $fetch<{ xp: number }>('/api/daily/progress', {
      method: 'POST',
      body: { userId: uid, date: todayKey(), xpDelta: amount },
    })
    if (typeof res?.xp === 'number') serverXp.value = res.xp
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
