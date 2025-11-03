import { ref, computed, watch } from 'vue'
import type { VocabularyWord } from '~/utils/types'

export function useVocabulary() {
  const vocabularies = ref<VocabularyWord[]>([])
  const selectedLevel = ref('')
  const selectedTopic = ref<string | null>(null)
  const search = ref('')
  const page = ref(1)
  const limit = 10
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

  const queryParams = computed(() => ({
    level: selectedLevel.value || undefined,
    topic: selectedTopic.value || undefined,
    date: selectedDate.value || undefined,
    page: page.value,
    limit,
  }))

  const fetchVocabularies = async (reset = false, searchQuery = '') => {
    if (loading.value || loadingMore.value) return

    const isInitialLoad = reset && vocabularies.value.length === 0
    const isLoadMore = !reset && page.value > 1

    if (reset) {
      vocabularies.value = []
      page.value = 1
      hasMore.value = true
      if (isInitialLoad) {
        initialLoading.value = true
      } else {
        loading.value = true
      }
    } else if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const params = {
        ...queryParams.value,
        search: searchQuery || search.value || undefined,
      }

      const response = await $fetch<{
        items: VocabularyWord[]
        meta: { hasMore: boolean; totalCount: number; currentTotal: number }
      }>('/api/dictionary', {
        query: params as any,
      })

      hasMore.value = response.meta.hasMore
      totalCount.value = response.meta.totalCount
      currentTotal.value = response.meta.currentTotal

      if (reset) {
        vocabularies.value = response.items
      } else {
        vocabularies.value = [...vocabularies.value, ...response.items]
      }

      errorMessage.value = ''
    } catch (err) {
      errorMessage.value = 'Không thể tải dữ liệu từ vựng'
      console.error('Error fetching vocabularies:', err)
    } finally {
      loading.value = false
      loadingMore.value = false
      initialLoading.value = false
    }
  }

  const deleteVocabulary = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return

    try {
      loading.value = true
      await $fetch(`/api/vocabulary/${id}`, { method: 'DELETE' })
      await fetchVocabularies(true)
    } catch (err) {
      errorMessage.value = 'Lỗi khi xóa từ vựng'
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

  watch([selectedLevel, selectedTopic, selectedDate], () => {
    fetchVocabularies(true)
  })

  return {
    vocabularies,
    selectedLevel,
    selectedTopic,
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
    fetchVocabularies,
    loadMoreVocabularies,
    deleteVocabulary,
    triggerSearch,
  }
}
