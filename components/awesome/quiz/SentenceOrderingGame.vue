<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  language?: string
}>()

const emit = defineEmits(['back'])

const { playSound, triggerConfetti } = useGamification()

const questions = ref<any[]>([])
const currentIdx = ref(0)
const selectedWords = ref<string[]>([])
const availableWords = ref<string[]>([])
const isSubmitted = ref(false)
const isCorrect = ref(false)
const isLoading = ref(true)
const score = ref(0)
const streak = ref(0)

const draggedWordInfo = ref<{ word: string; from: 'available' | 'selected'; index: number } | null>(null)
const isDraggingOverDropzone = ref(false)

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)

const fetchQuestions = async () => {
  try {
    isLoading.value = true
    currentIdx.value = 0
    score.value = 0
    streak.value = 0

    const data = await $fetch<any[]>('/api/quiz/random?types=sentence_builder&limit=30')
    if (data && data.length) {
      questions.value = data.map((q) => {
        if (!q.scrambleWords || !q.scrambleWords.length) {
          const sentence = q.solution || q.targetSentence || q.text || ''
          const words = sentence.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(' ').filter(Boolean)
          return {
            ...q,
            type: 'sentence_builder',
            scrambleWords: [...words].sort(() => 0.5 - Math.random()),
            solution: sentence,
          }
        }
        return q
      })
      setupQuestion()
    }
  } catch (err) {
    console.error('Error fetching sentence ordering questions:', err)
  } finally {
    isLoading.value = false
  }
}

const setupQuestion = () => {
  isSubmitted.value = false
  isCorrect.value = false
  selectedWords.value = []
  draggedWordInfo.value = null
  isDraggingOverDropzone.value = false

  if (currentQuestion.value) {
    availableWords.value = [...(currentQuestion.value.scrambleWords || [])]
  }
}

onMounted(() => {
  fetchQuestions()
})

const addWord = (word: string, index: number) => {
  if (isSubmitted.value) return
  selectedWords.value.push(word)
  availableWords.value.splice(index, 1)
  playSound('correct')
}

const removeWord = (word: string, index: number) => {
  if (isSubmitted.value) return
  selectedWords.value.splice(index, 1)
  availableWords.value.push(word)
}

// Drag and Drop Logic
const onDragStart = (word: string, from: 'available' | 'selected', index: number, event: DragEvent) => {
  if (isSubmitted.value) return
  draggedWordInfo.value = { word, from, index }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({ word, from, index }))
  }
}

const onDragOverZone = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  isDraggingOverDropzone.value = true
}

const onDragLeaveZone = () => {
  isDraggingOverDropzone.value = false
}

const dropInsertIndex = ref<number | null>(null)

const onDragOverItem = (index: number, event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropInsertIndex.value = index
  isDraggingOverDropzone.value = true
}

const onDropOnItem = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDraggingOverDropzone.value = false
  const insertIdx = dropInsertIndex.value !== null ? dropInsertIndex.value : targetIndex
  dropInsertIndex.value = null

  if (isSubmitted.value) return

  let info = draggedWordInfo.value
  if (!info && event.dataTransfer) {
    try {
      const data = event.dataTransfer.getData('text/plain')
      if (data) info = JSON.parse(data)
    } catch (e) {
      // ignore
    }
  }

  if (!info) return

  if (info.from === 'available') {
    // Insert word from available list into selectedWords at insertIdx
    selectedWords.value.splice(insertIdx, 0, info.word)
    availableWords.value.splice(info.index, 1)
    playSound('correct')
  } else if (info.from === 'selected') {
    // Reorder inside selectedWords
    const [movedWord] = selectedWords.value.splice(info.index, 1)
    let finalIdx = insertIdx
    if (info.index < insertIdx) finalIdx--
    selectedWords.value.splice(finalIdx, 0, movedWord)
    playSound('correct')
  }

  draggedWordInfo.value = null
}

const onDropInZone = (event: DragEvent) => {
  event.preventDefault()
  isDraggingOverDropzone.value = false
  const insertIdx = dropInsertIndex.value !== null ? dropInsertIndex.value : selectedWords.value.length
  dropInsertIndex.value = null

  if (isSubmitted.value) return

  let info = draggedWordInfo.value
  if (!info && event.dataTransfer) {
    try {
      const data = event.dataTransfer.getData('text/plain')
      if (data) info = JSON.parse(data)
    } catch (e) {
      // ignore
    }
  }

  if (info && info.from === 'available') {
    selectedWords.value.splice(insertIdx, 0, info.word)
    availableWords.value.splice(info.index, 1)
    playSound('correct')
  }
  draggedWordInfo.value = null
}

const resetSentence = () => {
  if (isSubmitted.value || !currentQuestion.value) return
  setupQuestion()
}

const checkSentence = () => {
  if (isSubmitted.value || !currentQuestion.value || selectedWords.value.length === 0) return
  isSubmitted.value = true

  const userSentence = selectedWords.value.join(' ').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
  const solutionSentence = (currentQuestion.value.solution || currentQuestion.value.targetSentence || '')
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')

  isCorrect.value = userSentence === solutionSentence

  if (isCorrect.value) {
    playSound('correct')
    streak.value++
    score.value += 150 + streak.value * 20
  } else {
    playSound('wrong')
    streak.value = 0
  }
}

const nextQuestion = () => {
  if (currentIdx.value < questions.value.length - 1) {
    currentIdx.value++
    setupQuestion()
  } else {
    playSound('complete')
    triggerConfetti()
    fetchQuestions()
  }
}

