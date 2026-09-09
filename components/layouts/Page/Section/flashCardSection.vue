<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { getWordProgress, updateWordProgress } from '~/utils/progressUtils'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  flashcards: VocabularyWord[]
}>()

const currentCard = ref(0)
const isFlipped = ref(false)
const showResult = ref(false)
const sessionStats = ref({ correct: 0, incorrect: 0, total: 0 })
const wordsProgress = ref<Record<string, any>>({})

onMounted(async () => {
  const progress: Record<string, any> = {}
  for (const card of props.flashcards) {
    progress[card.id] = (await getWordProgress('user123', card.id)) || {
      correctCount: 0,
      incorrectCount: 0,
      lastCorrect: false,
      isMastered: false,
      masteryLevel: 0,
      streak: 0,
      nextReviewAt: null,
    }
  }
  wordsProgress.value = progress
})

const card = computed(() => props.flashcards[currentCard.value])

function handleAnswer(isCorrect: boolean) {
  const currentProgress = wordsProgress.value[card.value.id] || {
    correctCount: 0,
    incorrectCount: 0,
    lastCorrect: false,
    isMastered: false,
    masteryLevel: 0,
    streak: 0,
    nextReviewAt: null,
  }

  const updatedProgress = { ...currentProgress }
  if (isCorrect) {
    updatedProgress.correctCount++
    updatedProgress.lastCorrect = true
    updatedProgress.streak++
    updatedProgress.masteryLevel = Math.min(5, updatedProgress.masteryLevel + 1)
    updatedProgress.nextReviewAt = new Date(
      Date.now() + 2 ** updatedProgress.masteryLevel * 24 * 60 * 60 * 1000,
    )
    sessionStats.value.correct++
  } else {
    updatedProgress.incorrectCount++
    updatedProgress.lastCorrect = false
    updatedProgress.streak = 0
    updatedProgress.masteryLevel = Math.max(0, updatedProgress.masteryLevel - 1)
    updatedProgress.nextReviewAt = new Date(Date.now() + 60 * 60 * 1000)
    sessionStats.value.incorrect++
  }

  updatedProgress.lastReviewedAt = new Date()
  updateWordProgress('user123', card.value.id, updatedProgress)
  wordsProgress.value[card.value.id] = updatedProgress
  sessionStats.value.total++

  showResult.value = true
  setTimeout(() => {
    showResult.value = false
    if (currentCard.value < props.flashcards.length - 1) {
      currentCard.value++
      isFlipped.value = false
    }
  }, 1000)
}

function resetSession() {
  currentCard.value = 0
  isFlipped.value = false
  showResult.value = false
  sessionStats.value = { correct: 0, incorrect: 0, total: 0 }
}

const { playAudioOrSpeak } = useAudioPlayback()

const getDifficultyColor = (difficulty: string) => {
  return (
    {
      easy: 'border-green-300 text-green-600',
      medium: 'border-yellow-300 text-yellow-600',
      hard: 'border-red-300 text-red-600',
    }[difficulty] || 'border-gray-300 text-gray-600'
  )
}
</script>

