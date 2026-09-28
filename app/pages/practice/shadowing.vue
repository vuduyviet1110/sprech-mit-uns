<script lang="ts" setup>
import { useShadowing } from '~/composables/useShadowing'
import { useLanguage } from '~/composables/use-language'
import { useDailyPath } from '~/composables/use-daily-path'
import { useDailyQuests } from '~/composables/use-daily-quests'
import { useGamification } from '~/composables/use-gamification'
import { usePronunciationDrill } from '~/composables/use-pronunciation-drill'

definePageMeta({ layout: 'page' })
useHead({ title: 'Shadowing Lab - Sprech Mit Uns' })

const { currentLanguage, setLanguage } = useLanguage()
const { markBlockComplete } = useDailyPath()
const { recordShadowingSessionComplete } = useDailyQuests()
const { playSound, triggerConfetti } = useGamification()
const { addFailures, dueCount } = usePronunciationDrill()

const level = ref('A1')
const loading = ref(true)
const lines = ref<
  { id: string; text: string; meaning?: string | null; language: string; level: string }[]
>([])
const index = ref(0)
const sessionDone = ref(false)
const practiced = ref(0)
const sessionWeakCount = ref(0)
const addedToDrill = ref(false)
const awaitingScore = ref(false)
/** Chỉ hiện điểm khi khớp đúng câu đang xem */
const scoredLineId = ref<string | null>(null)

const {
  isSupported,
  isListening,
  lastResult,
  feedback,
  micError,
  listenOnly,
  countdown,
  playLine,
  startCountdown,
  startMic,
  stopMic,
  clearAttempt,
  evaluateAgainst,
  setLang,
  recordingUrl,
  isPlayingSelf,
  isRecording,
  recordSupported,
  playRecording,
  stopSelfPlayback,
} = useShadowing({ lang: () => currentLanguage.value })

const current = computed(() => lines.value[index.value] || null)

const activeFeedback = computed(() => {
  if (!feedback.value || !current.value) return null
  if (scoredLineId.value !== current.value.id) return null
  return feedback.value
})

const scoreTone = computed(() => {
  const s = activeFeedback.value?.score ?? 0
  if (s >= 85) return 'emerald'
  if (s >= 60) return 'amber'
  return 'rose'
})

const applyScore = async () => {
  if (!current.value) return
  const spoken = lastResult.value?.trim()
  if (!spoken) return

  await stopMic()
  awaitingScore.value = false
  const lineId = current.value.id
  const fb = evaluateAgainst(current.value.text, currentLanguage.value)
  if (!fb) return
  scoredLineId.value = lineId

  if (fb.score >= 60) playSound('correct')
  else playSound('wrong')

  if (fb.drillItems.length && fb.score < 90) {
    addFailures(fb.drillItems, currentLanguage.value)
    sessionWeakCount.value += fb.drillItems.length
    addedToDrill.value = true
  }
}

/** Auto-chấm khi mic tự tắt (sau khi nói xong) hoặc khi có transcript. */
watch([isListening, lastResult], () => {
  if (!awaitingScore.value || listenOnly.value) return
  if (isListening.value) return
  if (!lastResult.value?.trim()) return
  if (activeFeedback.value) return
  applyScore()
})

const fetchLines = async () => {
  loading.value = true
  sessionDone.value = false
  index.value = 0
  practiced.value = 0
  sessionWeakCount.value = 0
  void clearAttempt()
  awaitingScore.value = false
  scoredLineId.value = null
  addedToDrill.value = false
  try {
    const res = await $fetch<{ lines: typeof lines.value }>(
      `/api/practice/shadowing?level=${level.value}&lang=${currentLanguage.value}&limit=12`,
    )
    lines.value = res.lines || []
  } catch (e) {
    console.error(e)
    lines.value = []
  } finally {
    loading.value = false
  }
}

watch([currentLanguage, level], () => {
  setLang(currentLanguage.value)
  fetchLines()
})

onMounted(fetchLines)

const playCurrent = () => {
  if (!current.value) return
  stopSelfPlayback()
  playLine(current.value.text, current.value.language || currentLanguage.value)
  if (!listenOnly.value) {
    startCountdown(2)
  }
}

const playWord = (word: string) => {
  stopSelfPlayback()
  playLine(word, currentLanguage.value)
}

