<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { getWordProgress, updateWordProgress } from '~/utils/progressUtils'
import { useSession } from '~/composables/use-session'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  flashcards: VocabularyWord[]
  /** Homepage demo: no API / localStorage persistence */
  demo?: boolean
  /** Stable key for saving card index (e.g. topic id/slug) */
  deckKey?: string
}>()

const { userId: sessionUserId } = useSession()
const progressUserId = computed(() => sessionUserId.value || 'anonymous')

const currentCard = ref(0)
const isFlipped = ref(false)
const showResult = ref(false)
const lastAnswerCorrect = ref<boolean | null>(null)
const sessionStats = ref({ correct: 0, incorrect: 0, total: 0 })
const sessionStreak = ref(0)
const wordsProgress = ref<Record<string, any>>({})

function emptyProgress() {
  return {
    correctCount: 0,
    incorrectCount: 0,
    lastCorrect: false,
    isMastered: false,
    masteryLevel: 0,
    streak: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
  }
}

function storageIdxKey() {
  if (props.deckKey) return `flashcard_saved_idx_${props.deckKey}`
  if (props.flashcards.length > 0 && props.flashcards[0]?.id) {
    return `flashcard_saved_idx_${props.flashcards[0].id}`
  }
  return null
}

function storageSessionKey() {
  if (props.deckKey) return `flashcard_session_${props.deckKey}`
  if (props.flashcards.length > 0 && props.flashcards[0]?.id) {
    return `flashcard_session_${props.flashcards[0].id}`
  }
  return null
}

function mergeProgress(fromApi: any, fromLocal: any) {
  if (!fromApi && !fromLocal) return emptyProgress()
  if (!fromApi) return { ...emptyProgress(), ...fromLocal }
  if (!fromLocal) return { ...emptyProgress(), ...fromApi }

  // Prefer whichever has more recent review / higher activity
  const apiTime = fromApi.lastReviewedAt ? new Date(fromApi.lastReviewedAt).getTime() : 0
  const localTime = fromLocal.lastReviewedAt ? new Date(fromLocal.lastReviewedAt).getTime() : 0
  const primary = localTime > apiTime ? fromLocal : fromApi
  const secondary = localTime > apiTime ? fromApi : fromLocal

  return {
    ...emptyProgress(),
    ...secondary,
    ...primary,
    correctCount: Math.max(fromApi.correctCount || 0, fromLocal.correctCount || 0),
    incorrectCount: Math.max(fromApi.incorrectCount || 0, fromLocal.incorrectCount || 0),
    masteryLevel: Math.max(fromApi.masteryLevel || 0, fromLocal.masteryLevel || 0),
    streak: Math.max(fromApi.streak || 0, fromLocal.streak || 0),
    isMastered: Boolean(fromApi.isMastered || fromLocal.isMastered),
    lastReviewedAt: primary.lastReviewedAt || secondary.lastReviewedAt || null,
  }
}

function hydrateSessionFromProgress(progressMap: Record<string, any>) {
  let correct = 0
  let incorrect = 0
  let total = 0
  let maxStreak = 0

  for (const p of Object.values(progressMap)) {
    if (!p?.lastReviewedAt) continue
    total++
    if (p.lastCorrect) correct++
    else incorrect++
    maxStreak = Math.max(maxStreak, p.streak || 0)
  }

  // Restore session counters from deck so UI doesn't look "reset"
  try {
    const key = storageSessionKey()
    const saved = key ? localStorage.getItem(key) : null
    if (saved) {
      const parsed = JSON.parse(saved)
      sessionStats.value = {
        correct: typeof parsed.correct === 'number' ? parsed.correct : correct,
        incorrect: typeof parsed.incorrect === 'number' ? parsed.incorrect : incorrect,
        total: typeof parsed.total === 'number' ? parsed.total : total,
      }
      sessionStreak.value = typeof parsed.streak === 'number' ? parsed.streak : maxStreak
      return
    }
  } catch {
    // fall through
  }

  sessionStats.value = { correct, incorrect, total }
  sessionStreak.value = maxStreak
}

