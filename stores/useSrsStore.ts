import { defineStore } from 'pinia'
import { useGamification } from '~/composables/use-gamification'
import { useSession } from '~/composables/use-session'

export const useSrsStore = defineStore('srs', () => {
  const { userId } = useSession()
  const dueCount = ref<number>(0)
  const loading = ref<boolean>(false)
  const toastMessage = ref<string>('')
  let toastTimer: any = null

  const { playSound } = useGamification()

  const requireUid = () => {
    if (!userId.value) throw new Error('unauthenticated')
    return userId.value
  }

  const fetchDueCount = async (lang?: string) => {
    try {
      const uid = userId.value
      if (!uid) {
        dueCount.value = 0
        return
      }
      loading.value = true
      const url = lang
        ? `/api/srs/review?userId=${uid}&lang=${lang}`
        : `/api/srs/review?userId=${uid}`
      const resp = await $fetch<{ totalDueCount: number }>(url)
      if (resp && typeof resp.totalDueCount === 'number') {
        dueCount.value = resp.totalDueCount
      }
    } catch (err) {
      console.error('Failed to fetch SRS due count:', err)
    } finally {
      loading.value = false
    }
  }

  const addToSrs = async (
    word: string,
    meaning?: string,
    lang: string = 'cs',
    opts?: { example?: string; asPhrase?: boolean },
  ) => {
    try {
      const uid = requireUid()
      const cardText = opts?.asPhrase && opts.example?.trim() ? opts.example.trim() : word
      const cardMeaning =
        opts?.asPhrase && opts.example?.trim()
          ? meaning
            ? `Cụm / câu · ${meaning}`
            : `Cụm từ: ${word}`
          : meaning

      await $fetch('/api/srs/review', {
        method: 'POST',
        body: {
          userId: uid,
          wordId: cardText,
          meaning: cardMeaning,
          lang,
          quality: 0,
          isInitialAdd: true,
          example: opts?.asPhrase ? undefined : opts?.example,
          asPhrase: !!opts?.asPhrase,
        },
      })

      playSound('correct')

      toastMessage.value = opts?.asPhrase
        ? `Đã thêm câu «${cardText.slice(0, 40)}${cardText.length > 40 ? '…' : ''}» vào SRS!`
        : `Đã thêm "${word}" vào ôn tập SRS!`
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => {
        toastMessage.value = ''
      }, 3500)

      await fetchDueCount()
      return true
    } catch (err) {
      console.error('Failed to add word to SRS:', err)
      return false
    }
  }

  const clearToast = () => {
    toastMessage.value = ''
    if (toastTimer) clearTimeout(toastTimer)
  }

  return {
    dueCount,
    loading,
    toastMessage,
    fetchDueCount,
    addToSrs,
    clearToast,
  }
})