const comparePlayback = async () => {
  if (!current.value || !recordingUrl.value) return
  // Nghe mẫu rồi nghe lại giọng mình — đối chiếu rõ hơn
  stopSelfPlayback()
  playLine(current.value.text, current.value.language || currentLanguage.value)
  // Đợi TTS ~ độ dài ước lượng rồi phát bản thu
  const ms = Math.min(8000, Math.max(1500, current.value.text.length * 80))
  setTimeout(() => {
    void playRecording()
  }, ms)
}

const beginRepeat = async () => {
  if (listenOnly.value || !isSupported.value) return
  addedToDrill.value = false
  scoredLineId.value = null
  awaitingScore.value = true
  await startMic()
}

const checkSpeech = () => {
  applyScore()
}

const nextLine = () => {
  void clearAttempt()
  awaitingScore.value = false
  scoredLineId.value = null
  practiced.value++
  addedToDrill.value = false
  if (index.value + 1 < lines.value.length) {
    index.value++
  } else {
    finishSession()
  }
}

const skipLine = () => {
  nextLine()
}

/** Đổi câu / ngôn ngữ / level → luôn xóa điểm cũ */
watch(index, () => {
  void clearAttempt()
  awaitingScore.value = false
  scoredLineId.value = null
  addedToDrill.value = false
})

const finishSession = () => {
  sessionDone.value = true
  markBlockComplete('shadowing')
  recordShadowingSessionComplete()
  playSound('complete')
  triggerConfetti()
}

const levelLabel = (score: number) => {
  if (score >= 90) return 'Xuất sắc'
  if (score >= 75) return 'Tốt'
  if (score >= 60) return 'Khá — cần ôn vài từ'
  return 'Cần luyện thêm'
}
</script>

