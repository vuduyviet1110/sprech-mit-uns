import { ref, computed } from 'vue'
import type { VocabularyWord } from '~/utils/types'
import { withLoading } from '~/utils/withLoading'

export function useVocabulary() {
  const vocabularies = ref<VocabularyWord[]>([])
  const selectedLevel = ref<string>('')
  const selectedTopic = ref<string | null>(null)
  const search = ref<string>('')
  const errorMessage = ref<string>('')
  const page = ref(1)
  const limit = 10
  const hasMore = ref(true)
  const loading = ref(false)
  const totalCount = ref(0)
  const currentTotal = ref(0)
  const queryParams = computed(() => ({
    level: selectedLevel.value || undefined,
    topic: selectedTopic.value || undefined,
    search: search.value || undefined,
    page: page.value,
    limit,
  }))

  const { data, pending, error, refresh } = useFetch('/api/dictionary', {
    query: queryParams,
    server: false,
    watch: [
      computed(() => ({
        level: selectedLevel.value,
        topic: selectedTopic.value,
        search: search.value,
      })),
    ],
    transform: (response: {
      items: VocabularyWord[]
      meta: { hasMore: boolean; totalCount: number; currentTotal: number }
    }) => {
      hasMore.value = response.meta.hasMore
      totalCount.value = response.meta.totalCount
      currentTotal.value = response.meta.currentTotal
      return response.items
    },
    onResponseError: ({ response }) => {
      errorMessage.value = 'Lỗi khi tải danh sách từ vựng'
      console.error('Fetch error:', response._data)
    },
  })

  watch(data, (newData) => {
    if (newData) {
      vocabularies.value =
        page.value === 1 ? newData : [...vocabularies.value, ...newData]
    }
  })

  const fetchVocabularies = async (reset = false) => {
    if (loading.value || pending.value) return

    if (reset) {
      vocabularies.value = []
      page.value = 1
      hasMore.value = true
    }

    loading.value = true
    await refresh()
    loading.value = false
  }

  const deleteVocabulary = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return

    try {
      await withLoading(() =>
        $fetch<{ success: boolean }>(`/api/vocabulary/${id}`, {
          method: 'DELETE',
        }),
      )

      errorMessage.value = ''
      await fetchVocabularies(true)
    } catch (err) {
      errorMessage.value = 'Lỗi khi xóa từ vựng'
      console.error('Delete error:', err)
    }
  }

  const loadMoreVocabularies = async () => {
    if (loading.value || !hasMore.value) return
    page.value += 1
    await fetchVocabularies(false)
  }

  return {
    vocabularies,
    selectedLevel,
    selectedTopic,
    search,
    errorMessage,
    page,
    limit,
    loading,
    hasMore,
    totalCount,
    currentTotal,
    fetchVocabularies,
    loadMoreVocabularies,
    deleteVocabulary,
    refresh,
  }
}
