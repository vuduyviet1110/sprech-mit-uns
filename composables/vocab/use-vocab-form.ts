import { useVocabulary } from './use-vocabulary'
import type { VocabularyWord } from '@utils/types'
import { withLoading } from '~/utils/withLoading'
export function useVocabularyForm() {
  const editing = ref<boolean>(false)
  const form: Ref<VocabularyWord> = ref({
    id: '',
    word: '',
    meaning: '',
    example: '',
    level: 'A1',
    audioUrl: '',
    type: 'noun',
    imageUrl: '',
    transcription: '',
    synonyms: [],
    antonyms: [],
    topics: [],
  })
  const errorMessage = ref<string>('')
  const { fetchVocabularies, selectedLevel } = useVocabulary()

  const saveVocabulary = async () => {
    const payload = {
      ...form.value,
      topicIds: form.value.topics.map((t) =>
        typeof t === 'string' ? t : t.id,
      ),
    }
    console.log('Payload:', payload)
    try {
      const url = editing.value
        ? `/api/vocabulary/${form.value.id}`
        : '/api/vocabulary'
      const method = editing.value ? 'PUT' : 'POST'

      await withLoading(() =>
        $fetch<VocabularyWord>(url, {
          method,
          body: payload,
        }),
      )

      resetForm()
      editing.value = false
      selectedLevel.value = ''
      errorMessage.value = ''
      await fetchVocabularies(true)
    } catch (err) {
      errorMessage.value = 'Lỗi khi lưu từ vựng'
    }
  }

  const editVocabulary = (vocab: VocabularyWord) => {
    editing.value = true
    form.value = {
      id: vocab.id,
      word: vocab.word,
      meaning: vocab.meaning,
      example: vocab.example || '',
      level: vocab.level,
      audioUrl: vocab.audioUrl || '',
      imageUrl: vocab.imageUrl || '',
      transcription: vocab.transcription || '',
      type: vocab.type || '',
      synonyms: vocab.synonyms,
      antonyms: vocab.antonyms,
      topics: vocab.topics ? vocab.topics.map((t) => t.topicId) : [],
    }
  }

  const cancelEdit = () => {
    resetForm()
    editing.value = false
  }

  const resetForm = () => {
    form.value = {
      id: '',
      word: '',
      meaning: '',
      example: '',
      level: 'A1',
      audioUrl: '',
      imageUrl: '',
      synonyms: [],
      antonyms: [],
      topics: [],
      transcription: '',
      type: '',
    }
  }

  return {
    form,
    editing,
    errorMessage,
    saveVocabulary,
    editVocabulary,
    cancelEdit,
  }
}
