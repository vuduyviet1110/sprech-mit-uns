import { useVocabulary } from './use-vocabulary'
import type { UserVocabularyEntry } from '~/utils/types'

export function useVocabularyForm() {
  const form = ref({
    id: '',
    word: '',
    meaning: '',
    example: '',
    level: 'A1',
    type: 'Noun',
    note: '',
    language: 'de',
    source: 'manual' as string,
    wordId: null as string | null,
  })

  const viMeaning = ref('')
  const enMeaning = ref('')

  const editing = ref(false)
  const isFormOpen = ref(false)
  const errorMessage = ref('')
  const isLoading = ref(false)

  const { fetchVocabularies, userId } = useVocabulary()
  const { currentLanguage } = useLanguage()

  const resetForm = () => {
    form.value = {
      id: '',
      word: '',
      meaning: '',
      example: '',
      level: 'A1',
      type: 'Noun',
      note: '',
      language: currentLanguage.value || 'de',
      source: 'manual',
      wordId: null,
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

  const buildMeaning = () => {
    if (viMeaning.value.trim() || enMeaning.value.trim()) {
      const parts: string[] = []
      if (viMeaning.value.trim()) parts.push(`VN ${viMeaning.value.trim()}`)
      if (enMeaning.value.trim()) parts.push(`GB ${enMeaning.value.trim()}`)
      form.value.meaning = parts.join(' • ')
    }
  }

  const saveVocabulary = async () => {
    buildMeaning()
    if (!form.value.word.trim() || !form.value.meaning.trim()) {
      errorMessage.value = 'Vui lòng nhập từ và nghĩa'
      return
    }

    const isDictionaryEdit =
      editing.value && form.value.source === 'dictionary' && !!form.value.wordId

    isLoading.value = true
    try {
      if (editing.value) {
        await $fetch(`/api/vocabulary/${form.value.id}`, {
          method: 'PUT',
          query: { userId },
          body: isDictionaryEdit
            ? { note: form.value.note, meaning: form.value.meaning }
            : {
                word: form.value.word,
                meaning: form.value.meaning,
                note: form.value.note,
                language: form.value.language,
                level: form.value.level,
                type: form.value.type,
                example: form.value.example,
              },
        })
      } else {
        await $fetch('/api/vocabulary', {
          method: 'POST',
          body: {
            userId,
            word: form.value.word,
            meaning: form.value.meaning,
            note: form.value.note,
            language: form.value.language || currentLanguage.value,
            level: form.value.level,
            type: form.value.type,
            example: form.value.example,
            source: 'manual',
          },
        })
      }

      resetForm()
      editing.value = false
      isFormOpen.value = false
      errorMessage.value = ''
      await fetchVocabularies(true)
    } catch (error) {
      errorMessage.value = 'Lỗi khi lưu vào sổ từ vựng'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const editVocabulary = (entry: UserVocabularyEntry) => {
    editing.value = true
    form.value = {
      id: entry.id,
      word: entry.word,
      meaning: entry.meaning,
      example: entry.example || '',
      level: entry.level || 'A1',
      type: entry.type || 'Noun',
      note: entry.note || '',
      language: entry.language || 'de',
      source: entry.source || 'manual',
      wordId: entry.wordId || null,
    }

    if (entry.meaning) {
      if (entry.meaning.includes('•')) {
        const parts = entry.meaning.split('•')
        viMeaning.value = parts[0]
          .replace(/VN\s*/i, '')
          .replace(/🇻🇳/g, '')
          .trim()
        enMeaning.value = parts[1]
          .replace(/GB\s*/i, '')
          .replace(/🇬🇧/g, '')
          .trim()
      } else {
        viMeaning.value = entry.meaning
          .replace(/VN\s*/i, '')
          .replace(/🇻🇳/g, '')
          .trim()
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
