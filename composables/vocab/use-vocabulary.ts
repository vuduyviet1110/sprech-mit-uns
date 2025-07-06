import { ref } from 'vue'

const vocabularies = ref<Vocabulary[]>([])
const selectedLevel = ref<string>('')
const errorMessage = ref<string>('')
const page = ref(1)
const limit = 20
const hasMore = ref(true)
const loading = ref(false)
export function useVocabulary() {
  const fetchVocabularies = async (reset = false) => {
    if (loading.value) return

    if (reset) {
      vocabularies.value = []
      page.value = 1
      hasMore.value = true
    }

    const query = new URLSearchParams()
    if (selectedLevel.value) query.append('level', selectedLevel.value)
    query.append('page', page.value.toString())
    query.append('limit', limit.toString())

    try {
      const response = await withLoading(() =>
        $fetch<Vocabulary[]>(`/api/vocabulary?${query}`),
      )
      if (response.length < limit) {
        hasMore.value = false
      }
      vocabularies.value.push(...response)
      page.value += 1
      errorMessage.value = ''
    } catch (err) {
      errorMessage.value = 'Lỗi khi tải danh sách từ vựng'
    }
  }

  const deleteVocabulary = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa từ này?')) {
      try {
        await $fetch(`/api/vocabulary/${id}`, { method: 'DELETE' })
        await fetchVocabularies()
        errorMessage.value = ''
      } catch (err) {
        errorMessage.value = 'Lỗi khi xóa từ vựng'
      }
    }
  }

  return {
    vocabularies,
    selectedLevel,
    errorMessage,
    page,
    limit,
    loading,
    hasMore,
    fetchVocabularies,
    deleteVocabulary,
  }
}
