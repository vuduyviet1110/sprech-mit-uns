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
  <section class="py-16 px-4 bg-gradient-to-r from-indigo-50 to-purple-50">
    <div class="container mx-auto">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-bold text-blue-900 mb-4">
          Smart Flashcard System
        </h3>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Practice vocabulary with our spaced repetition system.
        </p>
      </div>

      <div class="max-w-md mx-auto">
        <!-- Session Stats -->
        <div class="flex justify-center gap-4 mb-6">
          <div class="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <Icon name="mdi:check-circle" class="h-5 w-5 text-green-600" />
            <span class="font-medium text-green-700">{{
              sessionStats.correct
            }}</span>
          </div>
          <div class="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Icon name="mdi:close-circle" class="h-5 w-5 text-red-600" />
            <span class="font-medium text-red-700">{{
              sessionStats.incorrect
            }}</span>
          </div>
          <div class="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Icon
              name="material-symbols-light:timer-10-alt-1-outline-sharp"
              class="h-5 w-5 text-blue-600"
            />
            <span class="font-medium text-blue-700">{{
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
              'bg-green-500': index < currentCard,
              'bg-blue-500': index === currentCard,
              'bg-gray-300': index > currentCard,
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
            class="w-full h-full transition-transform duration-700 preserve-3d relative"
            :class="{ 'rotate-y-180': isFlipped }"
            @click="isFlipped = !isFlipped"
          >
            <!-- Front -->
            <div
              class="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg flex flex-col justify-center items-center p-6"
            >
              <div class="mb-4 flex gap-2">
                <span
                  :class="getDifficultyColor(card?.difficulty || '')"
                  class="px-2 py-1 rounded text-xs border"
                >
                  {{ card?.difficulty }}
                </span>
                <span
                  class="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded"
                >
                  {{
                    card && card.topics && card.topics.length > 0
                      ? card.topics[0]
                      : 'General'
                  }}
                </span>
              </div>
              <h2 class="text-3xl font-bold text-blue-800 mb-2 text-center">
                {{ card?.meaning }}
              </h2>
              <p class="text-sm text-gray-600 text-center">
                What's the German translation?
              </p>
              <p class="mt-4 text-sm text-gray-400">Tap to reveal</p>
            </div>

            <!-- Back -->
            <div
              class="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg flex flex-col justify-center items-center p-6"
            >
              <h2 class="text-4xl font-bold text-green-900 mb-4 text-center">
                {{ card?.word }}
              </h2>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-gray-600">{{ card?.pronunciation }}</span>
                <button
                  class="border border-green-200 hover:bg-green-50 px-2 py-1 rounded"
                  @click.stop="playAudioOrSpeak(card as VocabularyWord)"
                >
                  🔊
                </button>
              </div>
              <p class="text-gray-600 text-center">"{{ card?.meaning }}"</p>
            </div>
          </div>
        </div>

        <!-- Word Progress -->
        <div
          v-if="wordsProgress[card?.id]"
          class="bg-gray-50 p-4 rounded-md text-sm text-gray-600 text-center mt-4"
        >
          <div class="flex justify-center gap-4">
            <span>✓ {{ wordsProgress[card.id].correctCount }}</span>
            <span>✗ {{ wordsProgress[card.id].incorrectCount }}</span>
            <span>🔥 {{ wordsProgress[card.id].streak }}</span>
            <span>⭐ Lv.{{ wordsProgress[card.id].masteryLevel }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-4 mt-6 min-h-[48px]">
          <transition name="fade-slide" mode="out-in">
            <template v-if="isFlipped && !showResult">
              <div key="buttons" class="flex justify-center gap-4">
                <button
                  class="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded"
                  @click="handleAnswer(false)"
                >
                  ❌ Hard
                </button>
                <button
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  @click="handleAnswer(true)"
                >
                  ✅ Easy
                </button>
              </div>
            </template>
            <template v-else-if="!showResult">
              <div
                key="placeholder"
                class="h-[44px] flex justify-center items-center"
              >
                <span>Sort the flashcards into difficulty levels</span>
              </div>
            </template>
            <template v-else>
              <div
                key="result"
                class="text-lg font-medium"
                :class="
                  sessionStats.correct > sessionStats.incorrect
                    ? 'text-green-600'
                    : 'text-red-600'
                "
              >
                {{
                  sessionStats.correct > sessionStats.incorrect
                    ? '✅ Correct!'
                    : '❌ Keep practicing!'
                }}
              </div>
            </template>
          </transition>
        </div>

        <!-- Session Complete -->
        <div v-if="currentCard >= props.flashcards.length" class="mt-6">
          <div
            class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-8 text-center"
          >
            <div class="text-4xl mb-4">🎉</div>
            <h3 class="text-2xl font-bold text-green-900 mb-4">
              Session Complete!
            </h3>
            <div class="space-y-2 mb-6">
              <div class="flex justify-center gap-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-700">
                    {{ sessionStats.correct }}
                  </div>
                  <div class="text-sm text-green-600">Correct</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-700">
                    {{ sessionStats.incorrect }}
                  </div>
                  <div class="text-sm text-red-600">Incorrect</div>
                </div>
              </div>
            </div>
            <button
              @click="resetSession"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <Icon
                name="material-symbols:refresh-rounded"
                class="h-4 w-4 mr-2"
              />
              Practice Again
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <div class="flex items-center justify-center mt-6">
          <button
            type="button"
            class="flex items-center text-gray-500 hover:text-gray-700"
            @click="resetSession"
          >
            <Icon name="material-symbols:refresh-rounded" aria-hidden="true" />
            <span class="ml-2">Reset Demo</span>
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
