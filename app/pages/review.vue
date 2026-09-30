<script lang="ts" setup>
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useGamification } from '~/composables/use-gamification'
import { useLanguage } from '~/composables/use-language'
import { useDailyPath } from '~/composables/use-daily-path'
import { useDailyQuests } from '~/composables/use-daily-quests'
import {
  getMasteryStage,
  masteryStageLabel,
  MASTER_MIN_REPETITIONS,
  type MasteryStage,
} from '~/utils/srs-mastery'

import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })

useHead({
  title: 'Ôn tập SRS Thông minh - Sprech Mit Uns',
})

const { userId: sessionUserId } = useSession()
const userId = computed(() => sessionUserId.value || '')
const { playAudioOrSpeak } = useAudioPlayback()
const { triggerConfetti, playSound } = useGamification()
const { currentLanguage, setLanguage } = useLanguage()
const { recordSrsReview, srsTodayProgress, dailyReviewTarget } = useDailyPath()
const { recordSrsReviewQuest, syncSrsQuestTotal } = useDailyQuests()

syncSrsQuestTotal(dailyReviewTarget.value)

const loading = ref(true)
const dueWords = ref<any[]>([])
const totalDueCount = ref(0)
const langCounts = ref<{ de: number; cs: number }>({ de: 0, cs: 0 })
const currentIndex = ref(0)
const isFlipped = ref(false)
const isFinished = ref(false)
const submitting = ref(false)
const feedbackToast = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

const sessionStats = ref({ again: 0, hard: 0, good: 0, easy: 0 })

const currentItem = computed(() => dueWords.value[currentIndex.value] || null)

const currentStage = computed<MasteryStage>(() => {
  const item = currentItem.value
  if (!item) return 'learning'
  return (
    item.stage ||
    getMasteryStage({
      repetitions: item.repetitions || 0,
      interval: item.interval || 0,
      isMastered: item.isMastered,
    })
  )
})

const currentStageLabel = computed(() => masteryStageLabel(currentStage.value))

const recallChain = computed(() => {
  const rep = currentItem.value?.repetitions || 0
  return Math.min(rep, MASTER_MIN_REPETITIONS)
})

const currentIntervalDays = computed(() => currentItem.value?.interval || 0)

const isPhraseCard = computed(() => {
  const w = currentItem.value?.word?.word || ''
  return w.trim().split(/\s+/).length >= 3 || (currentItem.value?.word?.meaning || '').startsWith('Cụm')
})

const progressPct = computed(() => {
  if (!dueWords.value.length) return 0
  return Math.round((currentIndex.value / dueWords.value.length) * 100)
})

const remaining = computed(() =>
  Math.max(dueWords.value.length - currentIndex.value, 0),
)

const showFeedback = (msg: string) => {
  feedbackToast.value = msg
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackToast.value = ''
  }, 3200)
}

const ratingOptions = [
  {
    quality: 1,
    key: '1',
    label: 'Quên',
    hint: 'Reset lịch ôn',
    icon: 'lucide:x',
    tone:
      'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-900 hover:bg-red-500 hover:text-white hover:border-red-500',
  },
  {
    quality: 3,
    key: '2',
    label: 'Khó',
    hint: 'Nhớ, interval ngắn',
    icon: 'lucide:help-circle',
    tone:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-900 hover:bg-amber-500 hover:text-white hover:border-amber-500',
  },
  {
    quality: 4,
    key: '3',
    label: 'Tốt',
    hint: 'Kéo dài lịch',
    icon: 'lucide:check',
    tone:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900 hover:bg-emerald-500 hover:text-white hover:border-emerald-500',
  },
  {
    quality: 5,
    key: '4',
    label: 'Dễ',
    hint: 'Kéo dài mạnh',
    icon: 'lucide:sparkles',
    tone:
      'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 border-primary-200/80 dark:border-primary-900 hover:bg-primary-500 hover:text-white hover:border-primary-500',
  },
] as const

const fetchDueReviews = async () => {
  try {
    loading.value = true
    const resp = await $fetch<any>(
      `/api/srs/review?userId=${userId.value}&lang=${currentLanguage.value}`,
    )
    dueWords.value = resp.dueWords || []
    totalDueCount.value = resp.totalDueCount || 0
    if (resp.counts) langCounts.value = resp.counts
  } catch (err) {
    console.error('Failed to fetch due reviews:', err)
  } finally {
    loading.value = false
  }
}

watch(currentLanguage, () => {
  currentIndex.value = 0
  isFlipped.value = false
  isFinished.value = false
  sessionStats.value = { again: 0, hard: 0, good: 0, easy: 0 }
  fetchDueReviews()
})

const flipCard = () => {
  isFlipped.value = !isFlipped.value
  if (isFlipped.value && currentItem.value?.word) {
    const wordLang = currentItem.value.word.language || 'de'
    playAudioOrSpeak({
      word: currentItem.value.word.word,
      audioUrl: currentItem.value.word.audioUrl,
      lang: wordLang,
    })
  }
}

