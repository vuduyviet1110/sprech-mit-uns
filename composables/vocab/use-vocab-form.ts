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

  const viMeaning = ref('')
  const enMeaning = ref('')

  const editing = ref(false)
  const isFormOpen = ref(false)
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
    viMeaning.value = ''
    enMeaning.value = ''
  }

  const toggleForm = () => {
    if (isFormOpen.value && editing.value) {
      resetForm()
      editing.value = false
    } else if (!isFormOpen.value) {
      resetForm()
      editing.value = false
      isFormOpen.value = true
    } else {
      isFormOpen.value = false
    }
  }

  const closeForm = () => {
    resetForm()
    editing.value = false
    isFormOpen.value = false
  }

  const { currentLanguage } = useLanguage()

  const saveVocabulary = async () => {
    // Combine viMeaning & enMeaning into standard meaning format: "VN <vi> • GB <en>" or single meaning
    if (viMeaning.value.trim() || enMeaning.value.trim()) {
      const parts: string[] = []
      if (viMeaning.value.trim()) {
        parts.push(`VN ${viMeaning.value.trim()}`)
      }
      if (enMeaning.value.trim()) {
        parts.push(`GB ${enMeaning.value.trim()}`)
      }
      form.value.meaning = parts.join(' • ')
    }

    const topicIds = (form.value.topics || []).map((t: any) =>
      typeof t === 'string' ? t : t?.topicId || t?.id,
    ).filter(Boolean)

    const payload = {
      ...form.value,
      language: form.value.language || currentLanguage.value,
      wordType: form.value.type,
      topicIds,
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
      isFormOpen.value = false
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
      topics: vocab.topics?.map((t: any) =>
        typeof t === 'string' ? t : t.topicId || t.topic?.id || t.id,
      ) || [],
    }

    // Extract VN and GB meaning parts from vocab.meaning string
    if (vocab.meaning) {
      if (vocab.meaning.includes('•')) {
        const parts = vocab.meaning.split('•')
        viMeaning.value = parts[0].replace(/VN\s*/i, '').replace(/🇻🇳/g, '').trim()
        enMeaning.value = parts[1].replace(/GB\s*/i, '').replace(/🇬🇧/g, '').trim()
      } else {
        viMeaning.value = vocab.meaning.replace(/VN\s*/i, '').replace(/🇻🇳/g, '').trim()
        enMeaning.value = ''
      }
    } else {
      viMeaning.value = ''
      enMeaning.value = ''
    }

    isFormOpen.value = true
  }

  const cancelEdit = () => {
    closeForm()
  }

  return {
    form,
    viMeaning,
    enMeaning,
    editing,
    isFormOpen,
    isLoading,
    errorMessage,
    toggleForm,
    closeForm,
    saveVocabulary,
    editVocabulary,
    cancelEdit,
  }
}