function persistSession() {
  if (props.demo) return
  try {
    const key = storageSessionKey()
    if (!key) return
    localStorage.setItem(
      key,
      JSON.stringify({
        ...sessionStats.value,
        streak: sessionStreak.value,
      }),
    )
  } catch {
    // ignore
  }
}

function persistCardIndex(index: number) {
  if (props.demo) return
  try {
    const key = storageIdxKey()
    if (key) localStorage.setItem(key, index.toString())
  } catch {
    // ignore
  }
}

function loadProgress() {
  const progress: Record<string, any> = {}

  if (props.demo) {
    for (const c of props.flashcards) {
      if (!c?.id) continue
      progress[c.id] = emptyProgress()
    }
    wordsProgress.value = progress
    currentCard.value = 0
    sessionStats.value = { correct: 0, incorrect: 0, total: 0 }
    sessionStreak.value = 0
    return
  }

  for (const c of props.flashcards) {
    if (!c?.id) continue
    const fromApi = (c as any).progress || null
    const fromLocal = getWordProgress(progressUserId.value, c.id)
    progress[c.id] = mergeProgress(fromApi, fromLocal)
  }
  wordsProgress.value = progress
  hydrateSessionFromProgress(progress)

  // Restore card position: saved index, else first not-yet-reviewed
  let restored = false
  try {
    const key = storageIdxKey()
    const savedIdx = key ? localStorage.getItem(key) : null
    if (savedIdx !== null) {
      const parsed = parseInt(savedIdx, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < props.flashcards.length) {
        currentCard.value = parsed
        restored = true
      }
    }
  } catch {
    // ignore
  }

  if (!restored) {
    const firstPending = props.flashcards.findIndex(
      (fc) => fc?.id && !progress[fc.id]?.lastReviewedAt,
    )
    currentCard.value = firstPending >= 0 ? firstPending : 0
  }
}

watch(
  () => {
    const list = props.flashcards || []
    return [
      props.demo ? 1 : 0,
      props.deckKey || '',
      list.length,
      list[0]?.id || '',
      list[list.length - 1]?.id || '',
      // Re-hydrate when API progress arrives / changes
      list.reduce((n, w: any) => n + (w?.progress?.lastReviewedAt ? 1 : 0), 0),
    ].join('|')
  },
  () => {
    if (!props.flashcards?.length) return
    loadProgress()
  },
  { immediate: true },
)

const card = computed(() => props.flashcards[currentCard.value])

const progressPct = computed(() => {
  if (!props.flashcards.length) return 0
  // Prefer reviewed count for deck completion feel
  return Math.round((reviewedCount.value / props.flashcards.length) * 100)
})

const reviewedCount = computed(
  () =>
    props.flashcards.filter((fc) => wordsProgress.value[fc.id]?.lastReviewedAt)
      .length,
)

const tips = computed(() => [
  {
    icon: 'lucide:brain',
    title: 'SRS thông minh',
    desc: props.demo
      ? 'Demo mô phỏng cách ôn đúng lúc sắp quên — không ghi vào hồ sơ.'
      : 'Ôn đúng lúc sắp quên — ghi nhớ dài hạn hơn học nhồi.',
  },
  {
    icon: 'lucide:flip-horizontal-2',
    title: 'Lật thẻ & đánh giá',
    desc: props.demo
      ? 'Lật để xem đáp án, rồi chọn Dễ / Khó — chỉ để thử trải nghiệm.'
      : 'Lật để xem đáp án, rồi chọn Dễ / Khó để hệ thống lên lịch.',
  },
  {
    icon: 'lucide:volume-2',
    title: 'Nghe phát âm',
    desc: 'Bấm loa ở mặt sau thẻ để luyện phản xạ nghe–nói.',
  },
])