const handleReviewAnswer = async (quality: number) => {
  if (!currentItem.value || submitting.value || !isFlipped.value) return

  try {
    submitting.value = true

    if (quality >= 3) playSound('correct')
    else playSound('wrong')

    if (quality === 1) sessionStats.value.again++
    else if (quality === 3) sessionStats.value.hard++
    else if (quality === 4) sessionStats.value.good++
    else if (quality === 5) sessionStats.value.easy++

    const result = await $fetch<any>('/api/srs/review', {
      method: 'POST',
      body: {
        userId: userId.value,
        wordId: currentItem.value.wordId,
        quality,
      },
    })

    if (result?.message) showFeedback(result.message)

    recordSrsReview(1)
    recordSrsReviewQuest(1)

    if (currentIndex.value + 1 < dueWords.value.length) {
      currentIndex.value++
      isFlipped.value = false
    } else {
      isFinished.value = true
      playSound('complete')
      triggerConfetti()
    }

    const resp = await $fetch<any>(
      `/api/srs/review?userId=${userId.value}&lang=${currentLanguage.value}`,
    )
    if (resp?.counts) langCounts.value = resp.counts
  } catch (err) {
    console.error('Error recording review:', err)
  } finally {
    submitting.value = false
  }
}

const resetSession = () => {
  currentIndex.value = 0
  isFlipped.value = false
  isFinished.value = false
  sessionStats.value = { again: 0, hard: 0, good: 0, easy: 0 }
  fetchDueReviews()
}

/** Keyboard: Space/Enter flip · 1–4 rate */
const onKeydown = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (loading.value || isFinished.value || !currentItem.value) return

  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    if (!isFlipped.value) flipCard()
    return
  }

  if (!isFlipped.value || submitting.value) return
  const map: Record<string, number> = { Digit1: 1, Digit2: 3, Digit3: 4, Digit4: 5 }
  const q = map[e.code]
  if (q) {
    e.preventDefault()
    handleReviewAnswer(q)
  }
}

onMounted(() => {
  fetchDueReviews()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (feedbackTimer) clearTimeout(feedbackTimer)
})
</script>

