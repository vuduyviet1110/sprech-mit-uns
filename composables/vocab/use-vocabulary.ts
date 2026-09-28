import { ref, computed, watch } from 'vue'
import type { UserVocabularyEntry } from '~/utils/types'
import { useLanguage } from '~/composables/use-language'
import { useSession } from '~/composables/use-session'

const entries = ref<UserVocabularyEntry[]>([])
const selectedLevel = ref('')
const { currentLanguage, setLanguage } = useLanguage()
const selectedLanguage = computed({
  get: () => currentLanguage.value,
  set: (val: string) => {
    if (val === 'de' || val === 'cs') setLanguage(val)
  },
})
const selectedSource = ref<'dictionary' | 'manual' | ''>('')
const search = ref('')
const page = ref(1)
const limit = 16
const selectedDate = ref<
  'today' | 'yesterday' | 'last_3_days' | 'this_week' | ''
>('')
const hasMore = ref(true)
const totalCount = ref(0)
const currentTotal = ref(0)
const errorMessage = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const initialLoading = ref(true)

let watcherInitialized = false

export function useVocabulary() {
  const { userId } = useSession()

  const queryParams = computed(() => ({
    userId: userId.value || undefined,
    level: selectedLevel.value || undefined,
    language: selectedLanguage.value || undefined,
    source: selectedSource.value || undefined,
    date: selectedDate.value || undefined,
    page: page.value,
    limit,
  }))

  const fetchVocabularies = async (reset = false, searchQuery = '') => {
    if (loading.value || loadingMore.value) return

    const isInitialLoad = reset && entries.value.length === 0
    const isLoadMore = !reset && page.value > 1

    if (reset) {
      entries.value = []
      page.value = 1
      hasMore.value = true
      if (isInitialLoad) initialLoading.value = true
      else loading.value = true
    } else if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const response = await $fetch<{
        items: UserVocabularyEntry[]
        meta: { hasMore: boolean; totalCount: number; currentTotal: number }
      }>('/api/vocabulary', {
        query: {
          ...queryParams.value,
          search: searchQuery || search.value || undefined,
        } as any,
      })

      hasMore.value = response.meta.hasMore
      totalCount.value = response.meta.totalCount
      currentTotal.value = response.meta.currentTotal

      if (reset) entries.value = response.items
      else entries.value = [...entries.value, ...response.items]

      errorMessage.value = ''
    } catch (err) {
      errorMessage.value = 'Không thể tải sổ từ vựng'
      console.error(err)
    } finally {
      loading.value = false
      loadingMore.value = false
      initialLoading.value = false
    }
  }

  const deleteVocabulary = async (id: string) => {
    if (!id) return
    if (!confirm('Xóa từ này khỏi sổ cá nhân?')) return

    try {
      loading.value = true
      await $fetch(`/api/vocabulary/${id}`, {
        method: 'DELETE',
        query: { userId },
      })
      await fetchVocabularies(true)
    } catch (err) {
      errorMessage.value = 'Lỗi khi xóa khỏi sổ'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const triggerSearch = useDebounceFn(async () => {
    await fetchVocabularies(true, search.value)
  }, 500)

  const loadMoreVocabularies = async () => {
    if (loading.value || loadingMore.value || !hasMore.value) return
    page.value += 1
    await fetchVocabularies(false)
  }

  if (!watcherInitialized) {
    watcherInitialized = true
    watch(
      [selectedLevel, currentLanguage, selectedSource, selectedDate],
      () => {
        fetchVocabularies(true)
      },
    )
  }

  return {
    /** @deprecated use `entries` — kept alias for gradual migration */
    vocabularies: entries,
    entries,
    selectedLevel,
    selectedLanguage,
    selectedSource,
    selectedDate,
    search,
    errorMessage,
    page,
    limit,
    hasMore,
    totalCount,
    currentTotal,
    loading,
    loadingMore,
    initialLoading,
    userId,
    fetchVocabularies,
    loadMoreVocabularies,
    deleteVocabulary,
    triggerSearch,
  }
}
