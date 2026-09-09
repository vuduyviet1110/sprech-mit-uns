<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'

definePageMeta({ layout: 'page' })
useHead({ title: '⚡ Đấu trường Quiz 60s - Sprech Mit Uns' })

const { playSound, triggerConfetti } = useGamification()

// Game States
const gameState = ref<'lobby' | 'playing' | 'gameover'>('lobby')
const timeLeft = ref(60)
const timer = ref<any>(null)
const questions = ref<any[]>([])
const currentIdx = ref(0)
const score = ref(0)
const comboCount = ref(0)
const maxCombo = ref(0)
const highScore = ref(0)
const isSubmitted = ref(false)
const selectedChoiceIdx = ref<number | null>(null)

// Sentence Builder States
const selectedWords = ref<string[]>([])
const selectedOptions = ref<string[]>([])
const inputSentence = ref('')
const isCurrentCorrect = ref(false)
const isAudioPlaying = ref(false)

const playQuestionAudio = (q: any) => {
  if (!q) return
  const textToSpeak = q.targetSentence || q.solution || q.text || ''
  if (!textToSpeak) return

  if (q.audioUrl) {
    try {
      const audio = new Audio(q.audioUrl)
      isAudioPlaying.value = true
      audio.play()
      audio.onended = () => { isAudioPlaying.value = false }
      audio.onerror = () => { isAudioPlaying.value = false }
    } catch {
      isAudioPlaying.value = false
    }
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'de-DE'
      utterance.rate = 0.85
      isAudioPlaying.value = true
      utterance.onend = () => { isAudioPlaying.value = false }
      utterance.onerror = () => { isAudioPlaying.value = false }
      window.speechSynthesis.speak(utterance)
    } catch {
      isAudioPlaying.value = false
    }
  }
}

onMounted(() => {
  const saved = localStorage.getItem('speed_quiz_high_score')
  if (saved) highScore.value = parseInt(saved, 10)
})

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)

const multiplier = computed(() => {
  if (comboCount.value >= 10) return 5
  if (comboCount.value >= 5) return 3
  if (comboCount.value >= 3) return 2
  return 1
})

const xpGained = computed(() => score.value * 15)

const startGame = async () => {
  const data = await $fetch<any[]>('/api/quiz/random')
  if (!data || !data.length) return

  questions.value = data
  currentIdx.value = 0
  score.value = 0
  comboCount.value = 0
  maxCombo.value = 0
  timeLeft.value = 60
  gameState.value = 'playing'
  resetQuestionState()

  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      if (timeLeft.value === 5) playSound('wrong')
    } else {
      endGame()
    }
  }, 1000)
}

const resetQuestionState = () => {
  isSubmitted.value = false
  selectedChoiceIdx.value = null
  inputSentence.value = ''
  isCurrentCorrect.value = false
  selectedOptions.value = []

  const q = currentQuestion.value
  if (q?.type === 'sentence_builder') {
    const wordCount = q.scrambleWords?.length || 3
    selectedWords.value = Array(wordCount).fill('')
  } else {
    selectedWords.value = []
  }

  if (q?.type === 'dictation') {
    playQuestionAudio(q)
  }
}

watch(currentQuestion, () => {
  resetQuestionState()
})

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

const selectChoice = (index: number) => {
  if (isSubmitted.value) return
  selectedChoiceIdx.value = index
  submitAnswer()
}

const canSubmit = computed(() => {
  if (!currentQuestion.value) return false
  const qType = currentQuestion.value.type || 'multiple_choice'
  if (qType === 'multiple_choice') return selectedChoiceIdx.value !== null
  if (qType === 'sentence_builder') return selectedWords.value.filter(Boolean).length > 0
  if (qType === 'dictation') return inputSentence.value.trim().length > 0
  return false
})

const submitAnswer = () => {
  if (isSubmitted.value || !canSubmit.value || !currentQuestion.value) return

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
  } else if (qType === 'dictation') {
    const cleanInput = inputSentence.value.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    const cleanSolution = (q.solution || q.targetSentence || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    isCorrect = cleanInput === cleanSolution
  }

  isCurrentCorrect.value = isCorrect
  isSubmitted.value = true

  if (isCorrect) {
    playSound('correct')
    comboCount.value++
    if (comboCount.value > maxCombo.value) maxCombo.value = comboCount.value
    score.value += 10 * multiplier.value
  } else {
    playSound('wrong')
    comboCount.value = 0
  }

  setTimeout(() => {
    if (currentIdx.value < questions.value.length - 1) {
      currentIdx.value++
    } else {
      endGame()
    }
  }, 1000)
}