<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-clip">
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute -top-20 right-0 h-72 w-72 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-700/10" />
      <div class="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-700/10" />
    </div>

    <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-7 space-y-5">
      <header class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              to="/today"
              class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600"
            >
              <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
              Lộ trình hôm nay
            </NuxtLink>
            <span class="text-slate-300 dark:text-slate-700">/</span>
            <NuxtLink
              to="/practice/pronunciation"
              class="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Icon name="lucide:list-music" class="w-3.5 h-3.5" />
              Ôn phát âm
              <span
                v-if="dueCount"
                class="px-1.5 py-0.5 rounded-md bg-primary-500 text-white text-sm tabular-nums"
              >
                {{ dueCount }}
              </span>
            </NuxtLink>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Shadowing Lab
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Nghe → nhại → xem điểm & diff. Từ sai tự vào danh sách ôn ngắt quãng.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 items-center shrink-0">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              class="px-3.5 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
              :class="currentLanguage === 'de' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm' : 'text-slate-500'"
              @click="setLanguage('de')"
            >
              🇩🇪 DE
            </button>
            <button
              type="button"
              class="px-3.5 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
              :class="currentLanguage === 'cs' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm' : 'text-slate-500'"
              @click="setLanguage('cs')"
            >
              🇨🇿 CZ
            </button>
          </div>
          <select
            v-model="level"
            class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
          </select>
          <label class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <input v-model="listenOnly" type="checkbox" class="accent-primary-500" />
            Không mic
          </label>
        </div>
      </header>

      <div v-if="loading" class="py-20 text-center text-sm font-bold text-slate-500">
        Đang tải câu hội thoại…
      </div>

      <div
        v-else-if="!lines.length"
        class="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3"
      >
        <p class="font-bold text-slate-600 dark:text-slate-300">Chưa có câu phù hợp cho cấp độ này.</p>
        <NuxtLink to="/dictionary" class="text-sm font-extrabold text-primary-600 hover:underline">
          Thêm từ có ví dụ vào từ điển
        </NuxtLink>
      </div>

      <div
        v-else-if="sessionDone"
        class="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-8 text-center space-y-4"
      >
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
          <Icon name="lucide:check" class="w-7 h-7" />
        </div>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">Phiên Shadowing xong!</h2>
        <p class="text-sm text-slate-500">
          Đã luyện {{ practiced }} câu.
          <span v-if="sessionWeakCount"> {{ sessionWeakCount }} từ yếu đã vào danh sách ôn phát âm.</span>
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink
            v-if="dueCount"
            to="/practice/pronunciation"
            class="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-extrabold"
          >
            Ôn từ phát âm sai ({{ dueCount }})
          </NuxtLink>
          <NuxtLink
            to="/practice/recall"
            class="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-extrabold"
          >
            Active Recall
          </NuxtLink>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold cursor-pointer"
            @click="fetchLines"
          >
            Luyện lại
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <span>Câu {{ index + 1 }} / {{ lines.length }}</span>
          <span class="tabular-nums">{{ Math.round(((index + 1) / lines.length) * 100) }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all"
            :style="{ width: `${((index + 1) / lines.length) * 100}%` }"
          />
        </div>

        <!-- Wide 2-column practice -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6 items-start">
          <!-- Left: practice -->
          <div class="xl:col-span-7 space-y-4">
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
              <div class="space-y-3 text-center xl:text-left">
                <p class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-relaxed tracking-wide">
                  {{ current?.text }}
                </p>
                <p v-if="current?.meaning" class="text-sm text-slate-500 italic">
                  {{ current.meaning }}
                </p>
              </div>

              <div class="flex flex-wrap justify-center xl:justify-start gap-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-sm cursor-pointer"
                  @click="playCurrent"
                >
                  <Icon name="lucide:volume-2" class="w-5 h-5" />
                  Nghe mẫu
                </button>
                <button
                  v-if="!listenOnly && isSupported"
                  type="button"
                  class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-extrabold text-sm cursor-pointer"
                  :class="
                    isListening
                      ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950/40'
                      : lastResult && !activeFeedback
                        ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                        : 'border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  "
                  @click="isListening || (lastResult && !activeFeedback) ? checkSpeech() : beginRepeat()"
                >
                  <Icon
                    :name="isListening ? 'lucide:square' : lastResult && !activeFeedback ? 'lucide:check-circle' : 'lucide:mic'"
                    class="w-5 h-5"
                  />
                  {{
                    isListening
                      ? 'Dừng & chấm'
                      : lastResult && !activeFeedback
                        ? 'Chấm điểm ngay'
                        : countdown > 0
                          ? `Nhại (${countdown})`
                          : 'Nhại lại'
                  }}
                </button>
                <button
                  type="button"
                  class="px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  @click="skipLine"
                >
                  Bỏ qua
                </button>
              </div>

              <p v-if="countdown > 0 && !listenOnly" class="text-sm font-bold text-primary-600">
                Chuẩn bị nói sau {{ countdown }}…
              </p>
              <p v-if="lastResult" class="text-sm text-slate-600 dark:text-slate-300">
                Bạn nói: <span class="font-bold">«{{ lastResult }}»</span>
              </p>

              <div v-if="recordingUrl" class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 text-xs font-extrabold cursor-pointer"
                  :class="isPlayingSelf ? 'bg-sky-50 dark:bg-sky-950/40' : ''"
                  @click="playRecording()"
                >
                  <Icon :name="isPlayingSelf ? 'lucide:pause' : 'lucide:mic-vocal'" class="w-4 h-4" />
                  {{ isPlayingSelf ? 'Đang phát giọng bạn…' : 'Nghe lại giọng bạn' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold cursor-pointer"
                  @click="comparePlayback"
                >
                  <Icon name="lucide:git-compare" class="w-4 h-4" />
                  Đối chiếu: mẫu → bạn
                </button>
              </div>
              <p v-else-if="isRecording" class="text-xs font-bold text-primary-600 animate-pulse">
                Đang thu âm để nghe lại…
              </p>
              <p v-else-if="lastResult && recordSupported === false" class="text-xs text-slate-400">
                Trình duyệt không hỗ trợ thu file — chỉ có transcript.
              </p>
              <p v-if="lastResult && !activeFeedback && awaitingScore" class="text-xs font-bold text-amber-600 animate-pulse">
                Đang chấm điểm…
              </p>
              <p v-else-if="lastResult && !activeFeedback" class="text-xs font-bold text-amber-600">
                Bấm «Chấm điểm ngay» để xem điểm, diff và gợi ý sửa.
              </p>

              <p v-if="micError" class="text-xs text-amber-600">{{ micError }}</p>
              <p v-if="!isSupported && !listenOnly" class="text-xs text-slate-500">
                Trình duyệt không hỗ trợ nhận diện giọng — bật “Không mic”.
              </p>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                class="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-sm cursor-pointer"
                @click="nextLine"
              >
                {{ index + 1 >= lines.length ? 'Kết thúc phiên' : 'Câu tiếp' }}
              </button>
            </div>
          </div>

          <!-- Right: feedback panel -->
          <aside class="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
            <div
              v-if="activeFeedback"
              class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-20 h-20 shrink-0 rounded-2xl flex flex-col items-center justify-center text-white font-black"
                  :class="{
                    'bg-emerald-500': scoreTone === 'emerald',
                    'bg-amber-500': scoreTone === 'amber',
                    'bg-rose-500': scoreTone === 'rose',
                  }"
                >
                  <span class="text-2xl tabular-nums">{{ activeFeedback.score }}</span>
                  <span class="text-sm font-bold opacity-90">/100</span>
                </div>
                <div class="min-w-0 space-y-1">
                  <p class="text-base font-extrabold text-slate-900 dark:text-white">
                    {{ levelLabel(activeFeedback.score) }}
                  </p>
                  <p class="text-xs text-slate-500">
                    Khớp {{ Math.round(activeFeedback.similarity * 100) }}% ·
                    sai {{ activeFeedback.wrongWords.length }} · thiếu {{ activeFeedback.missingWords.length }}
                  </p>
                  <p v-if="addedToDrill" class="text-xs font-bold text-primary-600 dark:text-primary-400">
                    Đã thêm từ yếu vào ôn phát âm.
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                  Diff từng từ
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="(tok, ti) in activeFeedback.tokens"
                    :key="ti"
                    type="button"
                    class="px-2 py-1 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer"
                    :class="{
                      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300':
                        tok.kind === 'match',
                      'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300':
                        tok.kind === 'wrong',
                      'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300':
                        tok.kind === 'missing',
                      'bg-slate-100 border-slate-300 text-slate-500 line-through dark:bg-slate-800 dark:border-slate-600':
                        tok.kind === 'extra',
                    }"
                    :title="
                      tok.kind === 'wrong'
                        ? `Bạn: ${tok.spoken} → Đúng: ${tok.expected}`
                        : tok.kind === 'missing'
                          ? `Thiếu: ${tok.expected}`
                          : tok.kind === 'extra'
                            ? `Thừa: ${tok.spoken}`
                            : tok.expected
                    "
                    @click="playWord(tok.expected || tok.spoken || '')"
                  >
                    <template v-if="tok.kind === 'wrong'">
                      <span class="opacity-60 line-through">{{ tok.spoken }}</span>
                      → {{ tok.expected }}
                    </template>
                    <template v-else-if="tok.kind === 'missing'">
                      +{{ tok.expected }}
                    </template>
                    <template v-else-if="tok.kind === 'extra'">
                      {{ tok.spoken }}
                    </template>
                    <template v-else>
                      {{ tok.expected }}
                    </template>
                  </button>
                </div>
                <p class="text-[11px] text-slate-400">
                  Chạm từ để nghe TTS · xanh đúng · vàng lệch · đỏ thiếu
                </p>
              </div>

              <div v-if="activeFeedback.tips.length" class="space-y-2">
                <p class="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                  Gợi ý cải thiện
                </p>
                <div
                  v-for="tip in activeFeedback.tips"
                  :key="tip.id"
                  class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-3 space-y-1"
                >
                  <p class="text-xs font-extrabold text-slate-800 dark:text-slate-100">{{ tip.title }}</p>
                  <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ tip.detail }}</p>
                  <div v-if="tip.focusWords.length" class="flex flex-wrap gap-1.5 pt-1">
                    <button
                      v-for="w in tip.focusWords"
                      :key="w"
                      type="button"
                      class="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-[11px] font-bold cursor-pointer"
                      @click="playWord(w)"
                    >
                      🔊 {{ w }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 space-y-3"
            >
              <p class="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Icon name="lucide:panel-right" class="w-4 h-4 text-primary-500" />
                Bảng điểm & gợi ý
              </p>
              <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                <li>1. Bấm <strong>Nghe mẫu</strong></li>
                <li>2. Bấm <strong>Nhại lại</strong> và nói câu trên</li>
                <li>3. Điểm, diff từng từ và tip sửa sẽ hiện ở đây</li>
                <li>4. Dùng <strong>Nghe lại giọng bạn</strong> để đối chiếu</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>
