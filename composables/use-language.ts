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
    }
  }

  const isGerman = computed(() => currentLanguage.value === 'de')
  const isCzech = computed(() => currentLanguage.value === 'cs')

  return {
    currentLanguage,
    setLanguage,
    isGerman,
    isCzech,
  }
}