const endGame = () => {
  if (timer.value) clearInterval(timer.value)
  gameState.value = 'gameover'

  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('speed_quiz_high_score', score.value.toString())
    triggerConfetti()
  }
}

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>

<template>
  <LayoutPageWrapper>
    <!-- Standard Header -->
    <LayoutPageHeader>
      <LayoutPageTitle text="⚡ Đấu Trường Quiz 60s" />
      <p class="text-slate-500 dark:text-slate-400 text-base">
        Rèn luyện phản xạ ngẫu nhiên toàn bộ từ vựng & ngữ pháp với chuỗi Combo nhân XP.
      </p>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="max-w-3xl mx-auto">
        <!-- LOBBY STATE -->
        <div v-if="gameState === 'lobby'" class="text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm space-y-6">
          <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-primary-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Icon name="lucide:zap" class="w-10 h-10" />
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">Sẵn Sàng Thách Thức?</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              60 giây liên tục. Trả lời đúng nhiều câu liên tiếp để kích hoạt Combo x2, x3, x5 XP!
            </p>
          </div>

          <!-- High Score Card -->
          <div class="inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-xl">
            <Icon name="lucide:trophy" class="w-6 h-6 text-amber-500" />
            <div class="text-left">
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kỷ Lục Điểm Cao</span>
              <span class="text-xl font-black text-primary-500">{{ highScore }} ĐIỂM</span>
            </div>
          </div>

          <div>
            <button
              @click="startGame"
              class="bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg rounded-xl px-8 py-3.5 shadow-sm transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <Icon name="lucide:play" class="w-5 h-5 fill-current" />
              <span>Bắt Đầu Ngay</span>
            </button>
          </div>
        </div>

        <!-- PLAYING STATE -->
        <div v-else-if="gameState === 'playing' && currentQuestion" class="space-y-6">
          <!-- Top Stats Bar -->
          <div class="grid grid-cols-3 gap-4">
            <!-- Timer Bar -->
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <Icon name="lucide:timer" class="w-6 h-6" :class="timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'" />
              <div>
                <span class="block text-xl font-black" :class="timeLeft <= 10 ? 'text-red-500' : 'text-slate-900 dark:text-white'">{{ timeLeft }}s</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Thời Gian</span>
              </div>
            </div>

            <!-- Score Card -->
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <Icon name="lucide:sparkles" class="w-6 h-6 text-amber-500" />
              <div>
                <span class="block text-xl font-black text-primary-500">{{ score }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Điểm Số</span>
              </div>
            </div>

            <!-- Combo Multiplier -->
            <div class="bg-primary-500 p-4 rounded-2xl text-white flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2">
                <Icon name="lucide:flame" class="w-6 h-6 fill-current text-orange-300" />
                <div>
                  <span class="block text-xl font-black">x{{ multiplier }}</span>
                  <span class="text-[10px] font-bold uppercase opacity-90">Combo: {{ comboCount }}</span>
                </div>
              </div>
              <span v-if="multiplier > 1" class="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black uppercase">
                FEVER
              </span>
            </div>
          </div>

          <!-- Question Card -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm space-y-6">
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
              {{ currentQuestion.text }}
            </h3>

            <!-- Dạng 1: Trắc nghiệm -->
            <div v-if="currentQuestion.type === 'multiple_choice' || !currentQuestion.type" class="space-y-3">
              <button
                v-for="choice in currentQuestion.choices"
                :key="choice.id"
                @click="selectChoice(choice.index)"
                :disabled="isSubmitted"
                :class="[
                  'w-full text-left p-4 rounded-xl border-2 font-bold text-base transition-all flex items-center justify-between cursor-pointer',
                  selectedChoiceIdx === choice.index
                    ? isSubmitted
                      ? choice.isCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      : 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                ]"
              >
                <span>{{ choice.text }}</span>
                <Icon v-if="isSubmitted && choice.isCorrect" name="lucide:check-circle2" class="w-6 h-6 text-emerald-500" />
              </button>
            </div>

            <!-- Dạng 2: Sentence Builder -->
            <div v-else-if="currentQuestion.type === 'sentence_builder'" class="space-y-6 text-center">
              <div class="min-h-[64px] p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 flex flex-wrap items-center justify-center gap-2 transition-all">
                <template v-if="selectedWords.filter(Boolean).length > 0">
                  <button
                    v-for="(word, i) in selectedWords.filter(Boolean)"
                    :key="i"
                    @click="removeWord(selectedWords.indexOf(word))"
                    title="Bấm để bỏ từ"
                    class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{{ word }}</span>
                    <Icon name="lucide:x" class="w-3.5 h-3.5 opacity-70" />
                  </button>
                </template>
                <div v-else class="text-slate-400 dark:text-slate-500 text-xs font-semibold italic">
                  Bấm các từ bên dưới để ghép thành câu hoàn chỉnh theo hàng ngang
                </div>
              </div>

              <div class="flex flex-wrap justify-center gap-2.5">
                <button
                  v-for="(word, i) in currentQuestion.scrambleWords"
                  :key="i"
                  :disabled="isSubmitted || selectedWords.includes(word)"
                  :class="[
                    'px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer border',
                    selectedWords.includes(word)
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95'
                  ]"
                  @click="handleSelectOption(word)"
                >
                  {{ word }}
                </button>
              </div>

              <button
                v-if="!isSubmitted"
                @click="submitAnswer"
                :disabled="!canSubmit"
                class="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl px-6 py-2.5 shadow-sm transition-all"
              >
                Gửi đáp án
              </button>
            </div>

            <!-- Dạng 3: Dictation (Nghe & gõ lại câu) -->
            <div v-else-if="currentQuestion.type === 'dictation'" class="space-y-6 text-center">
              <div class="flex justify-center my-4">
                <button
                  type="button"
                  @click="playQuestionAudio(currentQuestion)"
                  class="flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Icon
                    :name="isAudioPlaying ? 'lucide:volume-2' : 'lucide:volume-x'"
                    class="w-7 h-7"
                    :class="{ 'animate-pulse': isAudioPlaying }"
                  />
                  <span class="text-base">{{ isAudioPlaying ? 'Đang phát âm thanh...' : 'Nghe lại phát âm' }}</span>
                </button>
              </div>

              <div class="space-y-3 max-w-lg mx-auto">
                <input
                  v-model="inputSentence"
                  :disabled="isSubmitted"
                  type="text"
                  placeholder="Nhập lại câu tiếng Đức bạn nghe được..."
                  class="w-full text-center border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-3.5 text-lg font-medium focus:outline-none focus:border-primary-500 disabled:opacity-60"
                  @keyup.enter="submitAnswer"
                />
                <button
                  v-if="!isSubmitted"
                  @click="submitAnswer"
                  :disabled="!canSubmit"
                  class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl px-6 py-3 shadow-sm transition-all cursor-pointer"
                >
                  Gửi đáp án
                </button>
              </div>

              <div v-if="isSubmitted && !isCurrentCorrect" class="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-sm font-semibold">
                Đáp án đúng: <span class="font-extrabold">{{ currentQuestion.solution || currentQuestion.targetSentence }}</span>
              </div>
            </div>

            <!-- Feedback Status -->
            <div v-if="isSubmitted" class="p-3 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2" :class="isCurrentCorrect ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'">
              <Icon :name="isCurrentCorrect ? 'lucide:sparkles' : 'lucide:alert-circle'" class="w-5 h-5" />
              <span>{{ isCurrentCorrect ? 'Chính xác! +' + (10 * multiplier) + ' điểm' : 'Sai rồi! Mất chuỗi Combo' }}</span>
            </div>
          </div>
        </div>

        <!-- GAMEOVER STATE -->
        <div v-else-if="gameState === 'gameover'" class="text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm space-y-6">
          <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-primary-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Icon name="lucide:trophy" class="w-10 h-10" />
          </div>

          <div class="space-y-1">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">HẾT GIỜ!</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm">Bạn đã hoàn thành lượt thách thức 60 giây.</p>
          </div>

          <!-- Score Breakdown -->
          <div class="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span class="block text-2xl font-black text-primary-500">{{ score }}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase">Tổng Điểm</span>
            </div>
            <div>
              <span class="block text-2xl font-black text-orange-500">🔥 {{ maxCombo }}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase">Combo Tối Đa</span>
            </div>
            <div>
              <span class="block text-2xl font-black text-emerald-500">+{{ xpGained }}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase">XP Nhận Được</span>
            </div>
          </div>

          <div class="flex gap-4 justify-center">
            <button
              @click="startGame"
              class="bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl px-6 py-3 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Icon name="lucide:rotate-ccw" class="w-5 h-5" />
              <span>Chơi Lại Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

