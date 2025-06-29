import { useVocabulary } from './use-vocabulary'

export function useVocabularyForm() {
  const editing = ref<boolean>(false)
  const form: Ref<Vocabulary> = ref({
    id: null,
    word: '',
    meaning: '',
    example: '',
    level: 'A1',
    audioUrl: '',
    imageUrl: '',
  })
  const errorMessage = ref<string>('')
  const { fetchVocabularies, selectedLevel } = useVocabulary()

  const saveVocabulary = async () => {
    const payload = { ...form.value }
    try {
      if (editing.value) {
        await $fetch(`/api/vocabulary/${form.value.id}`, {
          method: 'PUT',
          body: payload,
        })
      } else {
        await $fetch('/api/vocabulary', {
          method: 'POST',
          body: payload,
        })
      }
      resetForm()
      editing.value = false
      selectedLevel.value = ''
      errorMessage.value = ''
      await fetchVocabularies()
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
