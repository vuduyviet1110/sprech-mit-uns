<script lang="ts" setup>
import { usePronunciationDrill } from '~/composables/use-pronunciation-drill'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useShadowing } from '~/composables/useShadowing'
import { useGamification } from '~/composables/use-gamification'
import { isPass } from '~/utils/shadowing-score'

definePageMeta({ layout: 'page' })
useHead({ title: 'Ôn phát âm - Sprech Mit Uns' })

const { items, dueItems, dueCount, markSuccess, removeItem, clearAll } = usePronunciationDrill()
const { playAudioOrSpeak } = useAudioPlayback()
const { playSound } = useGamification()

const {
  isSupported,
  isListening,
  lastResult,
  feedback,
  listenOnly,
  startMic,
  stopMic,
  evaluateAgainst,
  setLang,
} = useShadowing()

const mode = ref<'due' | 'all'>('due')
const currentIdx = ref(0)
const showList = ref(true)

const queue = computed(() => (mode.value === 'due' ? dueItems.value : items.value))
const current = computed(() => queue.value[currentIdx.value] || null)

watch(mode, () => {
  currentIdx.value = 0
})

watch(
  () => current.value?.language,
  (lang) => {
    if (lang) setLang(lang)
  },
  { immediate: true },
)

const playWord = () => {
  if (!current.value) return
  playAudioOrSpeak({ word: current.value.word, lang: current.value.language })
}

const playPhrase = () => {
  if (!current.value) return
  playAudioOrSpeak({ word: current.value.phrase, lang: current.value.language })
}

const startCheck = () => {
  if (!isSupported.value || listenOnly.value) return
  startMic()
}

const finishCheck = () => {
  if (!current.value) return
  stopMic()
  // Score against the single weak word first; also allow phrase
  const fb = evaluateAgainst(current.value.word, current.value.language)
  if (fb && isPass(fb.score)) {
    playSound('correct')
    markSuccess(current.value.id)
  } else {
    playSound('wrong')
  }
}

const next = () => {
  stopMic()
  if (currentIdx.value + 1 < queue.value.length) currentIdx.value++
  else currentIdx.value = 0
}

const passWithoutMic = () => {
  if (!current.value) return
  markSuccess(current.value.id)
  playSound('correct')
  next()
}
</script>

<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-clip">
    <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
      <header class="space-y-2">
        <NuxtLink
          to="/practice/shadowing"
          class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
          Shadowing Lab
        </NuxtLink>
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ôn phát âm ngắt quãng
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Từ bạn nhại lệch được xếp lịch lại (1 → 3 → 7 ngày khi đúng). Não củng cố trước khi quên —
          giống SRS nhưng tập trung muscle memory miệng.
        </p>
      </header>

      <div class="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          :class="mode === 'due' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800'"
          @click="mode = 'due'"
        >
          Đến hạn ({{ dueCount }})
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          :class="mode === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800'"
          @click="mode = 'all'"
        >
          Tất cả ({{ items.length }})
        </button>
        <button
          type="button"
          class="ml-auto text-xs font-bold text-slate-500 hover:text-primary-600 cursor-pointer"
          @click="showList = !showList"
        >
          {{ showList ? 'Ẩn danh sách' : 'Hiện danh sách' }}
        </button>
        <button
          v-if="items.length"
          type="button"
          class="text-xs font-bold text-rose-500 cursor-pointer"
          @click="clearAll()"
        >
          Xóa hết
        </button>
      </div>

      <div
        v-if="!queue.length"
        class="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3"
      >
        <p class="font-bold text-slate-600 dark:text-slate-300">
          {{ mode === 'due' ? 'Không có từ đến hạn ôn.' : 'Chưa có từ yếu nào.' }}
        </p>
        <NuxtLink
          to="/practice/shadowing"
          class="text-sm font-extrabold text-primary-600 hover:underline"
        >
          Luyện Shadowing để thu thập từ sai
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Drill card -->
        <div
          v-if="current"
          class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
        >
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{{ currentIdx + 1 }} / {{ queue.length }}</span>
            <span>Sai ×{{ current.failCount }}</span>
          </div>

          <div class="text-center space-y-2">
            <p class="text-3xl font-black text-slate-900 dark:text-white tracking-wide">
              {{ current.word }}
            </p>
            <p class="text-sm text-slate-500 italic">«{{ current.phrase }}»</p>
            <p v-if="current.tip" class="text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 rounded-xl p-3 text-left">
              {{ current.tip }}
            </p>
          </div>

          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-extrabold cursor-pointer"
              @click="playWord"
            >
              🔊 Nghe từ
            </button>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              @click="playPhrase"
            >
              Nghe cả câu
            </button>
            <button
              v-if="isSupported"
              type="button"
              class="px-4 py-2.5 rounded-xl border-2 border-primary-300 text-primary-700 dark:text-primary-300 text-xs font-extrabold cursor-pointer"
              @click="isListening ? finishCheck() : startCheck()"
            >
              {{ isListening ? 'Dừng & chấm' : 'Nhại từ' }}
            </button>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
              @click="passWithoutMic"
            >
              Đã nói đúng (tự chấm)
            </button>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              @click="next"
            >
              Bỏ qua
            </button>
          </div>

          <p v-if="lastResult" class="text-center text-sm">
            Bạn nói: <span class="font-bold">«{{ lastResult }}»</span>
          </p>
          <div v-if="feedback" class="text-center space-y-2">
            <p
              class="text-lg font-black tabular-nums"
              :class="isPass(feedback.score) ? 'text-emerald-600' : 'text-amber-600'"
            >
              {{ feedback.score }}/100
            </p>
            <p class="text-xs text-slate-500">
              {{ isPass(feedback.score) ? 'Đạt — lịch ôn được kéo dài.' : 'Chưa đạt — vẫn đến hạn, thử lại sau khi nghe TTS.' }}
            </p>
          </div>
        </div>

        <!-- List -->
        <div v-if="showList" class="space-y-2">
          <p class="text-xs font-extrabold uppercase tracking-wider text-slate-400">Danh sách</p>
          <div
            v-for="(item, i) in queue"
            :key="item.id"
            class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            :class="i === currentIdx ? 'ring-2 ring-primary-400' : ''"
          >
            <button
              type="button"
              class="flex-1 text-left cursor-pointer"
              @click="currentIdx = i"
            >
              <span class="font-extrabold text-slate-900 dark:text-white">{{ item.word }}</span>
              <span class="block text-[11px] text-slate-500 truncate">{{ item.phrase }}</span>
            </button>
            <span class="text-sm font-bold text-slate-400 tabular-nums">×{{ item.failCount }}</span>
            <button
              type="button"
              class="text-slate-400 hover:text-rose-500 cursor-pointer"
              @click="removeItem(item.id)"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
