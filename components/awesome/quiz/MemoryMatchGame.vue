<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  language?: string
}>()

const emit = defineEmits(['back', 'pair-matched', 'complete'])

const { playSound, triggerConfetti } = useGamification()
const { recordMemoryPairMatch } = useDailyQuests()

interface Card {
  id: string
  pairId: string
  wordId: string
  content: string
  type: 'term' | 'meaning'
  language?: string
  pronunciation?: string
  example?: string
  isFlipped?: boolean
  isMatched?: boolean
}

const cards = ref<Card[]>([])
const flippedCards = ref<Card[]>([])
const moves = ref(0)
const matchedPairsCount = ref(0)
const totalPairs = ref(6)
const timerSeconds = ref(0)
const timerInterval = ref<any>(null)
const isGameOver = ref(false)
const isLoading = ref(true)
const comboStreak = ref(0)
const score = ref(0)

const fetchCards = async () => {
  try {
    isLoading.value = true
    isGameOver.value = false
    moves.value = 0
    matchedPairsCount.value = 0
    timerSeconds.value = 0
    comboStreak.value = 0
    score.value = 0
    flippedCards.value = []

    if (timerInterval.value) clearInterval(timerInterval.value)

    const data = await $fetch<any>(`/api/quiz/memory-match?lang=${props.language || 'de'}&limit=6`)
    if (data && data.cards) {
      cards.value = data.cards.map((c: any) => ({
        ...c,
        isFlipped: false,
        isMatched: false,
      }))
      totalPairs.value = data.totalPairs || 6
    }

    // Start timer
    timerInterval.value = setInterval(() => {
      if (!isGameOver.value) {
        timerSeconds.value++
      }
    }, 1000)
  } catch (err) {
    console.error('Error fetching cards:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCards()
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

const handleCardClick = (card: Card) => {
  if (card.isFlipped || card.isMatched || flippedCards.value.length >= 2) return

  // Play flip sound
  playSound('correct')

  card.isFlipped = true
  flippedCards.value.push(card)

  if (flippedCards.value.length === 2) {
    moves.value++
    const [card1, card2] = flippedCards.value

    if (card1.pairId === card2.pairId) {
      // MATCH!
      setTimeout(() => {
        card1.isMatched = true
        card2.isMatched = true
        matchedPairsCount.value++
        comboStreak.value++

        // Add score with bonus
        const bonus = comboStreak.value * 50
        score.value += 100 + bonus

        playSound('correct')
        flippedCards.value = []
        recordMemoryPairMatch(1)
        emit('pair-matched', { matched: matchedPairsCount.value, total: totalPairs.value })

        if (matchedPairsCount.value === totalPairs.value) {
          endGame()
        }
      }, 400)
    } else {
      // MISMATCH!
      comboStreak.value = 0
      setTimeout(() => {
        card1.isFlipped = false
        card2.isFlipped = false
        playSound('wrong')
        flippedCards.value = []
      }, 900)
    }
  }
}

const endGame = () => {
  isGameOver.value = true
  if (timerInterval.value) clearInterval(timerInterval.value)
  playSound('complete')
  triggerConfetti()
  emit('complete', { matched: matchedPairsCount.value, score: score.value })
}

const formattedTime = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Game Header & Controls -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-xs">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span>Trở về</span>
      </button>

      <div class="flex items-center gap-6">
        <!-- Timer -->
        <div class="flex items-center gap-2">
          <Icon name="lucide:clock" class="w-5 h-5 text-amber-500" />
          <span class="font-mono font-black text-lg text-slate-800 dark:text-slate-200">{{ formattedTime }}</span>
        </div>

        <!-- Moves -->
        <div class="flex items-center gap-2">
          <Icon name="lucide:footprints" class="w-5 h-5 text-primary-500" />
          <span class="font-extrabold text-sm text-slate-600 dark:text-slate-300">{{ moves }} Lượt lật</span>
        </div>

        <!-- Score -->
        <div class="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <Icon name="lucide:sparkles" class="w-5 h-5 text-emerald-500" />
          <span class="font-black text-base text-emerald-600 dark:text-emerald-300">{{ score }} Pts</span>
        </div>
      </div>

      <button
        @click="fetchCards"
        class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        title="Chia lại bài"
      >
        <Icon name="lucide:rotate-ccw" class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-500 font-bold text-sm">Đang chuẩn bị bộ thẻ từ vựng...</p>
    </div>

    <!-- Game Board Grid -->
    <div v-else-if="!isGameOver" class="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
      <div
        v-for="card in cards"
        :key="card.id"
        @click="handleCardClick(card)"
        :class="[
          'relative min-h-[110px] md:min-h-[130px] rounded-2xl border-2 p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 select-none shadow-sm',
          card.isMatched
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-40 scale-95 cursor-default'
            : card.isFlipped
              ? card.type === 'term'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 shadow-md scale-102'
                : 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-102'
        ]"
      >
        <!-- Card Front (When Flipped) -->
        <template v-if="card.isFlipped || card.isMatched">
          <span class="text-xs font-black uppercase tracking-wider mb-1 opacity-70" :class="card.type === 'term' ? 'text-primary-500' : 'text-primary-500'">
            {{ card.type === 'term' ? 'Từ vựng' : 'Ý nghĩa' }}
          </span>
          <p class="font-extrabold text-base md:text-lg leading-snug">
            {{ card.content }}
          </p>
          <span v-if="card.pronunciation" class="text-[11px] font-mono opacity-60 mt-1">
            [{{ card.pronunciation }}]
          </span>
        </template>

        <!-- Card Back (Covered) -->
        <template v-else>
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Icon name="lucide:help-circle" class="w-6 h-6" />
          </div>
          <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2">Sprech Game</span>
        </template>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-else class="text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm space-y-6 max-w-lg mx-auto">
      <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-primary-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <Icon name="lucide:trophy" class="w-10 h-10" />
      </div>

      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">XUẤT SẮC! HOÀN THÀNH</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Bạn đã ghép chính xác tất cả các cặp thẻ từ vựng.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div>
          <span class="block text-xl font-black text-primary-500">{{ moves }}</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase">Lượt Lật</span>
        </div>
        <div>
          <span class="block text-xl font-black text-amber-500">{{ formattedTime }}</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase">Thời Gian</span>
        </div>
        <div>
          <span class="block text-xl font-black text-emerald-500">+{{ score }}</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase">Điểm Thưởng</span>
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <button
          @click="fetchCards"
          class="bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl px-6 py-3 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Icon name="lucide:rotate-ccw" class="w-5 h-5" />
          <span>Chơi Ván Mới</span>
        </button>
      </div>
    </div>
  </div>
</template>
