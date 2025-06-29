import { ref } from 'vue'

const vocabularies = ref<Vocabulary[]>([])
const selectedLevel = ref<string>('')
const errorMessage = ref<string>('')

export function useVocabulary() {
  const fetchVocabularies = async () => {
    const query = selectedLevel.value ? `?level=${selectedLevel.value}` : ''
    try {
      const response = await $fetch<Vocabulary[]>(`/api/vocabulary${query}`)
      vocabularies.value = [...response]
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
    fetchVocabularies,
    deleteVocabulary,
  }
}
