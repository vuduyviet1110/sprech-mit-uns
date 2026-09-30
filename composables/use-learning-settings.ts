import { computed, ref } from 'vue'
import { useSession } from '~/composables/use-session'

export interface LearningSettings {
  dailyReviewTarget: number
  primaryLang: string
  speechRate: number
  dailyReminder: boolean
  autoPlayAudio: boolean
  /** Hiện cáo đồng hành. Tắt = không mount, không tải sprite. */
  mascot: boolean
}

const STORAGE_KEY = 'app_learning_settings_v1'
export const DEFAULT_REVIEW_TARGET = 20

const DEFAULTS: LearningSettings = {
  dailyReviewTarget: DEFAULT_REVIEW_TARGET,
  primaryLang: 'de',
  speechRate: 0.85,
  dailyReminder: true,
  autoPlayAudio: true,
  mascot: true,
}

const settings = ref<LearningSettings>({ ...DEFAULTS })
const loaded = ref(false)
let inflight: Promise<void> | null = null
/** Đã nạp thành công cho user nào. `null` = chưa nạp được từ server. */
let loadedFor: string | null = null

const normalize = (raw: Partial<LearningSettings> | null | undefined) => ({
  dailyReviewTarget:
    typeof raw?.dailyReviewTarget === 'number' && raw.dailyReviewTarget > 0
      ? Math.max(1, Math.min(200, Math.round(raw.dailyReviewTarget)))
      : DEFAULTS.dailyReviewTarget,
  primaryLang: raw?.primaryLang === 'cs' ? 'cs' : 'de',
  speechRate:
    typeof raw?.speechRate === 'number'
      ? Math.max(0.5, Math.min(1.5, raw.speechRate))
      : DEFAULTS.speechRate,
  dailyReminder: raw?.dailyReminder !== false,
  autoPlayAudio: raw?.autoPlayAudio !== false,
  mascot: raw?.mascot !== false,
})

const readCache = (): LearningSettings | null => {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

const writeCache = (value: LearningSettings) => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* hết dung lượng: DB vẫn giữ bản thật */
  }
}

/**
 * Thiết lập học tập. DB (`UserSettings`) là nguồn sự thật; localStorage chỉ là
 * bộ đệm để first paint không nhảy số và để chưa đăng nhập vẫn dùng được.
 *
 * Trước đây logic này nằm lẫn trong `use-daily-path`, và `use-daily-quests` thò
 * tay đọc thẳng localStorage key của nó — sửa một chỗ là gãy chỗ kia.
 */
export function useLearningSettings() {
  const { userId } = useSession()

  const load = async (): Promise<void> => {
    if (!import.meta.client) return
    if (inflight) {
      await inflight
      // Lượt đang chạy có thể của user khác (hoặc của lúc chưa đăng nhập);
      // nếu vậy phải nạp lại cho đúng người hiện tại.
      if (loadedFor === userId.value) return
    }

    const target = userId.value

    inflight = (async () => {
      const cached = readCache()
      if (cached) settings.value = cached

      try {
        if (!target) throw new Error('unauthenticated')
        const res: any = await $fetch('/api/settings')
        if (res?.persisted) {
          settings.value = normalize(res)
          writeCache(settings.value)
        }
        loadedFor = target
      } catch {
        // Ngoại tuyến hoặc chưa đăng nhập: dùng bộ đệm, và KHÔNG đánh dấu đã
        // nạp cho user nào — để lần sau đăng nhập xong còn nạp lại.
        loadedFor = null
      } finally {
        loaded.value = true
        inflight = null
      }
    })()

    return inflight
  }

  /**
   * Nạp nếu chưa có dữ liệu của đúng người dùng hiện tại.
   *
   * Không chỉ dựa vào cờ `loaded`: lượt nạp lúc chưa đăng nhập vẫn đặt cờ đó dù
   * thất bại, nên phiên sau đó sẽ dùng mặc định thay vì thiết lập thật. Trong
   * luồng hiện tại việc đăng nhập luôn kéo theo tải lại trang (middleware đá về
   * `/login`), nên module state reset và triệu chứng không lộ ra; `loadedFor`
   * giữ cho đúng khi đổi tài khoản trong cùng một phiên SPA, và để điều kiện
   * không phụ thuộc vào chi tiết của middleware.
   */
  const ensureLoaded = () => {
    if (inflight) return
    if (loaded.value && loadedFor === userId.value) return
    void load()
  }

  /**
   * Ghi từng phần. Handler `/api/settings` coi field không gửi lên là "giữ
   * nguyên", nên chỉ gửi đúng thứ vừa đổi.
   */
  const saveSettings = (patch: Partial<LearningSettings>) => {
    ensureLoaded()
    settings.value = normalize({ ...settings.value, ...patch })
    writeCache(settings.value)

    if (!import.meta.client || !userId.value) return
    $fetch('/api/settings', { method: 'POST', body: patch }).catch(() => {
      /* ngoại tuyến: bộ đệm giữ lựa chọn cho tới lần sau */
    })
  }

  const setDailyReviewTarget = (value: number) => {
    saveSettings({
      dailyReviewTarget: Math.max(1, Math.min(200, Math.round(value) || DEFAULT_REVIEW_TARGET)),
    })
  }

  const dailyReviewTarget = computed(() => {
    ensureLoaded()
    return settings.value.dailyReviewTarget
  })

  const mascotEnabled = computed(() => {
    ensureLoaded()
    return settings.value.mascot
  })

  return {
    settings,
    dailyReviewTarget,
    mascotEnabled,
    load,
    ensureLoaded,
    saveSettings,
    setDailyReviewTarget,
  }
}

/**
 * Chỉ tiêu ôn tập, đọc đồng bộ — dùng ở nơi không await được.
 * Ưu tiên state đang có trong bộ nhớ, rơi về bộ đệm rồi mới tới mặc định.
 */
export function readDailyReviewTarget(): number {
  if (loaded.value) return settings.value.dailyReviewTarget
  return readCache()?.dailyReviewTarget ?? DEFAULT_REVIEW_TARGET
}

/**
 * Cáo có được bật không, đọc đồng bộ — `cue()` được gọi từ nơi không await được
 * và phải im ngay, không đợi vòng nạp settings.
 */
export function readMascotEnabled(): boolean {
  if (loaded.value) return settings.value.mascot
  return readCache()?.mascot ?? true
}