function handleAnswer(isCorrect: boolean) {
  if (!card.value?.id) return
  const base = wordsProgress.value[card.value.id] || emptyProgress()

  const updatedProgress = { ...base }
  lastAnswerCorrect.value = isCorrect

  if (isCorrect) {
    updatedProgress.correctCount++
    updatedProgress.lastCorrect = true
    updatedProgress.streak++
    updatedProgress.masteryLevel = Math.min(5, updatedProgress.masteryLevel + 1)
    sessionStats.value.correct++
    sessionStreak.value++
  } else {
    updatedProgress.incorrectCount++
    updatedProgress.lastCorrect = false
    updatedProgress.streak = 0
    updatedProgress.masteryLevel = Math.max(0, updatedProgress.masteryLevel - 1)
    sessionStats.value.incorrect++
    sessionStreak.value = 0
  }

  updatedProgress.lastReviewedAt = new Date()
  wordsProgress.value[card.value.id] = updatedProgress
  sessionStats.value.total++
  persistSession()

  // Persist via SM-2 (quality 5 easy / 2 hard)
  if (!props.demo) {
    updateWordProgress(progressUserId.value, card.value.id, {
      ...updatedProgress,
      quality: isCorrect ? 5 : 2,
    })
  }

  showResult.value = true
  setTimeout(() => {
    showResult.value = false
    lastAnswerCorrect.value = null
    currentCard.value++
    isFlipped.value = false
    persistCardIndex(currentCard.value)
  }, 900)
}

async function resetSession() {
  currentCard.value = 0
  isFlipped.value = false
  showResult.value = false
  lastAnswerCorrect.value = null
  sessionStats.value = { correct: 0, incorrect: 0, total: 0 }
  sessionStreak.value = 0

  const progress: Record<string, any> = {}
  for (const c of props.flashcards) {
    if (!c?.id) continue
    progress[c.id] = emptyProgress()
  }
  wordsProgress.value = progress

  if (props.demo) return

  try {
    const idxKey = storageIdxKey()
    const sessKey = storageSessionKey()
    if (idxKey) localStorage.setItem(idxKey, '0')
    if (sessKey) localStorage.removeItem(sessKey)
    // Only clear progress for words in this deck from local cache
    const all = (() => {
      try {
        return JSON.parse(localStorage.getItem('german_learning_progress') || '{}')
      } catch {
        return {}
      }
    })()
    const wordIds: string[] = []
    for (const c of props.flashcards) {
      if (!c?.id) continue
      wordIds.push(c.id)
      delete all[`${progressUserId.value}-${c.id}`]
    }
    localStorage.setItem('german_learning_progress', JSON.stringify(all))
    await $fetch('/api/progress/reset', {
      method: 'POST',
      body: { userId: progressUserId.value, wordIds },
    })
  } catch {
    // ignore
  }
}

function goToCard(index: number) {
  if (showResult.value) return
  currentCard.value = index
  isFlipped.value = false
  persistCardIndex(index)
}

const { playAudioOrSpeak } = useAudioPlayback()

const difficultyStyle = (difficulty: string) =>
  ({
    easy: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-800',
    medium:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    hard: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  })[difficulty] ||
  'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
</script>


