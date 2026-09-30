import { computed, ref } from 'vue'
import { useSession } from '~/composables/use-session'
import {
  applyDrillFailure,
  applyDrillSuccess,
  drillDueDate,
  drillItemKey,
} from '~/utils/pronunciation-schedule'

export interface PronunciationDrillItem {
  id: string
  word: string
  phrase: string
  language: string
  tip?: string
  failCount: number
  /** Số lần đúng liên tiếp — quyết định giãn cách 1 → 3 → 7 ngày. */
  successStreak?: number
  lastFailedAt: string
  nextDueAt: string
}

const STORAGE_KEY = 'pronunciation_drill_v1'
/** Đánh dấu đã đẩy dữ liệu localStorage cũ lên server, để chỉ làm một lần. */
const MIGRATED_KEY = 'smu_drill_migrated_v1'

const items = ref<PronunciationDrillItem[]>([])
const loaded = ref(false)
const syncing = ref(false)
/** Đã đồng bộ với server trong phiên này chưa. */
let syncedOnce = false

const todayIso = () => new Date().toISOString()

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

/** localStorage giờ là bộ đệm offline, không còn là nguồn sự thật. */
const persist = () => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  } catch {
    /* hết dung lượng: vẫn chạy được trong phiên */
  }
}

const ensure = () => {
  if (!loaded.value) load()
}

/**
 * Lịch ôn giãn cách: 1 → 3 → 7 ngày khi đúng, sai thì đến hạn lại ngay.
 *
 * Local-first: đọc localStorage đồng bộ để first paint nhanh và để chưa đăng nhập
 * vẫn luyện được, sau đó đồng bộ với server. Mọi thao tác ghi lạc quan tại chỗ rồi
 * mới gọi API; API trả về toàn bộ danh sách nên không phải hoà giải hai nguồn.
 */
export function usePronunciationDrill() {
  ensure()

  const { userId } = useSession()

  const applyServerItems = (list: unknown) => {
    if (!Array.isArray(list)) return
    items.value = list as PronunciationDrillItem[]
    persist()
  }

  /** Gọi API và thay danh sách. Lỗi thì nuốt — trạng thái cục bộ vẫn đứng vững. */
  const post = async (body: Record<string, unknown>) => {
    if (!import.meta.client || !userId.value) return
    try {
      const res: any = await $fetch('/api/practice/drill', {
        method: 'POST',
        body,
      })
      applyServerItems(res?.items)
    } catch {
      /* ngoại tuyến hoặc chưa đăng nhập: giữ nguyên bản cục bộ */
    }
  }

  /** Kéo dữ liệu từ server, kèm một lần đẩy dữ liệu cũ lên nếu có. */
  const syncFromServer = async () => {
    if (!import.meta.client || !userId.value || syncing.value) return
    syncing.value = true
    try {
      const alreadyMigrated = localStorage.getItem(MIGRATED_KEY) === '1'
      if (!alreadyMigrated && items.value.length > 0) {
        await post({ action: 'import', items: items.value })
        // Giữ key cũ làm bản sao lạnh một release rồi mới dọn.
        localStorage.setItem(MIGRATED_KEY, '1')
      } else {
        const res: any = await $fetch('/api/practice/drill')
        applyServerItems(res?.items)
      }
      syncedOnce = true
    } catch {
      /* giữ bản cục bộ */
    } finally {
      syncing.value = false
    }
  }

  if (import.meta.client && userId.value && !syncedOnce) {
    void syncFromServer()
  }

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
      (a, b) =>
        new Date(b.lastFailedAt).getTime() - new Date(a.lastFailedAt).getTime(),
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
      const key = drillItemKey(language, d.word, d.phrase)
      const existing = next.find((i) => i.id === key)
      const state = applyDrillFailure(existing)
      if (existing) {
        existing.failCount = state.failCount
        existing.successStreak = state.successStreak
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
          failCount: state.failCount,
          successStreak: state.successStreak,
          lastFailedAt: todayIso(),
          nextDueAt: todayIso(),
        })
      }
    }
    items.value = next
    persist()

    // Trước đây mỗi từ nhại lệch — kể cả hư từ như "der", "und" — đều tạo một
    // thẻ SRS ở quality 2, trong khi lần đúng không bao giờ báo lại. Kho từ vựng
    // bị nhiễu bởi lỗi phát âm. Drill có bảng riêng rồi nên bỏ hẳn nhánh đó.
    void post({ action: 'fail', language, items: drillItems })
  }

  const markSuccess = (id: string) => {
    ensure()
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    const next = applyDrillSuccess({
      failCount: item.failCount,
      successStreak: item.successStreak ?? 0,
    })
    item.failCount = next.failCount
    item.successStreak = next.successStreak
    item.nextDueAt = drillDueDate(next.intervalDays).toISOString()
    persist()

    void post({ action: 'success', id })
  }

  const removeItem = (id: string) => {
    ensure()
    items.value = items.value.filter((i) => i.id !== id)
    persist()
    void post({ action: 'remove', id })
  }

  const clearAll = () => {
    items.value = []
    persist()
    void post({ action: 'clear' })
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
    syncFromServer,
  }
}
