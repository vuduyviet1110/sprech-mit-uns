import { computed, ref } from 'vue'

export interface PronunciationDrillItem {
  id: string
  word: string
  phrase: string
  language: string
  tip?: string
  failCount: number
  lastFailedAt: string
  nextDueAt: string
}

const STORAGE_KEY = 'pronunciation_drill_v1'

const items = ref<PronunciationDrillItem[]>([])
const loaded = ref(false)

const todayIso = () => new Date().toISOString()

const addDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const load = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    items.value = raw ? (JSON.parse(raw) as PronunciationDrillItem[]) : []
  } catch {
    items.value = []
  }
  loaded.value = true
}

const persist = () => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

const ensure = () => {
  if (!loaded.value) load()
}

/** Spaced intervals after success: 0 → 1 → 3 → 7 days; fail resets to due now. */
export function usePronunciationDrill() {
  ensure()

  const dueItems = computed(() => {
    ensure()
    const now = Date.now()
    return items.value
      .filter((i) => new Date(i.nextDueAt).getTime() <= now)
      .sort((a, b) => b.failCount - a.failCount)
  })

  const allItems = computed(() => {
    ensure()
    return [...items.value].sort(
      (a, b) => new Date(b.lastFailedAt).getTime() - new Date(a.lastFailedAt).getTime(),
    )
  })

  const addFailures = (
    drillItems: { word: string; phrase: string; tip?: string }[],
    language: string,
  ) => {
    ensure()
    if (!drillItems.length) return
    const next = [...items.value]
    for (const d of drillItems) {
      const key = `${language}::${d.word.toLowerCase()}::${d.phrase.slice(0, 40)}`
      const existing = next.find((i) => i.id === key)
      if (existing) {
        existing.failCount += 1
        existing.lastFailedAt = todayIso()
        existing.nextDueAt = todayIso()
        if (d.tip) existing.tip = d.tip
      } else {
        next.push({
          id: key,
          word: d.word,
          phrase: d.phrase,
          language,
          tip: d.tip,
          failCount: 1,
          lastFailedAt: todayIso(),
          nextDueAt: todayIso(),
        })
      }
    }
    items.value = next
    persist()

    // Also enqueue into server SM-2 queue (quality 2 = forgot)
    if (typeof window !== 'undefined') {
      for (const d of drillItems) {
        $fetch('/api/srs/review', {
          method: 'POST',
          body: {
            wordId: d.word,
            quality: 2,
            lang: language,
            meaning: d.tip || undefined,
            example: d.phrase,
          },
        }).catch(() => {
          /* local drill still works offline */
        })
      }
    }
  }

  const markSuccess = (id: string) => {
    ensure()
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    // Success spaces out: 1d then 3d then 7d based on failCount reduction
    item.failCount = Math.max(0, item.failCount - 1)
    const days = item.failCount >= 2 ? 1 : item.failCount === 1 ? 3 : 7
    item.nextDueAt = addDays(days)
    persist()
  }

  const removeItem = (id: string) => {
    ensure()
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  const clearAll = () => {
    items.value = []
    persist()
  }

  return {
    items: allItems,
    dueItems,
    dueCount: computed(() => dueItems.value.length),
    addFailures,
    markSuccess,
    removeItem,
    clearAll,
    reload: load,
  }
}