<template>
  <section class="relative py-14 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-primary-100/60 dark:border-slate-800 bg-gradient-to-b from-primary-50/40 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- Soft side atmosphere -->
    <div class="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
      <div class="absolute top-16 -left-20 h-64 w-64 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-600/10" />
      <div class="absolute bottom-10 -right-16 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10" />
    </div>

    <div class="relative max-w-8xl mx-auto">
      <!-- Header -->
      <AwesomeLandingReveal class="text-center mb-10 sm:mb-12">
        <div
          v-if="demo"
          class="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider"
        >
          <Icon name="lucide:layers" class="w-3.5 h-3.5" />
          Demo tương tác
        </div>
        <div
          v-else
          class="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider"
        >
          <Icon name="lucide:bookmark-check" class="w-3.5 h-3.5" />
          Tiến độ được lưu
        </div>
        <h3 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          Hệ thống Flashcard thông minh
        </h3>
        <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
          Luyện từ vựng với thuật toán lặp lại ngắt quãng (SRS) — nhớ lâu hơn mỗi lần ôn.
        </p>
      </AwesomeLandingReveal>

      <!-- Wide stage: tips | card | stats -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <!-- Left: tips (fills empty side) -->
        <AwesomeLandingReveal variant="left" :delay="80" class="lg:col-span-3 order-2 lg:order-1">
          <aside class="space-y-3">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-1">
            Cách dùng
          </h4>
          <div
            v-for="tip in tips"
            :key="tip.title"
            class="flex gap-3 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div class="w-10 h-10 shrink-0 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Icon :name="tip.icon" class="w-5 h-5" />
            </div>
            <div>
              <div class="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
                {{ tip.title }}
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {{ tip.desc }}
              </p>
            </div>
          </div>
          </aside>
        </AwesomeLandingReveal>

        <!-- Center: flashcard stage -->
        <AwesomeLandingReveal variant="scale" :delay="100" class="lg:col-span-6 order-1 lg:order-2">
          <div>
          <!-- Session strip -->
          <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200/70 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-bold">
              <Icon name="lucide:check-circle-2" class="w-4 h-4" />
              {{ sessionStats.correct }}
              <span class="font-medium text-primary-600/70 dark:text-primary-400/70 text-xs">Dễ</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-bold">
              <Icon name="lucide:x-circle" class="w-4 h-4" />
              {{ sessionStats.incorrect }}
              <span class="font-medium text-red-600/70 dark:text-red-400/70 text-xs">Khó</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold">
              <Icon name="lucide:hash" class="w-4 h-4" />
              {{ sessionStats.total }}
              <span class="font-medium text-blue-600/70 dark:text-blue-400/70 text-xs">Đã ôn</span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mb-6 px-1">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>
                Thẻ
                {{ Math.min(currentCard + 1, props.flashcards.length) }}
                /
                {{ props.flashcards.length }}
              </span>
              <span>{{ progressPct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-500"
                :style="{ width: `${progressPct}%` }"
              />
            </div>
            <div class="flex justify-center gap-1.5 mt-3">
              <button
                v-for="(fc, index) in props.flashcards"
                :key="fc.id || index"
                type="button"
                class="w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                :class="{
                  'bg-primary-500 scale-125 ring-2 ring-primary-300/60 dark:ring-primary-700':
                    index === currentCard && currentCard < props.flashcards.length,
                  'bg-primary-400 dark:bg-primary-600':
                    index !== currentCard && wordsProgress[fc.id]?.lastReviewedAt,
                  'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400':
                    index !== currentCard && !wordsProgress[fc.id]?.lastReviewedAt,
                }"
                :title="`Thẻ ${index + 1}`"
                @click="goToCard(index)"
              />
            </div>
          </div>

          <!-- Card -->
          <div
            v-if="currentCard < props.flashcards.length"
            class="relative perspective w-full max-w-lg mx-auto h-[22rem] sm:h-96"
            :class="{ 'pointer-events-none': showResult }"
          >
            <div
              class="w-full h-full transition-transform duration-700 preserve-3d relative cursor-pointer"
              :class="{ 'rotate-y-180': isFlipped }"
              data-cursor-text="FLIP"
              @click="isFlipped = !isFlipped"
            >
              <!-- Front -->
              <div
                class="absolute inset-0 backface-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-lg flex flex-col p-6 sm:p-8 overflow-hidden"
              >
                <div class="relative flex items-start justify-between gap-2 mb-auto">
                  <div class="flex flex-wrap gap-2">
                    <span
                      class="px-2.5 py-1 rounded-md text-xs font-bold border capitalize"
                      :class="difficultyStyle(card?.difficulty || '')"
                    >
                      {{ card?.difficulty || '—' }}
                    </span>
                    <span class="px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40">
                      {{
                        card?.topics?.length ? card.topics[0] : 'Chung'
                      }}
                    </span>
                  </div>
                  <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mặt trước
                  </span>
                </div>

                <div class="relative my-auto text-center space-y-3 py-4">
                  <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {{ card?.meaning }}
                  </h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Bản dịch tiếng Đức là gì?
                  </p>
                </div>

                <div class="relative flex items-center justify-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 pt-2">
                  <Icon name="lucide:rotate-cw" class="w-3.5 h-3.5" />
                  Chạm để lật thẻ
                </div>
              </div>

              <!-- Back -->
              <div
                class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border-2 border-primary-400 dark:border-primary-600 bg-white dark:bg-slate-900 shadow-lg flex flex-col p-6 sm:p-8 overflow-hidden"
              >
                <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-500 to-blue-500" />
                <div class="relative flex items-start justify-between gap-2 mb-auto">
                  <span class="px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-500/25">
                    Đáp án
                  </span>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    data-cursor-text="AUDIO"
                    @click.stop="
                      playAudioOrSpeak({
                        word: card?.word,
                        paragraph: card?.word,
                        audioUrl: card?.audioUrl,
                        lang: card?.language || 'de',
                      })
                    "
                  >
                    <Icon name="lucide:volume-2" class="w-4 h-4" />
                    Phát âm
                  </button>
                </div>

                <div class="relative my-auto text-center space-y-3 py-4">
                  <h2 class="text-4xl sm:text-5xl font-black text-primary-700 dark:text-primary-300 tracking-tight">
                    {{ card?.word }}
                  </h2>
                  <p v-if="card?.pronunciation" class="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {{ card.pronunciation }}
                  </p>
                  <p class="text-slate-600 dark:text-slate-300 text-sm">
                    “{{ card?.meaning }}”
                  </p>
                </div>

                <div class="relative text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Đánh giá độ khó bên dưới
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-center mt-6 min-h-[52px]">
            <transition name="fade-slide" mode="out-in">
              <div
                v-if="isFlipped && !showResult && currentCard < props.flashcards.length"
                key="buttons"
                class="flex flex-wrap justify-center gap-3"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-sm transition-all hover:-translate-y-0.5"
                  data-cursor-text="HARD"
                  @click="handleAnswer(false)"
                >
                  <Icon name="lucide:x" class="w-5 h-5" />
                  Khó
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white border border-primary-400 font-bold text-sm shadow-md shadow-primary-500/25 transition-all hover:-translate-y-0.5"
                  data-cursor-text="EASY"
                  @click="handleAnswer(true)"
                >
                  <Icon name="lucide:check" class="w-5 h-5" />
                  Dễ
                </button>
              </div>

              <div
                v-else-if="showResult"
                key="result"
                class="flex items-center gap-2 text-base font-extrabold"
                :class="
                  lastAnswerCorrect
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                <Icon
                  :name="
                    lastAnswerCorrect
                      ? 'lucide:check-circle-2'
                      : 'lucide:refresh-cw'
                  "
                  class="w-5 h-5"
                />
                {{
                  lastAnswerCorrect
                    ? demo
                      ? 'Tốt lắm!'
                      : 'Tốt lắm — đã lưu SRS!'
                    : demo
                      ? 'Thử thẻ tiếp theo nhé'
                      : 'Sẽ ôn lại sớm hơn'
                }}
              </div>

              <div
                v-else-if="currentCard < props.flashcards.length"
                key="hint"
                class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400"
              >
                <Icon name="lucide:mouse-pointer-click" class="w-4 h-4" />
                Lật thẻ rồi chọn Dễ hoặc Khó
              </div>
            </transition>
          </div>

          <!-- Session complete -->
          <div
            v-if="currentCard >= props.flashcards.length"
            class="mt-2 max-w-lg mx-auto rounded-2xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-slate-900 dark:to-primary-950/40 p-8 text-center shadow-lg"
          >
            <Icon
              name="lucide:sparkles"
              class="w-12 h-12 text-primary-500 mx-auto mb-3"
            />
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Hoàn thành bộ thẻ!
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
              <template v-if="demo">
                Đây chỉ là demo trên trang chủ — không lưu tiến độ. Vào lộ trình để học thật với SRS.
              </template>
              <template v-else>
                Tiến độ đã được ghi nhận. Tiếp tục lộ trình để ôn SRS.
              </template>
            </p>
            <div class="flex justify-center gap-4 mb-6">
              <div class="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-primary-200/70 dark:border-primary-800">
                <div class="text-2xl font-black text-primary-600 dark:text-primary-400">
                  {{ sessionStats.correct }}
                </div>
                <div class="text-xs font-bold text-slate-500">Dễ</div>
              </div>
              <div class="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-red-200/70 dark:border-red-900">
                <div class="text-2xl font-black text-red-600 dark:text-red-400">
                  {{ sessionStats.incorrect }}
                </div>
                <div class="text-xs font-bold text-slate-500">Khó</div>
              </div>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                @click="resetSession"
              >
                <Icon name="lucide:refresh-cw" class="w-4 h-4" />
                Ôn lại bộ thẻ
              </button>
              <NuxtLink
                to="/progress"
                class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold transition-colors"
              >
                <Icon name="lucide:trending-up" class="w-4 h-4" />
                Xem tiến độ
              </NuxtLink>
            </div>
          </div>

          <div class="flex justify-center mt-5">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-semibold transition-colors"
              @click="resetSession"
            >
              <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
              {{ demo ? 'Reset Demo' : 'Reset tiến độ bài này' }}
            </button>
          </div>
          </div>
        </AwesomeLandingReveal>

        <!-- Right: live mastery panel -->
        <AwesomeLandingReveal variant="right" :delay="120" class="lg:col-span-3 order-3">
          <aside class="space-y-4">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-1">
            Tiến độ thẻ
          </h4>

          <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-bold text-slate-900 dark:text-white">{{ demo ? 'Phiên hiện tại' : 'Tiến độ đã lưu' }}</span>
              <span class="text-xs font-semibold text-slate-500">
                {{ reviewedCount }}/{{ props.flashcards.length }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-4">
              <div class="rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50 p-3 text-center">
                <Icon name="lucide:check" class="w-4 h-4 text-primary-600 mx-auto mb-1" />
                <div class="text-lg font-black text-primary-700 dark:text-primary-300">
                  {{ sessionStats.correct }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">Dễ</div>
              </div>
              <div class="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3 text-center">
                <Icon name="lucide:x" class="w-4 h-4 text-red-500 mx-auto mb-1" />
                <div class="text-lg font-black text-red-600 dark:text-red-300">
                  {{ sessionStats.incorrect }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">Khó</div>
              </div>
              <div class="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-3 text-center">
                <Icon name="lucide:flame" class="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <div class="text-lg font-black text-amber-700 dark:text-amber-300">
                  {{ sessionStreak }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">Streak</div>
              </div>
              <div class="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3 text-center">
                <Icon name="lucide:hash" class="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div class="text-lg font-black text-blue-700 dark:text-blue-300">
                  {{ sessionStats.total }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">Đã ôn</div>
              </div>
            </div>

            <!-- Deck completion meter -->
            <div class="mt-1">
              <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                <span>Tiến độ bộ thẻ</span>
                <span>{{ reviewedCount }}/{{ props.flashcards.length }}</span>
              </div>
              <div class="flex gap-1">
                <div
                  v-for="(fc, index) in props.flashcards"
                  :key="fc.id || index"
                  class="h-1.5 flex-1 rounded-full transition-colors"
                  :class="
                    wordsProgress[fc.id]?.lastReviewedAt
                      ? 'bg-primary-500'
                      : index === currentCard
                        ? 'bg-primary-300 dark:bg-primary-700'
                        : 'bg-slate-200 dark:bg-slate-700'
                  "
                />
              </div>
            </div>
          </div>

          <div
            v-if="demo"
            class="rounded-2xl border border-primary-200/80 dark:border-primary-800/60 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-slate-900 p-5 hidden lg:block"
          >
            <div class="flex gap-3">
              <div class="w-9 h-9 shrink-0 rounded-xl bg-primary-500 text-white flex items-center justify-center">
                <Icon name="lucide:sparkles" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Đây chỉ là demo
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Số liệu mất khi reload. Học thật tại
                  <NuxtLink
                    to="/progress"
                    class="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Học bài
                  </NuxtLink>
                  hoặc
                  <NuxtLink
                    to="/review"
                    class="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Ôn tập SRS
                  </NuxtLink>.
                </p>
              </div>
            </div>
          </div>
          <div
            v-else
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hidden lg:block"
          >
            <p class="text-sm font-bold text-slate-900 dark:text-white mb-1">Mẹo nhanh</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Đánh giá thành thật — SRS chỉ hiệu quả khi “Khó” thật sự được đánh dấu khó.
            </p>
          </div>
          </aside>
        </AwesomeLandingReveal>
      </div>
    </div>
  </section>
</template>

<style lang="css" scoped>
.perspective {
  perspective: 1200px;
}
.preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