<template>
  <section class="py-16 px-4 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
    <div class="container mx-auto">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
          Smart Flashcard System
        </h3>
        <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
          Practice vocabulary with our spaced repetition system.
        </p>
      </div>

      <div class="max-w-md mx-auto">
        <!-- Session Stats -->
        <div class="flex justify-center gap-4 mb-6">
          <div class="flex items-center gap-2 bg-green-50 dark:bg-green-950/40 border border-green-200/70 dark:border-green-800/60 px-4 py-2 rounded-xl shadow-xs">
            <Icon name="mdi:check-circle" class="h-5 w-5 text-green-600 dark:text-green-400" />
            <span class="font-bold text-green-700 dark:text-green-300">{{
              sessionStats.correct
            }}</span>
          </div>
          <div class="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/60 px-4 py-2 rounded-xl shadow-xs">
            <Icon name="mdi:close-circle" class="h-5 w-5 text-red-600 dark:text-red-400" />
            <span class="font-bold text-red-700 dark:text-red-300">{{
              sessionStats.incorrect
            }}</span>
          </div>
          <div class="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 px-4 py-2 rounded-xl shadow-xs">
            <Icon
              name="material-symbols-light:timer-10-alt-1-outline-sharp"
              class="h-5 w-5 text-blue-600 dark:text-blue-400"
            />
            <span class="font-bold text-blue-700 dark:text-blue-300">{{
              sessionStats.total
            }}</span>
          </div>
        </div>

        <!-- Progress Indicators -->
        <div class="flex justify-center gap-2 mb-4">
          <div
            v-for="(_, index) in props.flashcards"
            :key="index"
            class="w-3 h-3 rounded-full transition-colors"
            :class="{
              'bg-green-500 dark:bg-green-400': index < currentCard,
              'bg-blue-500 dark:bg-blue-400': index === currentCard,
              'bg-slate-300 dark:bg-slate-700': index > currentCard,
            }"
          ></div>
        </div>

        <!-- Flashcard -->
        <div
          v-if="currentCard < props.flashcards.length"
          class="relative perspective w-full max-w-sm h-80 mx-auto transition-opacity duration-300"
          :class="{ 'opacity-50': showResult }"
        >
          <div
            class="w-full h-full transition-transform duration-700 preserve-3d relative cursor-pointer"
            :class="{ 'rotate-y-180': isFlipped }"
            @click="isFlipped = !isFlipped"
          >
            <!-- Front -->
            <div
              class="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 border border-blue-200/60 dark:border-slate-700 rounded-2xl shadow-xl flex flex-col justify-center items-center p-6"
            >
              <div class="mb-4 flex gap-2">
                <span
                  :class="getDifficultyColor(card?.difficulty || '')"
                  class="px-2.5 py-1 rounded-md text-xs font-semibold border dark:border-slate-600"
                >
                  {{ card?.difficulty }}
                </span>
                <span
                  class="px-2.5 py-1 text-xs border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-white/70 dark:bg-slate-800/80 rounded-md font-medium"
                >
                  {{
                    card && card.topics && card.topics.length > 0
                      ? card.topics[0]
                      : 'General'
                  }}
                </span>
              </div>
              <h2 class="text-3xl font-extrabold text-blue-900 dark:text-blue-200 mb-2 text-center">
                {{ card?.meaning }}
              </h2>
              <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
                What's the German translation?
              </p>
              <p class="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">Tap to reveal</p>
            </div>

            <!-- Back -->
            <div
              class="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/70 rounded-2xl shadow-xl flex flex-col justify-center items-center p-6"
            >
              <h2 class="text-4xl font-extrabold text-emerald-900 dark:text-emerald-300 mb-4 text-center">
                {{ card?.word }}
              </h2>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-slate-600 dark:text-slate-300 text-sm">{{ card?.pronunciation }}</span>
                <button
                  class="border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-1 rounded-md text-sm transition-colors flex items-center justify-center"
                  @click.stop="playAudioOrSpeak(card as VocabularyWord)"
                >
                  <Icon name="heroicons:speaker-wave" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              </div>
              <p class="text-slate-600 dark:text-slate-400 text-center text-sm">"{{ card?.meaning }}"</p>
            </div>
          </div>
        </div>

        <!-- Word Progress -->
        <div
          v-if="wordsProgress[card?.id]"
          class="bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 text-center mt-4 shadow-xs"
        >
          <div class="flex justify-center items-center gap-4 font-medium">
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:check" class="w-4 h-4 text-emerald-500" /> {{ wordsProgress[card.id].correctCount }}</span>
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:x-mark" class="w-4 h-4 text-red-500" /> {{ wordsProgress[card.id].incorrectCount }}</span>
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:fire-20-solid" class="w-4 h-4 text-orange-500" /> {{ wordsProgress[card.id].streak }}</span>
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:star-20-solid" class="w-4 h-4 text-amber-400" /> Lv.{{ wordsProgress[card.id].masteryLevel }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-4 mt-6 min-h-[48px]">
          <transition name="fade-slide" mode="out-in">
            <template v-if="isFlipped && !showResult">
              <div key="buttons" class="flex justify-center gap-4">
                <button
                  class="border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-5 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center gap-1.5"
                  @click="handleAnswer(false)"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5" /> Hard
                </button>
                <button
                  class="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors inline-flex items-center gap-1.5"
                  @click="handleAnswer(true)"
                >
                  <Icon name="heroicons:check" class="w-5 h-5" /> Easy
                </button>
              </div>
            </template>
            <template v-else-if="!showResult">
              <div
                key="placeholder"
                class="h-[44px] flex justify-center items-center text-slate-500 dark:text-slate-400 text-sm font-medium"
              >
                <span>Tap the card to flip, then rate difficulty</span>
              </div>
            </template>
            <template v-else>
              <div
                key="result"
                class="text-lg font-bold inline-flex items-center gap-2"
                :class="
                  sessionStats.correct > sessionStats.incorrect
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                "
              >
                <template v-if="sessionStats.correct > sessionStats.incorrect">
                  <Icon name="heroicons:check-circle-20-solid" class="w-6 h-6" /> Correct!
                </template>
                <template v-else>
                  <Icon name="heroicons:x-circle-20-solid" class="w-6 h-6" /> Keep practicing!
                </template>
              </div>
            </template>
          </transition>
        </div>

        <!-- Session Complete -->
        <div v-if="currentCard >= props.flashcards.length" class="mt-6">
          <div
            class="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl shadow-xl p-8 text-center"
          >
            <div class="text-4xl mb-4 flex justify-center">
              <Icon name="heroicons:sparkles-20-solid" class="w-12 h-12 text-amber-500" />
            </div>
            <h3 class="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mb-4">
              Session Complete!
            </h3>
            <div class="space-y-2 mb-6">
              <div class="flex justify-center gap-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {{ sessionStats.correct }}
                  </div>
                  <div class="text-sm text-emerald-600 dark:text-emerald-500">Correct</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-rose-700 dark:text-rose-400">
                    {{ sessionStats.incorrect }}
                  </div>
                  <div class="text-sm text-rose-600 dark:text-rose-500">Incorrect</div>
                </div>
              </div>
            </div>
            <button
              @click="resetSession"
              class="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md inline-flex items-center transition-colors"
            >
              <Icon
                name="material-symbols:refresh-rounded"
                class="h-5 w-5 mr-2"
              />
              Practice Again
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="flex items-center justify-center mt-6">
          <button
            type="button"
            class="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-colors"
            @click="resetSession"
          >
            <Icon name="material-symbols:refresh-rounded" aria-hidden="true" class="h-4 w-4 mr-1.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="css" scoped>
.perspective {
  perspective: 1000px;
}
.preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
