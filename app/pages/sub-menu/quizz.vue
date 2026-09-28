<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import MemoryMatchGame from '~/components/awesome/quiz/MemoryMatchGame.vue'
import BossFightGame from '~/components/awesome/quiz/BossFightGame.vue'
import SentenceOrderingGame from '~/components/awesome/quiz/SentenceOrderingGame.vue'
import StoryScenarioGame from '~/components/awesome/quiz/StoryScenarioGame.vue'
import GroupRoomLobby from '~/components/awesome/quiz/GroupRoomLobby.vue'
import ArenaQuestionPanel from '~/components/awesome/quiz/ArenaQuestionPanel.vue'
import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })
useHead({ title: '🎮 Đấu Trường Game & Quiz Center - Sprech Mit Uns' })

const { playSound, triggerConfetti } = useGamification()
const { dailyQuests, recordSpeedCombo } = useDailyQuests()
const { userId } = useSession()

// Active Mode Selection
type GameMode = 'speed_60s' | 'memory_match' | 'sentence_ordering' | 'boss_fight' | 'story_scenario' | 'group_pin'
const selectedMode = ref<GameMode | null>(null)

// ⚡ Speed Quiz 60s States
const gameState = ref<'lobby' | 'playing' | 'gameover'>('lobby')
const timeLeft = ref(60)
const timer = ref<any>(null)
const questions = ref<any[]>([])
const currentIdx = ref(0)
const score = ref(0)
const comboCount = ref(0)
const maxCombo = ref(0)
const highScore = ref(0)
const advancing = ref(false)

// Daily Stats & Leaderboard Data
const userStreak = ref(0)
const dailyXp = ref(0)
const dailyXpTarget = ref(500)
const leaderboards = ref<any[]>([])

const fetchStats = async () => {
  if (!userId.value) return
  try {
    const res = await $fetch<any>(`/api/quiz/stats?userId=${userId.value}`)
    if (res && res.success) {
      userStreak.value = res.userStreak
      dailyXp.value = res.dailyXp
      dailyXpTarget.value = res.dailyXpTarget
      leaderboards.value = res.leaderboards
    }
  } catch (err) {
    console.error('Error fetching quiz stats:', err)
  }
}

const route = useRoute()

onMounted(() => {
  const saved = localStorage.getItem('speed_quiz_high_score')
  if (saved) highScore.value = parseInt(saved, 10)
  fetchStats()

  if (route.query.pin) {
    selectedMode.value = 'group_pin'
  }
})

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)

const multiplier = computed(() => {
  if (comboCount.value >= 10) return 5
  if (comboCount.value >= 5) return 3
  if (comboCount.value >= 3) return 2
  return 1
})

const xpGained = computed(() => score.value * 15)

const selectMode = (mode: GameMode) => {
  selectedMode.value = mode
  if (mode === 'speed_60s') {
    startSpeedGame()
  }
}

const backToCenter = () => {
  selectedMode.value = null
  gameState.value = 'lobby'
  if (timer.value) clearInterval(timer.value)
  fetchStats()
}

const startSpeedGame = async () => {
  // Mix of MC + dictation + sentence builder (UI supports all three)
  const data = await $fetch<any[]>(
    '/api/quiz/random?types=multiple_choice,dictation,sentence_builder&limit=40',
  )
  if (!data || !data.length) return

  questions.value = data
  currentIdx.value = 0
  score.value = 0
  comboCount.value = 0
  maxCombo.value = 0
  timeLeft.value = 60
  gameState.value = 'playing'
  advancing.value = false

  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      if (timeLeft.value === 5) playSound('wrong')
    } else {
      endSpeedGame()
    }
  }, 1000)
}

const onSpeedAnswered = async (payload: { isCorrect: boolean; selectedIndex: number }) => {
  if (advancing.value || !currentQuestion.value) return
  advancing.value = true

  const { isCorrect, selectedIndex } = payload

  if (isCorrect) {
    playSound('correct')
    comboCount.value++
    if (comboCount.value > maxCombo.value) maxCombo.value = comboCount.value
    score.value += 10 * multiplier.value
    recordSpeedCombo(comboCount.value)
  } else {
    playSound('wrong')
    comboCount.value = 0
  }

  try {
    await $fetch('/api/quiz/submit', {
      method: 'POST',
      body: {
        userId: userId.value,
        answers: [{
          questionId: currentQuestion.value.id,
          selectedIndex,
          isCorrect,
        }],
      },
    })
  } catch (e) {
    console.error('Failed to submit answer:', e)
  }

  const delay = currentQuestion.value.type === 'multiple_choice' ? 800 : 1400
  setTimeout(() => {
    if (currentIdx.value < questions.value.length - 1) {
      currentIdx.value++
      advancing.value = false
    } else {
      endSpeedGame()
    }
  }, delay)
}

