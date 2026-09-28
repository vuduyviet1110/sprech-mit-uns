<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ArenaQuestionPanel from '~/components/awesome/quiz/ArenaQuestionPanel.vue'

const emit = defineEmits(['back'])

const { playSound, triggerConfetti } = useGamification()

const bossMaxHp = 100
const bossHp = ref(100)
const playerHp = ref(3) // 3 hearts
const isBossDamaged = ref(false)
const isPlayerDamaged = ref(false)
const floatingDamage = ref<number | null>(null)

const questions = ref<any[]>([])
const currentIdx = ref(0)
const advancing = ref(false)
const gameState = ref<'playing' | 'victory' | 'defeat'>('playing')
const isLoading = ref(true)
const panelKey = ref(0)

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)

const fetchQuestions = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<any[]>(
      '/api/quiz/random?types=multiple_choice,dictation,sentence_builder&limit=40',
    )
    if (data && data.length) {
      questions.value = data
    }
  } catch (err) {
    console.error('Error fetching questions for boss fight:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchQuestions()
})

const restartGame = () => {
  bossHp.value = 100
  playerHp.value = 3
  currentIdx.value = 0
  advancing.value = false
  panelKey.value++
  gameState.value = 'playing'
  fetchQuestions()
}

const onAnswered = (payload: { isCorrect: boolean }) => {
  if (advancing.value || gameState.value !== 'playing' || !currentQuestion.value) return
  advancing.value = true

  if (payload.isCorrect) {
    playSound('correct')
    const damage = 25
    floatingDamage.value = damage
    bossHp.value = Math.max(0, bossHp.value - damage)
    isBossDamaged.value = true

    setTimeout(() => {
      isBossDamaged.value = false
      floatingDamage.value = null
    }, 800)

    if (bossHp.value <= 0) {
      setTimeout(() => {
        gameState.value = 'victory'
        playSound('complete')
        triggerConfetti()
      }, 600)
      return
    }
  } else {
    playSound('wrong')
    playerHp.value = Math.max(0, playerHp.value - 1)
    isPlayerDamaged.value = true

    setTimeout(() => {
      isPlayerDamaged.value = false
    }, 600)

    if (playerHp.value <= 0) {
      setTimeout(() => {
        gameState.value = 'defeat'
      }, 600)
      return
    }
  }

  const delay = currentQuestion.value.type === 'multiple_choice' ? 1000 : 1400
  setTimeout(() => {
    if (currentIdx.value < questions.value.length - 1) {
      currentIdx.value++
      panelKey.value++
      advancing.value = false
    } else if (bossHp.value > 0) {
      gameState.value = 'defeat'
    }
  }, delay)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span>Trở về danh mục</span>
      </button>

      <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5">
        <Icon name="lucide:swords" class="w-4 h-4" />
        <span>Boss Arena Lv.99</span>
      </span>
    </div>

    <!-- Active Boss Arena Stage -->
    <div v-if="gameState === 'playing'" class="space-y-6 max-w-2xl mx-auto">
      <!-- Boss & Player Status Surface -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <!-- Boss Avatar & HP Bar -->
        <div class="text-center space-y-3 relative">
          <!-- Floating Damage Tag -->
          <div
            v-if="floatingDamage"
            class="absolute top-0 right-1/4 text-2xl font-black text-red-500 animate-bounce transition-all"
          >
            -{{ floatingDamage }} HP
          </div>

          <div
            class="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner transition-transform duration-200"
            :class="isBossDamaged ? 'scale-110 bg-red-100 dark:bg-red-950 text-red-500 ring-4 ring-red-400' : ''"
          >
            👾
          </div>

          <div>
            <h4 class="font-extrabold text-base text-slate-900 dark:text-white">Vokabel Monster (Lv.99)</h4>
            <span class="text-xs font-bold text-slate-400">HP: {{ bossHp }} / {{ bossMaxHp }}</span>
          </div>

          <!-- HP Progress Bar -->
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              class="bg-red-500 h-full rounded-full transition-all duration-300"
              :style="{ width: `${(bossHp / bossMaxHp) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Player Hearts Status -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span class="text-xs font-bold uppercase text-slate-400">Mạng Của Bạn:</span>
          <div class="flex items-center gap-1.5" :class="isPlayerDamaged ? 'animate-bounce' : ''">
            <Icon
              v-for="h in 3"
              :key="h"
              name="lucide:heart"
              class="w-6 h-6 transition-colors"
              :class="h <= playerHp ? 'text-red-500 fill-current' : 'text-slate-300 dark:text-slate-700'"
            />
          </div>
        </div>
      </div>

      <!-- Question Card -->
      <div v-if="currentQuestion" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        <ArenaQuestionPanel
          :key="`${currentQuestion.id}-${panelKey}`"
          :question="currentQuestion"
          auto-submit-mc
          @answered="onAnswered"
        />
      </div>

      <div v-else-if="isLoading" class="text-center text-sm text-slate-400 font-semibold py-8">
        Đang tải câu hỏi...
      </div>
    </div>

    <!-- Victory Screen -->
    <div v-else-if="gameState === 'victory'" class="text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 max-w-xl mx-auto">
      <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <Icon name="lucide:trophy" class="w-8 h-8" />
      </div>

      <div class="space-y-1">
        <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">HẠ GỤC BOSS THÀNH CÔNG!</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Bạn đã đánh bại Vokabel Monster nhờ vốn từ vựng xuất sắc.
        </p>
      </div>

      <div>
        <button
          @click="restartGame"
          class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
        >
          <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
          <span>Thách Thức Lượt Mới</span>
        </button>
      </div>
    </div>

    <!-- Defeat Screen -->
    <div v-else-if="gameState === 'defeat'" class="text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 max-w-xl mx-auto">
      <div class="w-16 h-16 bg-red-50 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto">
        <Icon name="lucide:skull" class="w-8 h-8" />
      </div>

      <div class="space-y-1">
        <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">BẠN ĐÃ THẤT BẠI!</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Vokabel Monster đã chiến thắng lượt này. Hãy ôn luyện lại từ vựng và quay lại thách thức!
        </p>
      </div>

      <div>
        <button
          @click="restartGame"
          class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
        >
          <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
          <span>Thử Lại Ngay</span>
        </button>
      </div>
    </div>
  </div>
</template>
