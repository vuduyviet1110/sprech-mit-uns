import { useVocabulary } from './use-vocabulary'
import type { Vocabulary } from '@utils/types'
import { withLoading } from '~/utils/withLoading'
export function useVocabularyForm() {
  const editing = ref<boolean>(false)
  const form: Ref<Vocabulary> = ref({
    id: null,
    word: '',
    meaning: '',
    example: '',
    level: 'A1',
    audioUrl: '',
    type: 'noun',
    imageUrl: '',
    transcription: '',
  })
  const errorMessage = ref<string>('')
  const { fetchVocabularies, selectedLevel } = useVocabulary()

  const saveVocabulary = async () => {
    const payload = { ...form.value }
    try {
      const url = editing.value
        ? `/api/vocabulary/${form.value.id}`
        : '/api/vocabulary'
      const method = editing.value ? 'PUT' : 'POST'

      await withLoading(() =>
        $fetch<Vocabulary>(url, {
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

  const editVocabulary = (vocab: Vocabulary) => {
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
    }
  }

  const cancelEdit = () => {
    resetForm()
    editing.value = false
  }

  const resetForm = () => {
    form.value = {
      id: null,
      word: '',
      meaning: '',
      example: '',
      level: 'A1',
      audioUrl: '',
      imageUrl: '',
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
