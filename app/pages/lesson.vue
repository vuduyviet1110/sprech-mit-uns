<script lang="ts" setup>
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useGamification } from '~/composables/use-gamification'
import {
  type DraftQuizQuestion,
  draftFromApi,
  draftToPayload,
} from '~/utils/quiz-draft'
import LessonPracticeQuestionEditor from '~/components/lesson/PracticeQuestionEditor.vue'
import LessonInteractiveParagraph from '~/components/lesson/InteractiveParagraph.vue'
import LessonInlineClozeWarmup from '~/components/lesson/InlineClozeWarmup.vue'
import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })

useHead({
  title: 'Bài học tiếng Đức - Sprech Mit Uns',
})

const route = useRoute()
const router = useRouter()

const { userId: sessionUserId } = useSession()
const userId = computed(() => sessionUserId.value || '')

const topicSlug = computed(() => (route.query.topic as string) || 'begruessung-vorstellung')

// Composables
const { playAudioOrSpeak } = useAudioPlayback()
const { triggerConfetti, playSound } = useGamification()

const handleSpeak = (text: string, audioUrl?: string) => {
  const isCs = topicSlug.value.endsWith('-cs') || topicData.value?.language === 'cs' || topicData.value?.slug?.endsWith('-cs')
  const langCode = isCs ? 'cs-CZ' : 'de-DE'
  playAudioOrSpeak({ word: text, paragraph: text, audioUrl, lang: langCode })
}

// States
const loading = ref(true)
const topicData = ref<any>(null)
const questions = ref<any[]>([])
const currentStep = ref(0)
const vocabViewMode = ref<'flashcards' | 'cards'>('flashcards')
const currentFlashcardIdx = ref(0)
const isFlashcardFlipped = ref(false)
const userStreak = ref(1)

const fetchUserStreak = async () => {
  try {
    const stats: any = await $fetch(`/api/progress/stats?userId=${userId.value}`)
    if (stats && typeof stats.currentStreak === 'number') {
      userStreak.value = stats.currentStreak
    } else if (stats && typeof stats.streak === 'number') {
      userStreak.value = stats.streak
    }
  } catch (e) {
    console.error('Error fetching streak:', e)
  }
}

const nextFlashcard = () => {
  if (topicData.value?.words && currentFlashcardIdx.value < topicData.value.words.length - 1) {
    currentFlashcardIdx.value++
    isFlashcardFlipped.value = false
  }
}

const prevFlashcard = () => {
  if (currentFlashcardIdx.value > 0) {
    currentFlashcardIdx.value--
    isFlashcardFlipped.value = false
  }
}

const showTranslation = ref(false)

const paragraphGlossMap = computed(() => {
  const map: Record<string, string> = {}
  const words = topicData.value?.words || []
  for (const w of words) {
    if (!w?.word) continue
    const key = String(w.word)
      .toLowerCase()
      .normalize('NFC')
      .replace(/^[„“"«»(]+|[.,!?;:…)”"»)]+$/g, '')
    if (key) map[key] = w.meaning || ''
  }
  return map
})

const steps = [
  { key: 'vocab', title: 'Vocabulary' },
  { key: 'sentences', title: 'Sentences' },
  { key: 'practice', title: 'Practice' },
]

// Modal state for creating new Lesson
const showCreateModal = ref(false)
const newLessonForm = ref({
  title: '',
  slug: '',
  level: 'A1',
  language: 'de',
  description: '',
  paragraph: '',
  englishTranslation: '',
  difficulty: 'Easy',
  estimatedTime: '15 mins',
})
const creatingLesson = ref(false)
const createLessonQuestions = ref<DraftQuizQuestion[]>([])

// Manage Practice questions for current topic
const showManagePractice = ref(false)
const managePracticeQuestions = ref<DraftQuizQuestion[]>([])
const generatingPractice = ref(false)

const openManagePractice = () => {
  managePracticeQuestions.value = (questions.value || []).map(draftFromApi)
  showManagePractice.value = true
}

