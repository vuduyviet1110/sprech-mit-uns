import { ref, computed } from 'vue'

export type LearningLanguage = 'de' | 'cs'

const currentLanguage = ref<LearningLanguage>('de')

export function useLanguage() {
  // Initialize from localStorage if on client
  if (import.meta.client) {
    const saved = localStorage.getItem('learning_language') as LearningLanguage
    if (saved === 'de' || saved === 'cs') {
      currentLanguage.value = saved
    }
  }

  const setLanguage = (lang: LearningLanguage) => {
    currentLanguage.value = lang
    if (import.meta.client) {
      localStorage.setItem('learning_language', lang)
      // Ghi kèm vào hồ sơ để máy mới vào đúng ngôn ngữ. Không chặn UI, và
      // handler cập nhật từng phần nên không đụng các thiết lập khác.
      $fetch('/api/settings', {
        method: 'POST',
        body: { primaryLang: lang },
      }).catch(() => {
        /* chưa đăng nhập hoặc ngoại tuyến: lựa chọn vẫn giữ ở máy này */
      })
    }
  }

  /**
   * Máy chưa có lựa chọn nào thì lấy theo hồ sơ. Giữ `useLanguage()` đồng bộ —
   * nó được gọi từ rất nhiều trang bên trong `computed`/`useFetch` key.
   */
  const hydrateFromProfile = async () => {
    if (!import.meta.client) return
    if (localStorage.getItem('learning_language')) return
    try {
      const res: any = await $fetch('/api/settings')
      if (res?.primaryLang === 'cs' || res?.primaryLang === 'de') {
        currentLanguage.value = res.primaryLang
        localStorage.setItem('learning_language', res.primaryLang)
      }
    } catch {
      /* giữ mặc định */
    }
  }

  const isGerman = computed(() => currentLanguage.value === 'de')
  const isCzech = computed(() => currentLanguage.value === 'cs')

  return {
    currentLanguage,
    setLanguage,
    hydrateFromProfile,
    isGerman,
    isCzech,
  }
}