<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-clip" data-testid="review-page">
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute -top-16 -left-20 h-64 w-64 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-600/10" />
      <div class="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-700/10" />
    </div>

    <div class="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <!-- Compact session header -->
      <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="min-w-0 space-y-1.5 text-left">
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              to="/progress"
              class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
              Tiến độ
            </NuxtLink>
            <span class="text-slate-300 dark:text-slate-700">/</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Icon name="lucide:brain" class="w-3 h-3" />
              SuperMemo-2
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ôn Tập SRS
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Lật thẻ → đánh giá mức nhớ. Hệ thống tự xếp lịch ôn lần sau.
            Hôm nay:
            <span class="font-extrabold text-primary-600 dark:text-primary-400 tabular-nums">
              {{ srsTodayProgress.count }}/{{ srsTodayProgress.target }}
            </span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
              :class="
                currentLanguage === 'de'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              "
              @click="setLanguage('de')"
            >
              🇩🇪 DE
              <span class="tabular-nums opacity-80">{{ langCounts.de }}</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
              :class="
                currentLanguage === 'cs'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              "
              @click="setLanguage('cs')"
            >
              🇨🇿 CZ
              <span class="tabular-nums opacity-80">{{ langCounts.cs }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
      >
        <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p class="text-slate-500 text-sm font-bold">Đang tải từ đến hạn ôn…</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!dueWords.length"
        class="max-w-lg mx-auto text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 space-y-5 shadow-sm"
      >
        <div class="w-16 h-16 mx-auto rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/25">
          <Icon name="lucide:party-popper" class="w-8 h-8" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Hết từ cần ôn hôm nay</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Quay lại sau, hoặc thêm từ mới từ Từ điển / Sổ từ vựng.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <NuxtLink
            to="/dictionary"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold"
          >
            <Icon name="lucide:book-open" class="w-4 h-4" />
            Từ điển
          </NuxtLink>
          <NuxtLink
            to="/vocabulary"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            <Icon name="lucide:book-marked" class="w-4 h-4" />
            Sổ từ vựng
          </NuxtLink>
        </div>
      </div>

      <!-- Active session -->
      <div
        v-else-if="!isFinished && currentItem"
        class="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6 items-start"
      >
        <!-- Main stage -->
        <div class="xl:col-span-8 space-y-4">
          <!-- Progress strip -->
          <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 space-y-3">
            <div class="flex items-center justify-between gap-3 text-xs font-bold">
              <span class="text-slate-600 dark:text-slate-300">
                Thẻ
                <span class="text-slate-900 dark:text-white tabular-nums">{{ currentIndex + 1 }}</span>
                /
                <span class="tabular-nums">{{ dueWords.length }}</span>
              </span>
              <span class="text-primary-600 dark:text-primary-400 tabular-nums">
                Còn {{ remaining }} từ
              </span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500 transition-[width] duration-500 ease-out"
                :style="{ width: `${Math.max(progressPct, currentIndex === 0 ? 4 : progressPct)}%` }"
              />
            </div>
            <div class="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Quên {{ sessionStats.again }}</span>
              <span>Khó {{ sessionStats.hard }}</span>
              <span>Tốt {{ sessionStats.good }}</span>
              <span>Dễ {{ sessionStats.easy }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border"
                :class="
                  currentStage === 'mastered'
                    ? 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/25'
                    : currentStage === 'reviewing'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                "
              >
                {{ currentStageLabel }}
              </span>
              <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Chuỗi nhớ {{ recallChain }}/{{ MASTER_MIN_REPETITIONS }}
              </span>
              <span class="text-[11px] font-semibold text-slate-500">
                Khoảng cách hiện tại: {{ currentIntervalDays }} ngày
              </span>
              <span
                v-if="isPhraseCard"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
              >
                Chunk / câu
              </span>
            </div>
          </div>

          <AwesomeFlashCard
            :word="currentItem.word?.word"
            :meaning="currentItem.word?.meaning"
            :example="currentItem.word?.example"
            :language="currentItem.word?.language"
            :type="currentItem.word?.type"
            :is-flipped="isFlipped"
            :stage-label="currentStageLabel"
            :recall-chain="recallChain"
            :interval-days="currentIntervalDays"
            @flip="flipCard"
          />

          <!-- Rating / flip prompt -->
          <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <template v-if="!isFlipped">
              <button
                type="button"
                class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-extrabold shadow-sm shadow-primary-500/20 transition-colors cursor-pointer"
                @click="flipCard"
              >
                <Icon name="lucide:rotate-cw" class="w-4 h-4" />
                Hiện đáp án
                <kbd class="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">Space</kbd>
              </button>
            </template>
            <template v-else>
              <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center mb-3">
                Bạn nhớ từ này thế nào?
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  v-for="opt in ratingOptions"
                  :key="opt.quality"
                  type="button"
                  :disabled="submitting"
                  class="flex flex-col items-center gap-1 px-2 py-3.5 rounded-xl border text-center transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50"
                  :class="opt.tone"
                  @click="handleReviewAnswer(opt.quality)"
                >
                  <Icon :name="opt.icon" class="w-4 h-4" />
                  <span class="text-sm font-extrabold">{{ opt.label }}</span>
                  <span class="text-[10px] font-semibold opacity-80">{{ opt.hint }}</span>
                  <kbd class="mt-0.5 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] font-bold opacity-70">
                    {{ opt.key }}
                  </kbd>
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Side coach panel -->
        <aside class="xl:col-span-4 space-y-4">
          <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-left">
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:keyboard" class="w-4 h-4 text-primary-500" />
              Phím tắt
            </h3>
            <ul class="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li class="flex items-center justify-between gap-2">
                <span>Lật thẻ / hiện đáp án</span>
                <kbd class="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">Space</kbd>
              </li>
              <li class="flex items-center justify-between gap-2">
                <span>Quên → Dễ</span>
                <span class="flex gap-1">
                  <kbd
                    v-for="k in ['1', '2', '3', '4']"
                    :key="k"
                    class="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
                  >{{ k }}</kbd>
                </span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-950/30 dark:to-slate-900 p-5 space-y-3 text-left">
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:lightbulb" class="w-4 h-4 text-primary-500" />
              Cách não “thuộc” từ
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Thuộc lâu = nhớ đúng đủ lần với khoảng cách tăng dần (≥4 lần, khoảng cách ≥21 ngày).
              Sau đó vẫn ôn thưa (≥30 ngày) để không quên. <strong class="text-slate-800 dark:text-slate-200">Quên</strong> sẽ reset chuỗi.
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-500">
              Tổng đến hạn (mọi ngôn ngữ):
              <span class="font-extrabold text-primary-600 dark:text-primary-400">{{ totalDueCount }}</span>
            </p>
          </div>
        </aside>
      </div>

      <!-- Finished -->
      <div
        v-else-if="isFinished"
        class="max-w-md mx-auto text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 space-y-6 shadow-sm"
      >
        <div class="w-16 h-16 mx-auto rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/25">
          <Icon name="lucide:trophy" class="w-8 h-8" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Phiên ôn hoàn tất</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Đã ôn {{ dueWords.length }} từ · Quên {{ sessionStats.again }} · Khó {{ sessionStats.hard }} · Tốt {{ sessionStats.good }} · Dễ {{ sessionStats.easy }}
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            class="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-extrabold cursor-pointer"
            @click="resetSession"
          >
            Ôn tiếp (làm mới)
          </button>
          <NuxtLink
            to="/progress"
            class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            Về tiến độ
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Feedback toast -->
    <div
      v-if="feedbackToast"
      class="fixed bottom-32 sm:bottom-8 right-8 z-50 max-w-[min(24rem,calc(100vw-4rem))] px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg border border-primary-500/40"
    >
      {{ feedbackToast }}
    </div>
  </div>
</template>
