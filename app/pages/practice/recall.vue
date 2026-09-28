<script lang="ts" setup>
import { useLanguage } from '~/composables/use-language'
import { useDailyPath } from '~/composables/use-daily-path'
import { useDailyQuests } from '~/composables/use-daily-quests'
import { useGamification } from '~/composables/use-gamification'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useSrsStore } from '~/stores/useSrsStore'
import { fuzzyMatch } from '~/utils/fuzzy-text'

import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })
useHead({ title: 'Active Recall - Sprech Mit Uns' })

const { userId: sessionUserId } = useSession()
const userId = computed(() => sessionUserId.value || '')
const { currentLanguage, setLanguage } = useLanguage()
const { markBlockComplete } = useDailyPath()
const { recordRecallSentences } = useDailyQuests()
const { playSound, triggerConfetti } = useGamification()
const { playAudioOrSpeak } = useAudioPlayback()
const srsStore = useSrsStore()

const loading = ref(true)
const prompts = ref<
  { id: string; word: string; meaning: string; example?: string | null; language: string }[]
>([])
const sentences = ref(['', '', ''])
const feedback = ref<(string | null)[]>([null, null, null])
const sessionDone = ref(false)
const addingPhrase = ref(false)

const filledCount = computed(
  () => sentences.value.filter((s) => s.trim().length >= 4).length,
)

const fetchPrompts = async () => {
  loading.value = true
  sessionDone.value = false
  sentences.value = ['', '', '']
  feedback.value = [null, null, null]
  try {
    const res = await $fetch<{ prompts: typeof prompts.value }>(
      `/api/practice/recall?userId=${userId.value}&lang=${currentLanguage.value}&limit=8`,
    )
    prompts.value = res.prompts || []
  } catch (e) {
    console.error(e)
    prompts.value = []
  } finally {
    loading.value = false
  }
}

watch(currentLanguage, fetchPrompts)
onMounted(fetchPrompts)

const ensureSlots = () => {
  while (sentences.value.length < 5) {
    sentences.value.push('')
    feedback.value.push(null)
  }
}

const addSlot = () => {
  if (sentences.value.length >= 5) return
  sentences.value.push('')
  feedback.value.push(null)
}

const checkOne = (idx: number) => {
  const text = sentences.value[idx]?.trim()
  if (!text) return
  const hint = prompts.value[idx % Math.max(prompts.value.length, 1)]
  if (hint?.example) {
    const { level } = fuzzyMatch(text, hint.example)
    if (level === 'exact' || level === 'close') {
      feedback.value[idx] = 'Gần với ví dụ mẫu — tốt!'
      playSound('correct')
      return
    }
  }
  // Soft check: contains the target word
  if (hint?.word && text.toLowerCase().includes(hint.word.toLowerCase())) {
    feedback.value[idx] = `Có dùng «${hint.word}» — ổn!`
    playSound('correct')
  } else {
    feedback.value[idx] =
      'Đã ghi nhận câu của bạn. Nghe lại bằng TTS nếu muốn tự kiểm.'
    playSound('correct')
  }
}

const speakSentence = (idx: number) => {
  const text = sentences.value[idx]?.trim()
  if (!text) return
  playAudioOrSpeak({ word: text, lang: currentLanguage.value })
}

const finishSession = () => {
  if (filledCount.value < 3) return
  for (let i = 0; i < sentences.value.length; i++) {
    if (sentences.value[i].trim()) checkOne(i)
  }
  recordRecallSentences(filledCount.value)
  markBlockComplete('recall')
  sessionDone.value = true
  playSound('complete')
  triggerConfetti()
}

const addPhraseToSrs = async (idx: number) => {
  const text = sentences.value[idx]?.trim()
  if (!text) return
  addingPhrase.value = true
  try {
    const hint = prompts.value[idx % Math.max(prompts.value.length, 1)]
    await srsStore.addToSrs(
      text,
      hint?.meaning ? `Câu tự viết · ${hint.meaning}` : 'Câu Active Recall tự viết',
      currentLanguage.value,
    )
  } finally {
    addingPhrase.value = false
  }
}

ensureSlots()
</script>

<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-clip">
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute top-10 left-10 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl dark:bg-amber-700/10" />
    </div>

    <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
      <header class="space-y-2">
        <NuxtLink
          to="/today"
          class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
          Lộ trình hôm nay
        </NuxtLink>
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Active Recall
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Gấp “sách” lại — tự viết 3–5 câu dùng từ đã học. Não lục tìm mạnh hơn đọc thụ động.
        </p>
      </header>

      <div class="flex flex-wrap gap-2">
        <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
            :class="currentLanguage === 'de' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-500'"
            @click="setLanguage('de')"
          >
            🇩🇪 DE
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
            :class="currentLanguage === 'cs' ? 'bg-white dark:bg-slate-900 text-primary-600' : 'text-slate-500'"
            @click="setLanguage('cs')"
          >
            🇨🇿 CZ
          </button>
        </div>
      </div>

      <div v-if="loading" class="py-16 text-center text-sm font-bold text-slate-500">
        Đang lấy gợi ý từ…
      </div>

      <template v-else>
        <div
          v-if="prompts.length"
          class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
        >
          <h2 class="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Gợi ý từ hôm nay / đến hạn
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="p in prompts.slice(0, 8)"
              :key="p.id"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <span class="text-primary-600 dark:text-primary-400">{{ p.word }}</span>
              <span class="text-slate-400 font-medium">{{ p.meaning }}</span>
            </span>
          </div>
        </div>

        <div
          v-if="sessionDone"
          class="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-8 text-center space-y-4"
        >
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">
            Đã viết {{ filledCount }} câu — phiên tối hoàn thành!
          </h2>
          <NuxtLink to="/today" class="inline-flex text-sm font-extrabold text-primary-600 hover:underline">
            Về lộ trình hôm nay
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(s, idx) in sentences"
            :key="idx"
            class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
          >
            <label class="text-xs font-extrabold text-slate-500 uppercase">Câu {{ idx + 1 }}</label>
            <textarea
              v-model="sentences[idx]"
              rows="2"
              class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
              :placeholder="
                prompts[idx]
                  ? `Thử dùng «${prompts[idx].word}» (${prompts[idx].meaning})…`
                  : 'Viết một câu ngắn bằng ngôn ngữ đích…'
              "
            />
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                @click="checkOne(idx)"
              >
                Tự kiểm
              </button>
              <button
                type="button"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                @click="speakSentence(idx)"
              >
                <Icon name="lucide:volume-2" class="w-3.5 h-3.5" />
                TTS
              </button>
              <button
                type="button"
                class="text-xs font-bold px-3 py-1.5 rounded-lg text-primary-600 cursor-pointer disabled:opacity-50"
                :disabled="addingPhrase || !sentences[idx]?.trim()"
                @click="addPhraseToSrs(idx)"
              >
                Thêm cụm vào SRS
              </button>
            </div>
            <p v-if="feedback[idx]" class="text-xs font-medium text-slate-500">{{ feedback[idx] }}</p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="text-sm font-bold text-slate-500 hover:text-primary-600 cursor-pointer disabled:opacity-40"
              :disabled="sentences.length >= 5"
              @click="addSlot"
            >
              + Thêm câu (tối đa 5)
            </button>
            <button
              type="button"
              class="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-extrabold text-sm cursor-pointer"
              :disabled="filledCount < 3"
              @click="finishSession"
            >
              Hoàn thành ({{ filledCount }}/3)
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
