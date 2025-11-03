import { useVocabulary } from './use-vocabulary'
import type { VocabularyWord } from '~/utils/types'

export function useVocabularyForm() {
  const form = ref<VocabularyWord>({
    id: '',
    word: '',
    meaning: '',
    example: '',
    level: 'A1',
    audioUrl: '',
    imageUrl: '',
    type: 'noun',
    transcription: '',
    synonyms: [],
    antonyms: [],
    topics: [],
  })

  const editing = ref(false)
  const errorMessage = ref('')
  const isLoading = ref(false)

  const { fetchVocabularies, selectedLevel } = useVocabulary()

  const resetForm = () => {
    form.value = {
      id: '',
      word: '',
      meaning: '',
      example: '',
      level: 'A1',
      audioUrl: '',
      imageUrl: '',
      type: 'noun',
      transcription: '',
      synonyms: [],
      antonyms: [],
      topics: [],
    }
  }

  const saveVocabulary = async () => {
    const payload = {
      ...form.value,
      topicIds: form.value.topics.map((t) =>
        typeof t === 'string' ? t : t.id,
      ),
    }

    const url = editing.value
      ? `/api/vocabulary/${form.value.id}`
      : '/api/vocabulary'
    const method = editing.value ? 'PUT' : 'POST'

    isLoading.value = true
    try {
      await $fetch(url, { method, body: payload })
      resetForm()
      editing.value = false
      selectedLevel.value = ''
      errorMessage.value = ''
      await fetchVocabularies(true)
    } catch (error) {
      errorMessage.value = 'Lỗi khi lưu từ vựng'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const editVocabulary = (vocab: VocabularyWord) => {
    editing.value = true
    form.value = {
      ...vocab,
      topics: vocab.topics?.map((t) => t.topicId) || [],
    }
  }

  const cancelEdit = () => {
    resetForm()
    editing.value = false
  }

  return {
    form,
    editing,
    isLoading,
    errorMessage,
    saveVocabulary,
    editVocabulary,
    cancelEdit,
  }
}