const speakSentence = (text: string) => {
  speakText(text, props.language || 'de')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-xs">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span>Trở về</span>
      </button>

      <div class="flex items-center gap-4">
        <!-- Streak -->
        <div class="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-xl text-orange-600 dark:text-orange-400 font-extrabold text-sm">
          <Icon name="lucide:flame" class="w-4 h-4 text-orange-500 fill-current" />
          <span>Combo: {{ streak }}</span>
        </div>

        <!-- Score -->
        <div class="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
          <Icon name="lucide:sparkles" class="w-4 h-4 text-emerald-500" />
          <span>{{ score }} Pts</span>
        </div>
      </div>
    </div>

    <!-- Main Game Box -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-500 font-bold text-sm">Đang tải bài tập sắp xếp ngữ pháp...</p>
    </div>

    <div v-else-if="currentQuestion" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div class="text-center space-y-3">
        <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
          Sắp Xếp Cấu Trúc Câu (Wortstellung)
        </span>
        <div class="flex items-center justify-center gap-3">
          <h3 class="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
            {{ currentQuestion.text }}
          </h3>
          <button
            @click="speakSentence(currentQuestion.solution || currentQuestion.targetSentence || '')"
            class="p-2.5 bg-primary-50 dark:bg-primary-950/80 hover:bg-primary-500 hover:text-white text-primary-600 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Nghe phát âm câu mẫu"
          >
            <Icon name="lucide:volume-2" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Target Drop Zone Area (Drag and Drop Supported) -->
      <div
        @dragover="onDragOverZone"
        @dragleave="onDragLeaveZone"
        @drop="onDropInZone"
        :class="[
          'min-h-[100px] p-5 rounded-2xl border-2 transition-all flex flex-wrap items-center justify-center gap-2.5 relative',
          isDraggingOverDropzone
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-4 ring-primary-500/20 scale-[1.01]'
            : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
        ]"
      >
        <template v-if="selectedWords.length > 0">
          <div
            v-for="(word, index) in selectedWords"
            :key="`sel-${index}`"
            class="relative flex items-center gap-2"
            @dragover="onDragOverItem(index, $event)"
            @drop="onDropOnItem(index, $event)"
          >
            <!-- Drop Insertion Indicator Line (before word) -->
            <div
              v-if="dropInsertIndex === index"
              class="w-1 h-9 bg-primary-500 rounded-full animate-pulse shadow-md"
            ></div>

            <button
              :draggable="!isSubmitted"
              @dragstart="onDragStart(word, 'selected', index, $event)"
              @click="removeWord(word, index)"
              :disabled="isSubmitted"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary-300"
            >
              <Icon name="lucide:grip-vertical" class="w-4 h-4 opacity-60" />
              <span>{{ word }}</span>
              <Icon name="lucide:x" class="w-4 h-4 opacity-70" />
            </button>
          </div>

          <!-- Drop Insertion Indicator Line (at end of list) -->
          <div
            v-if="dropInsertIndex === selectedWords.length"
            class="w-1 h-9 bg-primary-500 rounded-full animate-pulse shadow-md"
          ></div>
        </template>
        <p v-else class="text-slate-400 dark:text-slate-500 text-sm font-semibold italic flex items-center gap-2">
          <Icon name="lucide:move" class="w-4 h-4 text-primary-500" />
          <span>Kéo thả vào vị trí bất kỳ hoặc bấm các thẻ từ bên dưới để ghép câu</span>
        </p>
      </div>

      <!-- Scrambled Available Word Chips (Draggable) -->
      <div class="flex flex-wrap justify-center gap-3 py-2">
        <button
          v-for="(word, index) in availableWords"
          :key="`avail-${index}`"
          :draggable="!isSubmitted"
          @dragstart="onDragStart(word, 'available', index, $event)"
          @click="addWord(word, index)"
          :disabled="isSubmitted"
          class="pl-3 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-extrabold text-base rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5"
        >
          <Icon name="lucide:grip-vertical" class="w-4 h-4 text-slate-400 shrink-0" />
          <span>{{ word }}</span>
        </button>
      </div>

      <!-- Submit & Control Buttons -->
      <div class="flex items-center justify-center gap-4 pt-2">
        <button
          v-if="!isSubmitted"
          @click="resetSentence"
          class="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          Xóa làm lại
        </button>

        <button
          v-if="!isSubmitted"
          @click="checkSentence"
          :disabled="selectedWords.length === 0"
          class="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-base rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Icon name="lucide:check-circle" class="w-5 h-5" />
          <span>Kiểm Tra</span>
        </button>

        <button
          v-else
          @click="nextQuestion"
          class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-black text-base rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>Câu Tiếp Theo</span>
          <Icon name="lucide:arrow-right" class="w-5 h-5" />
        </button>
      </div>

      <!-- Result Banner -->
      <div v-if="isSubmitted" class="p-4 rounded-2xl text-center space-y-2" :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'">
        <div class="flex items-center justify-center gap-2 font-black text-lg">
          <Icon :name="isCorrect ? 'lucide:sparkles' : 'lucide:alert-circle'" class="w-6 h-6" />
          <span>{{ isCorrect ? 'Chính Xác! Cấu trúc ngữ pháp chuẩn.' : 'Chưa Đúng Rồi!' }}</span>
        </div>
        <p v-if="!isCorrect" class="text-sm font-semibold">
          Đáp án đúng: <span class="font-extrabold underline">{{ currentQuestion.solution || currentQuestion.targetSentence }}</span>
        </p>

        <!-- Audio Speak Solution -->
        <button
          @click="speakSentence(currentQuestion.solution || currentQuestion.targetSentence)"
          class="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-900/50 font-bold text-xs hover:bg-white transition-colors cursor-pointer"
        >
          <Icon name="lucide:volume-2" class="w-4 h-4 text-primary-500" />
          <span>Nghe phát âm chuẩn</span>
        </button>
      </div>
    </div>
  </div>
</template>