const endSpeedGame = () => {
  if (timer.value) clearInterval(timer.value)
  gameState.value = 'gameover'
  fetchStats()

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
    <LayoutPageSection>
      <!-- FULL WIDTH HEADER CONTAINER -->
      <div class="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
        <!-- Page Title Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300 font-extrabold text-xs rounded-md uppercase tracking-wider">
                Edu Gamification Hub
              </span>
              <span class="text-xs font-bold text-slate-400">🇨🇿 Czech & 🇩🇪 German</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              🎮 Đấu Trường Quiz & Game Center
            </h1>
          </div>

          <!-- Quick Stats Pill Bar -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 rounded-xl shadow-xs">
              <Icon name="lucide:flame" class="w-5 h-5 text-orange-500 fill-current" />
              <div>
                <span class="block text-xs font-black text-slate-900 dark:text-white">{{ userStreak }} Ngày Streak</span>
                <span class="block text-[10px] text-slate-400">Đang duy trì</span>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 rounded-xl shadow-xs">
              <Icon name="lucide:zap" class="w-5 h-5 text-amber-500 fill-current" />
              <div>
                <span class="block text-xs font-black text-slate-900 dark:text-white">{{ dailyXp }} / {{ dailyXpTarget }} XP</span>
                <span class="block text-[10px] text-slate-400">Chỉ tiêu ngày</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MAIN DASHBOARD GRID (2/3 Main + 1/3 Sidebar) -->
        <div v-if="!selectedMode" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- MAIN CONTENT COLUMN (8 COLUMNS) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- HERO FEATURED BANNER (Nổi bật nhất hôm nay) -->
            <div class="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <!-- Decorative Background Glow -->
              <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div class="space-y-3 relative z-10 max-w-xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <Icon name="lucide:sparkles" class="w-4 h-4 text-primary-400" />
                  <span>Thách thức gợi ý hôm nay</span>
                </div>

                <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                  👾 Thách Thức Hạ Gục Vokabel Monster Lv.99
                </h2>

                <p class="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Kiểm tra phản xạ từ vựng tiếng Đức & Séc trong trận chiến nhập vai Đánh Boss. Trả lời đúng để tung chiêu gây sát thương lớn!
                </p>

                <div class="pt-2 flex items-center gap-4">
                  <button
                    @click="selectMode('boss_fight')"
                    class="px-6 py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <Icon name="lucide:swords" class="w-5 h-5" />
                    <span>Chiến Boss Ngay (+150 XP)</span>
                  </button>
                </div>
              </div>

              <!-- Hero Visual Avatar -->
              <div class="shrink-0 relative z-10 hidden sm:flex items-center justify-center w-28 h-28 bg-slate-800/80 border border-slate-700 rounded-2xl text-5xl shadow-inner">
                👾
              </div>
            </div>

            <!-- GAME MODES GRID (2 CỘT CÂN BẰNG) -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">
                  Danh Mục Chế Độ Game
                </h3>
                <span class="text-xs text-slate-400 font-bold">6 Mode sẵn sàng</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <!-- Mode 1: ⚡ 60s Speed Arena -->
                <div
                  @click="selectMode('speed_60s')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:zap" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg">
                      Kỷ kỷ lục: {{ highScore }} Pts
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      ⚡ Đấu Trường 60s
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Trắc nghiệm phản xạ từ vựng liên tục 60s. Nhân điểm XP qua chuỗi Combo Streak.
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Vào đấu trường</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <!-- Mode 2: 🃏 Memory Match -->
                <div
                  @click="selectMode('memory_match')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:grid" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-lg">
                      Mini Game
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      🃏 Lật Thẻ Ghép Cặp (Memory Match)
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Ghép từ vựng với nghĩa tương ứng qua lưới bài 12 lá bài lật úp.
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Bắt đầu lật thẻ</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <!-- Mode 3: 🧩 Sentence Ordering -->
                <div
                  @click="selectMode('sentence_ordering')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:puzzle" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg">
                      Ngữ Pháp
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      🧩 Sắp Xếp Câu (Wortstellung)
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Xếp lại vị trí động từ & thành phần câu theo đúng ngữ pháp.
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Rèn luyện ngữ pháp</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <!-- Mode 4: 👾 Boss Fight -->
                <div
                  @click="selectMode('boss_fight')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:swords" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-lg">
                      Boss Arena
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      👾 Thách Thức Đánh Boss
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Đấu trường chống lại Vokabel Monster. Trả lời đúng để tung chiêu gây sát thương!
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Chinh phục Boss ngay</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <!-- Mode 5: 🎭 Story Scenario -->
                <div
                  @click="selectMode('story_scenario')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:message-square" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg">
                      Hội Thoại
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      🎭 Phiêu Lưu Kịch Bản (Story Mode)
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Nhập vai xử lý tình huống giao tiếp thực tế ở Đức/Séc (Nhà hàng, Bác sĩ...).
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Nhập vai tình huống</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <!-- Mode 6: 🔑 PIN Group Study Room -->
                <div
                  @click="selectMode('group_pin')"
                  class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 rounded-xl">
                      <Icon name="lucide:users" class="w-6 h-6" />
                    </div>
                    <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-lg">
                      Demo · single-server
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                      Phòng Học Nhóm (Demo)
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      PIN 6 số trên một tiến trình server — không bền vững khi restart / multi-instance. Production tắt mặc định.
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
                    <span>Vào phòng học nhóm</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDEBAR COLUMN (4 COLUMNS) -->
          <div class="lg:col-span-4 space-y-6">
            <!-- WIDGET 1: TIẾN TRÌNH HỌC NGÀY (Daily Progress Bar) -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="lucide:target" class="w-5 h-5 text-primary-500" />
                  <span>Chỉ Tiêu XP Hôm Nay</span>
                </h4>
                <span class="text-xs font-bold text-primary-500">{{ Math.round((dailyXp / dailyXpTarget) * 100) }}%</span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700">
                <div
                  class="bg-primary-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${(dailyXp / dailyXpTarget) * 100}%` }"
                ></div>
              </div>

              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Nạp thêm <strong class="text-slate-900 dark:text-white font-extrabold">{{ dailyXpTarget - dailyXp }} XP</strong> để hoàn thành chuỗi rèn luyện ngày!
              </p>
            </div>

            <!-- WIDGET 2: BẢNG XẾP HẠNG TUẦN (Leaderboard Top 5) -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="lucide:trophy" class="w-5 h-5 text-amber-500" />
                  <span>Bảng Xếp Hạng Đấu Trường</span>
                </h4>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tuần này</span>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="user in leaderboards"
                  :key="user.rank"
                  class="flex items-center justify-between p-2.5 rounded-xl transition-colors"
                  :class="user.isUser ? 'bg-primary-50 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'"
                >
                  <div class="flex items-center gap-3">
                    <!-- Rank Badge -->
                    <span
                      class="w-6 text-center text-xs font-black"
                      :class="[
                        user.rank === 1 ? 'text-amber-500 text-sm' : '',
                        user.rank === 2 ? 'text-slate-400' : '',
                        user.rank === 3 ? 'text-amber-700' : '',
                        user.rank > 3 ? 'text-slate-400' : ''
                      ]"
                    >
                      #{{ user.rank }}
                    </span>

                    <span class="text-lg">{{ user.avatar }}</span>

                    <div>
                      <span class="block text-xs font-extrabold text-slate-900 dark:text-white">
                        {{ user.name }}
                      </span>
                    </div>
                  </div>

                  <span class="text-xs font-black text-primary-500">{{ user.score }} Pts</span>
                </div>
              </div>
            </div>

            <!-- WIDGET 3: NHIỆM VỤ HÀNG NGÀY (Daily Quests) -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="lucide:check-square" class="w-5 h-5 text-emerald-500" />
                  <span>Nhiệm Vụ Hàng Ngày</span>
                </h4>
              </div>

              <div class="space-y-3">
                <div
                  v-for="quest in dailyQuests"
                  :key="quest.id"
                  class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {{ quest.title }}
                    </span>
                    <span class="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                      {{ quest.reward }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Tiến độ: {{ quest.progress }}/{{ quest.total }}</span>
                    <span v-if="quest.completed" class="text-emerald-500 font-bold flex items-center gap-1">
                      <Icon name="lucide:check" class="w-3 h-3" /> Hoàn thành
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ACTIVE GAME STAGES (Single Column Mode when inside a Game) -->
        <div v-else class="max-w-4xl mx-auto">
          <!-- MODE 1 ACTIVE: ⚡ 60s Speed Quiz -->
          <div v-if="selectedMode === 'speed_60s'" class="space-y-6">
            <div class="flex items-center justify-between">
              <button
                @click="backToCenter"
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary-500 transition-colors cursor-pointer"
              >
                <Icon name="lucide:arrow-left" class="w-4 h-4" />
                <span>Trở về trung tâm game</span>
              </button>
            </div>

            <!-- PLAYING STATE -->
            <div v-if="gameState === 'playing' && currentQuestion" class="space-y-6">
              <div class="grid grid-cols-3 gap-4">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <Icon name="lucide:timer" class="w-6 h-6" :class="timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'" />
                  <div>
                    <span class="block text-xl font-extrabold" :class="timeLeft <= 10 ? 'text-red-500' : 'text-slate-900 dark:text-white'">{{ timeLeft }}s</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Thời Gian</span>
                  </div>
                </div>

                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <Icon name="lucide:sparkles" class="w-6 h-6 text-amber-500" />
                  <div>
                    <span class="block text-xl font-extrabold text-primary-500">{{ score }}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Điểm Số</span>
                  </div>
                </div>

                <div class="bg-primary-500 p-4 rounded-2xl text-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:flame" class="w-6 h-6 fill-current text-orange-200" />
                    <div>
                      <span class="block text-xl font-extrabold">x{{ multiplier }}</span>
                      <span class="text-[10px] font-bold uppercase opacity-90">Combo: {{ comboCount }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Question Card -->
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
                <ArenaQuestionPanel
                  :key="currentQuestion.id"
                  :question="currentQuestion"
                  auto-submit-mc
                  @answered="onSpeedAnswered"
                />
              </div>
            </div>

            <!-- GAMEOVER STATE -->
            <div v-else-if="gameState === 'gameover'" class="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm space-y-6">
              <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 text-primary-500 rounded-full flex items-center justify-center mx-auto">
                <Icon name="lucide:trophy" class="w-10 h-10" />
              </div>

              <div class="space-y-1">
                <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">HẾT GIỜ!</h2>
                <p class="text-slate-500 dark:text-slate-400 text-sm">Bạn đã hoàn thành lượt thách thức 60 giây.</p>
              </div>

              <div class="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span class="block text-2xl font-extrabold text-primary-500">{{ score }}</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Tổng Điểm</span>
                </div>
                <div>
                  <span class="block text-2xl font-extrabold text-orange-500">🔥 {{ maxCombo }}</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Combo Tối Đa</span>
                </div>
                <div>
                  <span class="block text-2xl font-extrabold text-emerald-500">+{{ xpGained }}</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">XP Nhận Được</span>
                </div>
              </div>

              <div class="flex gap-4 justify-center">
                <button
                  @click="startSpeedGame"
                  class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl px-6 py-3 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
                >
                  <Icon name="lucide:rotate-ccw" class="w-5 h-5" />
                  <span>Chơi Lại Ngay</span>
                </button>
              </div>
            </div>
          </div>

          <!-- MODE 2 ACTIVE: 🃏 Memory Match -->
          <MemoryMatchGame
            v-else-if="selectedMode === 'memory_match'"
            @back="backToCenter"
          />

          <!-- MODE 3 ACTIVE: 🧩 Sentence Ordering -->
          <SentenceOrderingGame
            v-else-if="selectedMode === 'sentence_ordering'"
            @back="backToCenter"
          />

          <!-- MODE 4 ACTIVE: 👾 Boss Fight -->
          <BossFightGame
            v-else-if="selectedMode === 'boss_fight'"
            @back="backToCenter"
          />

          <!-- MODE 5 ACTIVE: 🎭 Story Scenario -->
          <StoryScenarioGame
            v-else-if="selectedMode === 'story_scenario'"
            @back="backToCenter"
          />

          <!-- MODE 6 ACTIVE: 🔑 Group PIN Room -->
          <GroupRoomLobby
            v-else-if="selectedMode === 'group_pin'"
            @back="backToCenter"
          />
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