const onPracticeSaved = async () => {
  showManagePractice.value = false
  quizFinished.value = false
  currentQuestionIdx.value = 0
  selectedChoiceIdx.value = null
  userAnswers.value = {}
  isSubmitted.value = false
  await fetchTopicData()
}

const generateAndOpenManage = async () => {
  if (!topicData.value?.id) return
  generatingPractice.value = true
  try {
    const res = await $fetch<{ questions: any[] }>(
      `/api/quiz/topic/${topicData.value.id}/generate`,
      { method: 'POST' },
    )
    managePracticeQuestions.value = (res.questions || []).map(draftFromApi)
    showManagePractice.value = true
  } catch (e: any) {
    alert(e?.data?.message || e?.message || 'Không sinh được câu hỏi từ từ vựng')
  } finally {
    generatingPractice.value = false
  }
}

const hasVocabWords = computed(() => (topicData.value?.words?.length || 0) > 0)

interface QuizAnswerItem {
  selectedIndex: number
  isCorrect: boolean
}

// Quiz State
const currentQuestionIdx = ref(0)
const selectedChoiceIdx = ref<number | null>(null)
const userAnswers = ref<Record<string, QuizAnswerItem>>({})
const isSubmitted = ref(false)
const quizFinished = ref(false)

// Fetch Data
const fetchTopicData = async () => {
  try {
    loading.value = true
    const topicResp = await $fetch<any>(`/api/topics/${topicSlug.value}`)
    topicData.value = topicResp

    if (topicResp?.id) {
      const quizResp = await $fetch<any[]>(`/api/quiz/topic/${topicResp.id}`)
      questions.value = quizResp || []
    }
  } catch (err) {
    console.error('Error fetching lesson data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTopicData()
  fetchUserStreak()
})

watch(() => route.query.topic, () => {
  fetchTopicData()
})

const currentQuestion = computed(() => questions.value[currentQuestionIdx.value] || null)
const isLastQuestion = computed(() => currentQuestionIdx.value === questions.value.length - 1)

// Sentence Builder & Dictation States (Reused from FillInTheBlank demo)
const selectedWords = ref<string[]>([])
const selectedOptions = ref<string[]>([])
const inputSentence = ref('')
const isCurrentCorrect = ref(false)

const selectChoice = (index: number) => {
  if (isSubmitted.value) return
  selectedChoiceIdx.value = index
}

// Drag and Drop & Selection Helpers from Demo FillInTheBlank
const handleDragStart = (event: DragEvent, word: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', word)
  }
}

const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  const word = event.dataTransfer?.getData('text/plain')
  if (word && !selectedOptions.value.includes(word)) {
    selectedWords.value[index] = word
    selectedOptions.value.push(word)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleInput = (index: number, value: string) => {
  const prevWord = selectedWords.value[index]
  selectedWords.value[index] = value
  if (prevWord && selectedOptions.value.includes(prevWord)) {
    selectedOptions.value = selectedOptions.value.filter((w) => w !== prevWord)
  }
  if (value && !selectedOptions.value.includes(value) && currentQuestion.value?.scrambleWords?.includes(value)) {
    selectedOptions.value.push(value)
  }
}

const handleSelectOption = (word: string) => {
  if (selectedOptions.value.includes(word) || isSubmitted.value) return
  const emptyIndex = selectedWords.value.findIndex((w) => !w)
  if (emptyIndex !== -1) {
    selectedWords.value[emptyIndex] = word
  } else {
    selectedWords.value.push(word)
  }
  selectedOptions.value.push(word)
}

const removeWord = (index: number) => {
  if (isSubmitted.value) return
  const word = selectedWords.value[index]
  selectedWords.value[index] = ''
  selectedOptions.value = selectedOptions.value.filter((w) => w !== word)
}

// Synchronize state when moving between questions
watch(currentQuestion, (q) => {
  selectedChoiceIdx.value = null
  isSubmitted.value = false
  inputSentence.value = ''
  isCurrentCorrect.value = false
  selectedOptions.value = []

  if (q?.type === 'sentence_builder') {
    const wordCount = q.scrambleWords?.length || 3
    selectedWords.value = Array(wordCount).fill('')
  } else {
    selectedWords.value = []
  }
}, { immediate: true })



const canSubmit = computed(() => {
  if (!currentQuestion.value) return false
  const qType = currentQuestion.value.type || 'multiple_choice'
  if (qType === 'multiple_choice') return selectedChoiceIdx.value !== null
  if (qType === 'sentence_builder') return selectedWords.value.length > 0
  if (qType === 'dictation' || qType === 'typed_recall' || qType === 'cloze') {
    return inputSentence.value.trim().length > 0
  }
  return false
})

const checkAnswer = () => {
  if (!canSubmit.value || !currentQuestion.value) return

  const q = currentQuestion.value
  const qType = q.type || 'multiple_choice'
  let isCorrect = false

  if (qType === 'multiple_choice') {
    const choice = q.choices.find((c: any) => c.index === selectedChoiceIdx.value)
    isCorrect = !!choice?.isCorrect
  } else if (qType === 'sentence_builder') {
    const userBuilt = selectedWords.value.join(' ').trim().toLowerCase()
    const solution = (q.solution || '').trim().toLowerCase()
    isCorrect = userBuilt === solution
  } else if (qType === 'dictation' || qType === 'typed_recall' || qType === 'cloze') {
    const cleanInput = inputSentence.value.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    const cleanSolution = (q.solution || q.targetSentence || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    isCorrect = cleanInput === cleanSolution
  }

  isCurrentCorrect.value = isCorrect
  userAnswers.value[q.id] = {
    selectedIndex: selectedChoiceIdx.value ?? 0,
    isCorrect,
  }
  isSubmitted.value = true

  if (isCorrect) {
    playSound('correct')
    triggerConfetti()
  } else {
    playSound('wrong')
  }
}

const nextQuestion = () => {
  if (isLastQuestion.value) {
    finishQuiz()
  } else {
    currentQuestionIdx.value++
  }
}

const finishQuiz = async () => {
  quizFinished.value = true
  playSound('complete')
  triggerConfetti()

  const answersPayload = Object.entries(userAnswers.value).map(([qId, val]: [string, any]) => ({
    questionId: qId,
    selectedIndex: val.selectedIndex,
    isCorrect: val.isCorrect,
  }))

  try {
    await $fetch('/api/quiz/submit', {
      method: 'POST',
      body: {
        answers: answersPayload,
      },
    })
  } catch (err) {
    console.error('Failed to save quiz results:', err)
  }
}

const score = computed(() => {
  return Object.values(userAnswers.value).filter((a: any) => a.isCorrect).length
})

const resetQuiz = () => {
  currentQuestionIdx.value = 0
  selectedChoiceIdx.value = null
  userAnswers.value = {}
  isSubmitted.value = false
  quizFinished.value = false
}

const submitNewLesson = async () => {
  if (!newLessonForm.value.title || !newLessonForm.value.slug) {
    alert('Vui lòng nhập Tên bài học và Slug')
    return
  }

  try {
    creatingLesson.value = true
    const questionsPayload = createLessonQuestions.value
      .filter((q) => q.text?.trim())
      .map(draftToPayload)

    await $fetch('/api/topics/create', {
      method: 'POST',
      body: {
        ...newLessonForm.value,
        questions: questionsPayload.length ? questionsPayload : undefined,
      },
    })
    showCreateModal.value = false
    createLessonQuestions.value = []
    router.push({ path: '/lesson', query: { topic: newLessonForm.value.slug } })
  } catch (err: any) {
    alert('Lỗi khi tạo bài học mới: ' + (err.message || 'Error'))
  } finally {
    creatingLesson.value = false
  }
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <div class="w-full px-4 sm:px-6 lg:px-8 space-y-6 text-left">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-500 font-bold text-base">Đang tải nội dung bài học...</p>
      </div>

      <div v-else-if="topicData" class="space-y-6">
        <!-- Header Area -->
        <LayoutPageHeader class="mb-8">
        <div class="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div class="flex items-center gap-3">
            <NuxtLink to="/dictionary" class="text-sm font-extrabold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 transition-all">
              <Icon name="lucide:arrow-left" class="w-4 h-4" /> Danh mục bài học
            </NuxtLink>
            <span class="text-slate-300 dark:text-slate-700">•</span>
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 tracking-wider uppercase">
              CẤP ĐỘ {{ topicData.level || 'A1' }}
            </span>
          </div>

          <!-- Create Lesson Button -->
          <button
            @click="showCreateModal = true"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-sm rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Icon name="lucide:plus-circle" class="w-5 h-5" />
            Thêm bài học mới
          </button>
        </div>

        <LayoutPageTitle :text="topicData.title" class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 leading-snug" />
        <p class="text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-4xl leading-relaxed">{{ topicData.description }}</p>
      </LayoutPageHeader>

      <!-- 3-Step Interactive Progress Bar -->
      <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 mb-8">
        <div class="flex justify-center items-center gap-3 sm:gap-6 flex-wrap">
          <div
            v-for="(step, idx) in steps"
            :key="step.key"
            class="flex items-center cursor-pointer group"
            @click="currentStep = idx"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                idx === currentStep
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md ring-4 ring-blue-500/20 scale-105'
                  : idx < currentStep
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300'
              ]"
            >
              <Icon v-if="idx < currentStep" name="uil:check" class="w-5 h-5" />
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span
              :class="[
                'ml-2.5 text-sm font-extrabold transition-colors',
                idx === currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
              ]"
            >
              {{ step.title }}
            </span>
            <span v-if="idx < steps.length - 1" class="ml-4 text-slate-300 dark:text-slate-700 hidden sm:inline">→</span>
          </div>
        </div>
      </div>

      <!-- Step 0: Vocabulary Step -->
      <div v-if="currentStep === 0" class="space-y-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Icon name="uil:book-open" class="w-7 h-7 text-blue-500" />
            1. Từ vựng mới (New Vocabulary)
          </h3>

          <div class="flex items-center gap-3">
            <!-- Toggle Flashcard / List Mode -->
            <div class="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button
                @click="vocabViewMode = 'flashcards'"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  vocabViewMode === 'flashcards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                <Icon name="uil:layer-group" class="w-4 h-4" />
                Thẻ Flashcard
              </button>
              <button
                @click="vocabViewMode = 'cards'"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  vocabViewMode === 'cards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                <Icon name="uil:list-ul" class="w-4 h-4" />
                Danh sách
              </button>
            </div>

            <span class="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
              {{ topicData.words?.length || 0 }} từ vựng
            </span>
          </div>
        </div>

        <div v-if="!topicData.words?.length" class="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
          Chưa có từ vựng riêng cho bài học này.
        </div>

        <template v-else>
          <!-- 3D Flashcard Section View -->
          <div v-if="vocabViewMode === 'flashcards'">
            <LayoutPageSectionFlashCardSection
              :flashcards="topicData.words.map((w: any) => ({
                ...w,
                language: w.language || (topicSlug.endsWith('-cs') || topicData.language === 'cs' ? 'cs' : 'de')
              }))"
              :deck-key="topicData.id || topicSlug"
            />
          </div>

          <!-- Grid List View -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="word in topicData.words"
              :key="word.id"
              class="bg-gradient-to-r from-blue-50/80 to-primary-50/40 dark:from-slate-900 dark:to-slate-800/80 border border-blue-100 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-300 transition-all flex justify-between items-start gap-4 shadow-xs"
            >
              <div class="space-y-2 flex-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">{{ word.word }}</span>
                  <span v-if="word.type" class="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">{{ word.type }}</span>
                  <span v-if="word.pronunciation" class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ word.pronunciation }}</span>
                </div>
                <p class="text-slate-700 dark:text-slate-300 text-base font-bold">{{ word.meaning }}</p>
                <p v-if="word.example" class="text-sm text-slate-500 dark:text-slate-400 italic bg-white/80 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  "{{ word.example }}"
                </p>
              </div>

              <button
                @click="handleSpeak(word.word, word.audioUrl)"
                title="Nghe phát âm"
                class="w-12 h-12 shrink-0 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Icon name="uil:volume-up" class="w-6 h-6" />
              </button>
            </div>
          </div>
        </template>

        <div class="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            @click="currentStep = 1"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Tiếp theo: Ngữ cảnh & Bài đọc</span>
            <Icon name="uil:arrow-right" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Step 1: Sentences & Context Step -->
      <div v-else-if="currentStep === 1" class="space-y-8">
        <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Icon name="uil:comment-alt-notes" class="w-7 h-7 text-emerald-500" />
          2. Bài đọc & Mẫu câu ngữ cảnh (Sentences & Context)
        </h3>

        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <h4 class="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon name="uil:globe" class="w-5 h-5 text-emerald-500" />
              Đoạn văn thực tế (Deutscher Text)
            </h4>

            <div class="flex items-center gap-3">
              <!-- Toggle Translation Button -->
              <button
                @click="showTranslation = !showTranslation"
                class="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Icon :name="showTranslation ? 'uil:eye-slash' : 'uil:eye'" class="w-4 h-4" />
                <span>{{ showTranslation ? 'Ẩn bản dịch' : 'Hiện bản dịch' }}</span>
              </button>

              <button
                @click="handleSpeak(topicData.paragraph)"
                class="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
              >
                <Icon name="uil:volume-up" class="w-4 h-4" />
                Đọc toàn bài
              </button>
            </div>
          </div>

          <LessonInteractiveParagraph
            v-if="topicData.paragraph"
            :text="topicData.paragraph"
            :gloss-map="paragraphGlossMap"
            @speak="(t) => handleSpeak(t)"
          />
          <p
            v-else
            class="text-slate-800 dark:text-slate-200 text-lg md:text-xl leading-loose font-medium bg-slate-50 dark:bg-slate-950/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80"
          >
            Chưa có đoạn văn bài đọc cho chủ đề này.
          </p>

          <LessonInlineClozeWarmup
            v-if="topicData.words?.length"
            :words="topicData.words"
          />

          <!-- Toggleable Translation -->
          <div v-if="showTranslation && topicData.englishTranslation" class="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h5 class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Icon name="uil:language" class="w-4 h-4" />
              Bản dịch tham khảo (Translation)
            </h5>
            <p class="text-slate-700 dark:text-slate-300 text-base leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              {{ topicData.englishTranslation }}
            </p>
          </div>

          <!-- Reading Tips Box -->
          <div class="bg-amber-50/80 dark:bg-amber-950/40 p-6 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 space-y-3">
            <h4 class="text-base font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Icon name="uil:lightbulb" class="w-5 h-5 text-amber-500" />
              Mẹo đọc & Học ngữ cảnh (Reading Tips)
            </h4>
            <ul class="space-y-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Chạm từng từ để xem gloss — não gắn từ vào ngữ cảnh.
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Làm 1–2 cloze nhanh trước khi sang Practice.
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Bấm "Đọc toàn bài" để nghe ngữ điệu và luyện nghe phát âm.
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            @click="currentStep = 0"
            class="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Icon name="uil:arrow-left" class="w-5 h-5" />
            <span>Quay lại: Từ vựng</span>
          </button>
          <button
            @click="currentStep = 2"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Tiếp theo: Luyện tập Practice</span>
            <Icon name="uil:arrow-right" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Step 2: Practice Step -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Icon name="lucide:circle-help" class="w-7 h-7 text-primary-500" />
            3. Luyện tập Quiz (Practice)
          </h3>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              @click="openManagePractice"
              class="px-4 py-2 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 font-bold text-xs rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="uil:edit-alt" class="w-4 h-4" />
              <span>Quản lý câu hỏi</span>
            </button>
            <button
              @click="currentStep = 1"
              class="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="uil:arrow-left" class="w-4 h-4" />
              <span>Xem lại Ngữ cảnh</span>
            </button>
          </div>
        </div>
        <div v-if="!questions.length" class="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <Icon name="uil:exclamation-circle" class="w-14 h-14 text-slate-400 mx-auto" />
          <div>
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">Chưa có câu hỏi trắc nghiệm</h3>
            <p class="text-slate-500 text-sm mt-1">Thêm tay hoặc sinh tự động từ từ vựng của bài học.</p>
          </div>
          <div class="flex items-center justify-center gap-3 flex-wrap pt-2">
            <button
              @click="openManagePractice"
              class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Icon name="uil:plus-circle" class="w-5 h-5" />
              Thêm câu hỏi
            </button>
            <button
              :disabled="!hasVocabWords || generatingPractice"
              @click="generateAndOpenManage"
              class="px-5 py-2.5 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 font-extrabold text-sm rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
            >
              <Icon v-if="generatingPractice" name="uil:spinner" class="w-5 h-5 animate-spin" />
              <Icon v-else name="uil:magic-wand" class="w-5 h-5" />
              Sinh từ từ vựng
            </button>
          </div>
          <p v-if="!hasVocabWords" class="text-xs text-slate-400">Bài này chưa có từ vựng — chỉ thêm câu hỏi thủ công.</p>
        </div>

        <div v-else-if="!quizFinished" class="max-w-3xl mx-auto space-y-8">
          <!-- Quiz Progress Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-slate-500">
                Câu {{ currentQuestionIdx + 1 }} / {{ questions.length }}
              </span>
              <span class="px-2.5 py-0.5 text-xs font-extrabold rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                {{
                  currentQuestion.type === 'sentence_builder'
                    ? '🧩 Ghép câu'
                    : currentQuestion.type === 'dictation'
                      ? '🎧 Nghe chép chính tả'
                      : currentQuestion.type === 'typed_recall'
                        ? '✍️ Gõ từ'
                        : currentQuestion.type === 'cloze'
                          ? '📝 Cloze'
                          : '❓ Trắc nghiệm'
                }}
              </span>
            </div>
            <div class="w-48 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                class="bg-primary-500 h-full transition-all duration-300"
                :style="{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Question Card -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-8">
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
              {{ currentQuestion.text }}
            </h3>

            <!-- Dạng 1: Trắc nghiệm 4 lựa chọn (Multiple Choice) -->
            <div v-if="currentQuestion.type === 'multiple_choice' || !currentQuestion.type" class="space-y-4">
              <button
                v-for="choice in currentQuestion.choices"
                :key="choice.id"
                @click="selectChoice(choice.index)"
                :disabled="isSubmitted"
                :class="[
                  'w-full text-left p-5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-between',
                  selectedChoiceIdx === choice.index
                    ? isSubmitted
                      ? choice.isCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      : 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                    : isSubmitted && choice.isCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                ]"
              >
                <span>{{ choice.text }}</span>
                <Icon v-if="isSubmitted && choice.isCorrect" name="uil:check-circle" class="w-6 h-6 text-emerald-500" />
                <Icon v-else-if="isSubmitted && selectedChoiceIdx === choice.index && !choice.isCorrect" name="uil:times-circle" class="w-6 h-6 text-red-500" />
              </button>
            </div>

            <!-- Dạng 2: Sentence Builder / Fill In The Blank (Giữ nguyên logic & thiết kế cũ, xếp 1 hàng ngang) -->
            <div v-else-if="currentQuestion.type === 'sentence_builder'" class="space-y-6 text-center">
              <!-- Khung chứa các ô từ ghép (1 hàng ngang mượt mà) -->
              <div class="flex flex-wrap justify-center items-center gap-2.5 min-h-[68px] p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 transition-all">
                <div
                  v-for="(word, i) in selectedWords"
                  :key="i"
                  class="border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-100/80 dark:bg-emerald-950/80 px-3.5 py-2.5 rounded-xl flex-1 max-w-[130px] min-w-[70px] cursor-pointer shadow-xs hover:border-emerald-500 transition-all text-center flex items-center justify-center"
                  @drop="handleDrop($event, i)"
                  @dragover="handleDragOver"
                  @click="removeWord(i)"
                >
                  <input
                    v-model="selectedWords[i]"
                    class="w-full text-center bg-transparent outline-hidden font-extrabold text-emerald-900 dark:text-emerald-200 text-base pointer-events-none"
                    placeholder="---"
                    readonly
                  />
                </div>
              </div>

              <!-- Danh sách từ tùy chọn bên dưới -->
              <div class="flex flex-wrap justify-center gap-2.5">
                <button
                  v-for="(word, i) in currentQuestion.scrambleWords"
                  :key="i"
                  draggable="true"
                  :disabled="isSubmitted || selectedWords.includes(word)"
                  :class="[
                    'px-4 py-2.5 rounded-xl font-extrabold text-base shadow-xs transition-all cursor-pointer border',
                    selectedWords.includes(word)
                      ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95'
                  ]"
                  @click="handleSelectOption(word)"
                  @dragstart="handleDragStart($event, word)"
                >
                  {{ word }}
                </button>
              </div>

              <!-- Phản hồi khi đã nộp bài -->
              <div v-if="isSubmitted" class="p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2" :class="isCurrentCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800'">
                <Icon :name="isCurrentCorrect ? 'uil:check-circle' : 'uil:times-circle'" class="w-5 h-5" />
                <span>{{ isCurrentCorrect ? 'Ghép câu chính xác!' : `Chưa đúng! Đáp án đúng: "${currentQuestion.solution}"` }}</span>
              </div>
            </div>

            <!-- Dạng 3: Dictation (Nghe chép chính tả) -->
            <div v-else-if="currentQuestion.type === 'dictation'" class="space-y-6 text-center">
              <button
                @click="handleSpeak(currentQuestion.targetSentence || currentQuestion.solution)"
                class="px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-base rounded-2xl shadow-md transition-all active:scale-95 inline-flex items-center gap-3"
              >
                <Icon name="uil:volume-up" class="w-7 h-7 animate-pulse" />
                <span>Bấm để nghe đoạn Audio phát âm</span>
              </button>

              <div>
                <input
                  v-model="inputSentence"
                  :disabled="isSubmitted"
                  type="text"
                  placeholder="Gõ lại chính xác câu tiếng Đức bạn nghe được..."
                  class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-lg focus:outline-hidden focus:border-primary-500 transition-all text-center"
                />
              </div>

              <!-- Phản hồi kết quả -->
              <div v-if="isSubmitted" class="p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2" :class="isCurrentCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300'">
                <Icon :name="isCurrentCorrect ? 'uil:check-circle' : 'uil:times-circle'" class="w-5 h-5" />
                <span>{{ isCurrentCorrect ? 'Chính xác hoàn hảo!' : `Đáp án đúng: "${currentQuestion.solution}"` }}</span>
              </div>
            </div>

            <!-- Typed recall / Cloze -->
            <div v-else-if="currentQuestion.type === 'typed_recall' || currentQuestion.type === 'cloze'" class="space-y-6 text-center">
              <input
                v-model="inputSentence"
                :disabled="isSubmitted"
                type="text"
                :placeholder="currentQuestion.type === 'cloze' ? 'Điền từ còn thiếu…' : 'Gõ từ/cụm bằng trí nhớ…'"
                class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-lg focus:outline-hidden focus:border-primary-500 transition-all text-center"
              />
              <div
                v-if="isSubmitted"
                class="p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                :class="isCurrentCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'"
              >
                <Icon :name="isCurrentCorrect ? 'uil:check-circle' : 'uil:info-circle'" class="w-5 h-5" />
                <span>{{ isCurrentCorrect ? 'Đúng rồi!' : `Gợi ý: "${currentQuestion.solution}" — lỗi cũng là tín hiệu học.` }}</span>
              </div>
            </div>

            <!-- Bottom Action Footer -->
            <div class="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                v-if="!isSubmitted"
                @click="checkAnswer"
                :disabled="!canSubmit"
                class="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                Kiểm tra đáp án
              </button>
              <button
                v-else
                @click="nextQuestion"
                class="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <span>{{ isLastQuestion ? 'Hoàn thành bài Quiz' : 'Câu tiếp theo' }}</span>
                <Icon name="uil:arrow-right" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Quiz Finished Screen (Kèm thưởng XP & Streak) -->
        <div v-else class="max-w-md mx-auto text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm space-y-6">
          <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Icon name="uil:trophy" class="w-10 h-10" />
          </div>
          <div>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">Xuất sắc!</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Bạn đã hoàn thành bài tập trắc nghiệm & ghép câu.</p>
          </div>

          <!-- Phần thưởng XP & Streak -->
          <div class="grid grid-cols-2 gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 rounded-2xl border border-amber-500/20">
            <div class="flex items-center justify-center gap-2">
              <span class="text-2xl">⚡</span>
              <div class="text-left">
                <span class="block text-lg font-black text-amber-600 dark:text-amber-400">+{{ score * 15 }} XP</span>
                <span class="text-sm font-bold text-slate-400 uppercase">Điểm kinh nghiệm</span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
              <span class="text-2xl">🔥</span>
              <div class="text-left">
                <span class="block text-lg font-black text-orange-600 dark:text-orange-400">{{ userStreak }} Ngày</span>
                <span class="text-sm font-bold text-slate-400 uppercase">Chuỗi Streak</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl flex justify-around border border-slate-100 dark:border-slate-800">
            <div>
              <span class="block text-3xl font-extrabold text-primary-500">{{ score }} / {{ questions.length }}</span>
              <span class="text-xs font-bold text-slate-400 uppercase">Số câu đúng</span>
            </div>
            <div>
              <span class="block text-3xl font-extrabold text-emerald-500">{{ Math.round((score / (questions.length || 1)) * 100) }}%</span>
              <span class="text-xs font-bold text-slate-400 uppercase">Tỷ lệ chính xác</span>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="resetQuiz"
              class="flex-1 py-3.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Học lại
            </button>
            <NuxtLink
              to="/dictionary"
              class="flex-1 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center"
            >
              Chủ đề khác
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Create Lesson Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Tạo Bài Học (Lesson) Mới</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="uil:times" class="w-6 h-6" />
          </button>
        </div>

        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tên bài học (Title)</label>
            <input v-model="newLessonForm.title" type="text" placeholder="Ví dụ: Luyện nói chủ đề Gia đình" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Slug URL</label>
              <input v-model="newLessonForm.slug" type="text" placeholder="gia-dinh-familie" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Ngôn ngữ</label>
              <select v-model="newLessonForm.language" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500">
                <option value="de">🇩🇪 Tiếng Đức</option>
                <option value="cs">🇨🇿 Tiếng Séc</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Cấp độ</label>
              <select v-model="newLessonForm.level" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500">
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả bài học</label>
            <input v-model="newLessonForm.description" type="text" placeholder="Mô tả ngắn gọn..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Đoạn văn đọc tiếng Đức/Séc</label>
            <textarea v-model="newLessonForm.paragraph" rows="3" placeholder="Đoạn văn chính..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500"></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Dịch nghĩa tiếng Việt / Anh</label>
            <textarea v-model="newLessonForm.englishTranslation" rows="2" placeholder="Bản dịch tham khảo..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary-500"></textarea>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <LessonPracticeQuestionEditor
              v-model="createLessonQuestions"
              :show-save="false"
              title="Câu hỏi Practice (tuỳ chọn)"
            />
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button @click="showCreateModal = false" class="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm">
            Hủy
          </button>
          <button @click="submitNewLesson" :disabled="creatingLesson" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center gap-2">
            <Icon v-if="creatingLesson" name="uil:spinner" class="w-4 h-4 animate-spin" />
            <span>Tạo bài học</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Manage Practice Modal -->
    <div v-if="showManagePractice && topicData?.id" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Quản lý Practice</h3>
          <button @click="showManagePractice = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="uil:times" class="w-6 h-6" />
          </button>
        </div>
        <LessonPracticeQuestionEditor
          v-model="managePracticeQuestions"
          :topic-id="topicData.id"
          :can-generate="hasVocabWords"
          title="Câu hỏi của bài học"
          @saved="onPracticeSaved"
        />
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            @click="showManagePractice = false"
            class="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
