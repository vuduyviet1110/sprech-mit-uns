<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useLanguage } from '~/composables/use-language'
import {
  SCORE_EXCELLENT,
  buildShadowingReport,
  isPass,
} from '~/utils/shadowing-score'
import { usePronunciationDrill } from '~/composables/use-pronunciation-drill'
import type { DiffKind, ShadowingScoreReport } from '~/utils/shadowing-score'
import LessonDictationClipList from '~/components/lesson/DictationClipList.vue'
import { extractYoutubeId } from '~/utils/youtube-url'

definePageMeta({ layout: 'page' })
useHead({ title: 'YouTube Dictation Lab - Sprech Mit Uns' })

const { playSound, triggerConfetti } = useGamification()
const { currentLanguage } = useLanguage()
const { addFailures } = usePronunciationDrill()

const PLAYER_ELEMENT_ID = 'youtube-dictation-player'

// Starter sample lessons for German & Czech
const sampleLessonsDe = [
  {
    id: 'lesson-de-1',
    title: 'Easy German - Phỏng vấn đường phố ở Dresden',
    youtubeId: '3iV2WK1-IV8',
    url: 'https://www.youtube.com/watch?v=3iV2WK1-IV8',
    level: 'A2',
    language: 'de',
    thumbnail: 'https://img.youtube.com/vi/3iV2WK1-IV8/mqdefault.jpg',
    description:
      'Người Đức nói về thành phố Dresden — giọng tự nhiên, tốc độ vừa phải.',
  },
  {
    id: 'lesson-de-2',
    title: 'Chill German - Nghe hiểu chậm cho người mới',
    youtubeId: 'lwc1_Dukv_o',
    url: 'https://www.youtube.com/watch?v=lwc1_Dukv_o',
    level: 'A1',
    language: 'de',
    thumbnail: 'https://img.youtube.com/vi/lwc1_Dukv_o/mqdefault.jpg',
    description: 'Nói rất chậm và rõ, câu ngắn — phù hợp người mới bắt đầu.',
  },
]

const sampleLessonsCs = [
  {
    id: 'lesson-cs-1',
    title: 'Easy Czech 1 - Do you speak English?',
    youtubeId: '9-4SJ_1Ypv0',
    url: 'https://www.youtube.com/watch?v=9-4SJ_1Ypv0',
    level: 'A1',
    language: 'cs',
    thumbnail: 'https://img.youtube.com/vi/9-4SJ_1Ypv0/mqdefault.jpg',
    description:
      'Bài học tiếng Séc cơ bản giao tiếp tự nhiên dành cho người Việt.',
  },
]

const currentSampleLessons = computed(() => {
  return currentLanguage.value === 'cs' ? sampleLessonsCs : sampleLessonsDe
})

const myLessons = ref<any[]>([])

const clips = ref<any[]>([])
const totalSegments = ref(0)
/** Chỉ số segment toàn cục của clip đầu tiên trong cửa sổ đang tải. */
const clipOffset = ref(0)
const isLoadingMore = ref(false)
const currentClipIdx = ref(0)
const youtubeUrl = ref('')
const inputUrl = ref('')
const isLoadingParse = ref(false)
const errorMessage = ref('')
/** Cảnh báo phụ đề khác ngôn ngữ đang học. Thuộc về video, không reset theo câu. */
const languageNotice = ref('')
const isSaved = ref(false)

const currentClip = computed(
  () => clips.value[currentClipIdx.value] || clips.value[0],
)
const clipText = (clip: any) => clip?.text || clip?.germanText || ''

const currentYoutubeId = computed(() => {
  if (currentClip.value?.youtubeId) return currentClip.value.youtubeId
  return (
    extractYoutubeId(youtubeUrl.value) ||
    (currentLanguage.value === 'cs' ? '9-4SJ_1Ypv0' : '3iV2WK1-IV8')
  )
})

// ---------------------------------------------------------------- Dictation state
const userSentence = ref('')
const isChecked = ref(false)
const isCorrect = ref(false)
const showSubtitle = ref(false)
const report = ref<ShadowingScoreReport | null>(null)
const showTips = ref(false)

/** 0 không gợi ý | 1 số từ | 2 chữ đầu | 3 che chữ | 4 đáp án đầy đủ */
const hintLevel = ref(0)

const clipStates = ref<
  Record<string, { done: boolean; score: number; attempts?: number }>
>({})
const maxUnlockedIdx = ref(0)

const resetClipUi = () => {
  userSentence.value = ''
  isChecked.value = false
  isCorrect.value = false
  hintLevel.value = 0
  showSubtitle.value = false
  showTips.value = false
  report.value = null
}

// ---------------------------------------------------------------- Player
const hasStarted = ref(false)
const playerError = ref(false)
/** Video cần mount sau khi workspace render xong (xem `setupPlayer`). */
const pendingPlayerVideoId = ref('')
const RATES = [0.5, 0.75, 1]

const {
  isReady: isPlayerReady,
  isPlaying,
  playbackRate,
  mount: mountPlayer,
  playSegment,
  replaySegment,
  setRate,
} = useYoutubePlayer({ elementId: PLAYER_ELEMENT_ID })

const playCurrentClip = () => {
  const clip = currentClip.value
  if (!clip) return
  playSegment(clip.start || 0, clip.end ?? (clip.start || 0) + 4)
}

/** Cú play đầu tiên phải xuất phát từ click thật, nếu không Chrome sẽ chặn. */
const startListening = () => {
  hasStarted.value = true
  playCurrentClip()
}

const replayCurrentClip = () => {
  if (!hasStarted.value) {
    startListening()
    return
  }
  replaySegment()
}

// Đổi đoạn → seek + phát (chỉ tự phát sau khi user đã bấm Bắt đầu)
watch(currentClip, (clip: any) => {
  if (!clip || !isPlayerReady.value) return
  if (!hasStarted.value) return
  playCurrentClip()
})

// Đổi video được xử lý trong `setupPlayer` (gọi sau mỗi lần parse), nên không
// cần watch `currentYoutubeId` — nếu có sẽ cue trùng hai lần.

// ---------------------------------------------------------------- Lessons
const fetchSavedLessons = async () => {
  try {
    const res: any = await $fetch('/api/youtube/lessons', {
      params: { language: currentLanguage.value },
    })
    if (res && res.success && Array.isArray(res.lessons)) {
      const merged = [...res.lessons]

      currentSampleLessons.value.forEach((sample) => {
        if (
          !merged.some(
            (item) =>
              item.url === sample.url || item.youtubeId === sample.youtubeId,
          )
        ) {
          merged.push(sample)
        }
      })

      myLessons.value = merged
    } else {
      myLessons.value = [...currentSampleLessons.value]
    }

    if (myLessons.value.length > 0) {
      inputUrl.value = myLessons.value[0].url
      youtubeUrl.value = myLessons.value[0].url
    }
  } catch (err) {
    console.error('Không thể tải bài học từ DB:', err)
    myLessons.value = [...currentSampleLessons.value]
  }
}

const selectLesson = (lesson: any) => {
  inputUrl.value = lesson.url
  youtubeUrl.value = lesson.url
  isSaved.value = true
  parseYoutubeLink()
}

const saveToMyLessons = async () => {
  if (!inputUrl.value.trim()) return

  const firstText = clipText(clips.value[0])

  try {
    const res: any = await $fetch('/api/youtube/lessons', {
      method: 'POST',
      body: {
        url: inputUrl.value.trim(),
        title: firstText
          ? `Bài học: ${firstText.slice(0, 30)}...`
          : `Bài học YouTube (${currentYoutubeId.value})`,
        level: 'A1',
        language: currentLanguage.value,
        description: 'Bài học YouTube tự thêm vào cơ sở dữ liệu',
      },
    })

    if (res && res.success) {
      isSaved.value = true
      playSound('correct')
      triggerConfetti()
      await fetchSavedLessons()
    }
  } catch (err: any) {
    console.error('Lỗi khi lưu bài học vào DB:', err)
    errorMessage.value = err.data?.statusMessage || 'Không thể lưu bài học!'
  }
}

// ---------------------------------------------------------------- Progress (DB)
const loadProgress = async (youtubeId: string) => {
  clipStates.value = {}
  maxUnlockedIdx.value = 0

  try {
    const res: any = await $fetch('/api/youtube/progress', {
      params: { youtubeId },
    })
    const p = res?.progress
    if (!p) return

    clipStates.value = (p.clipStates as Record<string, any>) || {}
    // Giữ nguyên giá trị server. Clamp về cửa sổ đang tải sẽ khoá lại những câu
    // người dùng đã mở, và sau khi tải thêm chúng vẫn kẹt khoá.
    maxUnlockedIdx.value = Math.max(p.maxUnlockedIdx ?? 0, 0)

    // Câu đang học dở có thể nằm ngoài cửa sổ đầu tiên — tải tiếp cho tới khi
    // chứa nó, thay vì âm thầm đưa người dùng về câu 0.
    const resume = p.lastClipIdx ?? 0
    if (resume > 0 && resume < totalSegments.value) {
      while (resume >= clips.value.length && (await loadMoreClips())) {
        /* tải tới khi đủ */
      }
      if (resume < clips.value.length) currentClipIdx.value = resume
    }
  } catch (err) {
    // Chưa đăng nhập hoặc DB lỗi: vẫn luyện được, chỉ là tiến độ không lưu.
    console.warn('Không tải được tiến độ luyện nghe:', err)
  }
}

const persistClipAttempt = async (score: number, done: boolean) => {
  const idx = currentClipIdx.value
  const wasDone = !!clipStates.value[String(idx)]?.done

  // Cập nhật lạc quan để UI phản hồi ngay
  const prev = clipStates.value[String(idx)] || {
    done: false,
    score: 0,
    attempts: 0,
  }
  clipStates.value = {
    ...clipStates.value,
    [String(idx)]: {
      done: prev.done || done,
      score: Math.max(prev.score || 0, score),
      attempts: (prev.attempts || 0) + 1,
    },
  }
  if (done && idx >= maxUnlockedIdx.value) {
    // Chặn theo tổng số câu của video, không theo cửa sổ đang tải — nếu không
    // mở khoá dừng ở mép cửa sổ và không gì kích hoạt việc tải thêm.
    maxUnlockedIdx.value = Math.min(
      idx + 1,
      Math.max(totalSegments.value - 1, 0),
    )
  }

  try {
    const res: any = await $fetch('/api/youtube/progress', {
      method: 'POST',
      body: {
        youtubeId: currentYoutubeId.value,
        language: currentLanguage.value,
        clipIdx: idx,
        score,
        done,
        // Tổng số câu thật của video, không phải kích thước cửa sổ đang tải.
        totalClips: totalSegments.value || clips.value.length,
      },
    })

    const p = res?.progress
    if (p) {
      clipStates.value =
        (p.clipStates as Record<string, any>) || clipStates.value
      maxUnlockedIdx.value = Math.max(p.maxUnlockedIdx ?? 0, 0)
    }

    // Chỉ cộng XP lần đầu hoàn thành đoạn này
    if (res?.firstCompletion && !wasDone) {
      await $fetch('/api/daily/progress', {
        method: 'POST',
        body: {
          xpDelta: hintLevel.value >= 3 ? 15 : 30,
          questProgress: { dictation: p?.clipsDone ?? 1 },
          pathCompleted: { shadowing: true },
        },
      }).catch(() => {})
    }
  } catch (err) {
    console.warn('Không lưu được tiến độ luyện nghe:', err)
  }
}

// ---------------------------------------------------------------- Parse
const langName = (code: string) => (code === 'cs' ? 'tiếng Séc' : 'tiếng Đức')

const hasMoreClips = computed(
  () => totalSegments.value > clips.value.length,
)

/**
 * Tải tiếp cửa sổ câu kế tiếp và nối vào `clips`. Chỉ nối liên tiếp, đúng thứ tự —
 * nhờ vậy chỉ số mảng vẫn trùng chỉ số segment toàn cục, tức trùng khoá trong
 * `clipStates`. Tải cửa sổ không liền mạch sẽ làm lệch toàn bộ tiến độ.
 */
const loadMoreClips = async (): Promise<boolean> => {
  if (isLoadingMore.value || !hasMoreClips.value) return false
  if (!youtubeUrl.value.trim()) return false

  isLoadingMore.value = true
  try {
    const res: any = await $fetch('/api/youtube/parse', {
      query: {
        url: youtubeUrl.value.trim(),
        language: currentLanguage.value,
        offset: clips.value.length,
      },
    })

    if (res?.success && Array.isArray(res.clips) && res.clips.length > 0) {
      // Chốt chặn: chỉ nối khi server trả đúng cửa sổ mình xin.
      if (res.offset !== clips.value.length) return false
      clips.value = [...clips.value, ...res.clips]
      totalSegments.value = res.totalSegments || totalSegments.value
      return true
    }
    return false
  } catch (err) {
    console.warn('Không tải thêm được câu:', err)
    return false
  } finally {
    isLoadingMore.value = false
  }
}

const parseYoutubeLink = async () => {
  if (!inputUrl.value.trim()) return

  isLoadingParse.value = true
  errorMessage.value = ''
  languageNotice.value = ''
  youtubeUrl.value = inputUrl.value

  try {
    const res: any = await $fetch('/api/youtube/parse', {
      query: {
        url: inputUrl.value.trim(),
        language: currentLanguage.value,
      },
    })

    if (res && res.success && res.clips && res.clips.length > 0) {
      clips.value = res.clips
      totalSegments.value = res.totalSegments || res.clips.length
      clipOffset.value = res.offset || 0
      currentClipIdx.value = 0
      resetClipUi()
      languageNotice.value = res.languageFallback
        ? `Video này không có phụ đề ${langName(res.requestedLanguage)} — đang dùng phụ đề ${langName(res.language)}.`
        : ''
      await loadProgress(res.youtubeId)
      pendingPlayerVideoId.value = res.youtubeId
    } else {
      errorMessage.value = 'Không tìm thấy phụ đề cho video này!'
    }
  } catch (err: any) {
    console.error('Lỗi khi bóc tách phụ đề:', err)
    errorMessage.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      err?.message ||
      'Không thể bóc tách phụ đề từ URL YouTube này!'
  } finally {
    // Phải tắt loading TRƯỚC khi mount player: thẻ div của player nằm trong
    // nhánh `v-else-if`, nên nếu còn loading thì element chưa tồn tại và
    // `mountPlayer` sẽ chờ vô hạn.
    isLoadingParse.value = false
    await setupPlayer()
  }
}

/**
 * Mount/cue player sau khi workspace đã render. Lỗi ở đây (chặn script, offline)
 * không được làm sập trang — người dùng vẫn đọc được danh sách câu.
 */
const setupPlayer = async () => {
  const videoId = pendingPlayerVideoId.value
  if (!videoId) return
  pendingPlayerVideoId.value = ''
  playerError.value = false

  try {
    await nextTick()
    await mountPlayer(videoId, currentClip.value?.start || 0)
    hasStarted.value = false
  } catch (err) {
    console.warn('Không tải được trình phát YouTube:', err)
    playerError.value = true
  }
}

watch(currentLanguage, () => {
  fetchSavedLessons().then(() => parseYoutubeLink())
})

onMounted(() => {
  fetchSavedLessons().then(() => parseYoutubeLink())
})

// ---------------------------------------------------------------- Grading
const checkDictation = async () => {
  const expected = clipText(currentClip.value)
  if (!expected || !userSentence.value.trim()) return

  report.value = buildShadowingReport(
    userSentence.value,
    expected,
    currentLanguage.value,
  )
  isChecked.value = true
  isCorrect.value = isPass(report.value.score)

  if (isCorrect.value) {
    playSound('correct')
    triggerConfetti()
  } else {
    playSound('wrong')
  }

  // Từ chép sai đi vào hàng luyện phát âm, giống Shadowing Lab. Trước đây
  // `report.drillItems` được tính ra rồi bỏ đi.
  if (report.value.drillItems.length && report.value.score < SCORE_EXCELLENT) {
    addFailures(report.value.drillItems, currentLanguage.value)
  }

  await persistClipAttempt(report.value.score, isCorrect.value)
}

const chipClass = (kind: DiffKind) => {
  const base =
    'px-2 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1'
  switch (kind) {
    case 'match':
      return `${base} bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60`
    case 'wrong':
      return `${base} bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60`
    case 'missing':
      return `${base} bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60 underline decoration-dotted`
    default:
      return `${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through`
  }
}

// ---------------------------------------------------------------- Hints
const revealHint = () => {
  hintLevel.value = Math.min(4, hintLevel.value + 1)
}

const hintText = computed(() => {
  const clip = currentClip.value
  if (!clip) return ''
  const words = clipText(clip).split(/\s+/).filter(Boolean)

  switch (hintLevel.value) {
    case 1:
      return `${words.length} từ, khoảng ${Math.round(clip.duration || 0)} giây`
    case 2:
      return words
        .map((w) => w[0] + '·'.repeat(Math.max(0, w.length - 1)))
        .join(' ')
    case 3:
      return clip.hint || ''
    case 4:
      return clipText(clip)
    default:
      return ''
  }
})

const hintLabel = computed(() => {
  switch (hintLevel.value) {
    case 0:
      return 'Gợi ý'
    case 1:
      return 'Gợi ý thêm (chữ đầu)'
    case 2:
      return 'Gợi ý thêm (che chữ)'
    case 3:
      return 'Xem đáp án'
    default:
      return 'Đã hiện đáp án'
  }
})

// ---------------------------------------------------------------- Navigation
const isClipUnlocked = (index: number) => index <= maxUnlockedIdx.value

const selectClip = (index: number) => {
  if (!isClipUnlocked(index)) return
  currentClipIdx.value = index
  resetClipUi()
}

const nextClip = async () => {
  // Ở mép cửa sổ nhưng video còn câu: tải tiếp rồi mới đi tiếp.
  if (currentClipIdx.value >= clips.value.length - 1) {
    if (!hasMoreClips.value) return
    const ok = await loadMoreClips()
    if (!ok) return
  }
  currentClipIdx.value++
  if (currentClipIdx.value > maxUnlockedIdx.value) {
    maxUnlockedIdx.value = currentClipIdx.value
  }
  resetClipUi()
}

/** Câu cuối của cả video, không phải câu cuối của cửa sổ đang tải. */
const isLastClip = computed(
  () => currentClipIdx.value >= totalSegments.value - 1,
)
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div
        class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 text-left"
      >
        <!-- Page Header -->
        <div
          class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6"
        >
          <div class="space-y-2">
            <span
              class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider"
            >
              Audio Dictation & Listening Lab
            </span>
            <h1
              class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              YouTube Dictation Lab
            </h1>
            <p
              class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed"
            >
              Luyện nghe nâng cao qua video thực tế, chia từng câu ngắn & chép
              chính tả chuẩn xác.
            </p>
          </div>
        </div>

        <!-- Header Bar with Parser & Saved Lessons -->
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div
            v-if="errorMessage"
            class="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs text-red-600 font-bold"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="lucide:alert-circle"
                class="w-4 h-4 text-red-500 shrink-0"
              />
              <span>{{ errorMessage }}</span>
            </div>
            <button
              class="text-red-400 hover:text-red-600 p-1 cursor-pointer"
              @click="errorMessage = ''"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Phụ đề khác ngôn ngữ đang học: cảnh báo, không phải lỗi -->
          <div
            v-if="languageNotice"
            class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="lucide:languages"
                class="w-4 h-4 text-amber-500 shrink-0"
              />
              <span>{{ languageNotice }}</span>
            </div>
            <button
              class="text-amber-400 hover:text-amber-600 p-1 cursor-pointer"
              @click="languageNotice = ''"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <div
            class="flex flex-col md:flex-row items-stretch md:items-center gap-3"
          >
            <div class="relative flex-1">
              <Icon
                name="lucide:link"
                class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                v-model="inputUrl"
                type="text"
                placeholder="Dán đường dẫn YouTube tiếng Đức/Séc bất kỳ vào đây..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-primary-500 transition-all"
                @keyup.enter="parseYoutubeLink"
              />
            </div>
            <button
              :disabled="isLoadingParse"
              class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              @click="parseYoutubeLink"
            >
              <Icon
                v-if="isLoadingParse"
                name="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              <Icon v-else name="lucide:wand-2" class="w-4 h-4" />
              <span>Tạo Bài Tập</span>
            </button>
            <button
              class="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 border border-emerald-200 dark:border-emerald-900/60 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              @click="saveToMyLessons"
            >
              <Icon
                :name="isSaved ? 'lucide:circle-check' : 'lucide:bookmark-plus'"
                class="w-4 h-4"
              />
              <span>{{ isSaved ? 'Đã Lưu Bài Học' : 'Lưu Vào Bài Học' }}</span>
            </button>
          </div>

          <!-- Preset Lessons Catalogue -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-3">
              <span
                class="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Icon name="lucide:library" class="w-4 h-4 text-primary-500" />
                <span>Thư Viện Bài Học Mẫu (My Lessons):</span>
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div
                v-for="item in myLessons"
                :key="item.id"
                class="group bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                :class="
                  youtubeUrl === item.url
                    ? 'ring-2 ring-primary-500 border-primary-500'
                    : ''
                "
                @click="selectLesson(item)"
              >
                <div
                  class="relative aspect-video w-full overflow-hidden bg-slate-900"
                >
                  <img
                    :src="item.thumbnail"
                    :alt="item.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    class="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white font-black text-[9px] rounded uppercase"
                  >
                    {{ item.level }}
                  </span>
                </div>
                <div class="p-2 space-y-0.5">
                  <h4
                    class="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary-500 transition-colors"
                  >
                    {{ item.title }}
                  </h4>
                  <p class="text-[10px] text-slate-400 line-clamp-1">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Interactive Dictation Workspace Grid -->
        <div
          v-if="isLoadingParse"
          class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
        >
          <Icon
            name="lucide:loader-2"
            class="w-8 h-8 animate-spin text-primary-500 mx-auto"
          />
          <p class="text-xs font-bold text-slate-600 dark:text-slate-300">
            Đang bóc tách & chia câu từ phụ đề YouTube...
          </p>
        </div>

        <div
          v-else-if="currentClip && currentClip.id"
          class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <!-- LEFT: Player -->
          <div class="lg:col-span-5 space-y-4">
            <div
              class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div
                class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <Icon
                    name="lucide:video"
                    class="w-4 h-4 text-primary-500 shrink-0"
                  />
                  <h3
                    class="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate"
                  >
                    Câu {{ currentClipIdx + 1 }}/{{
                      totalSegments || clips.length
                    }}
                  </h3>
                </div>
                <!-- Thời lượng đoạn: số thật từ phụ đề. Trước đây chỗ này là
                     badge "A1 LEVEL" cứng vì clip không hề có trường `level`. -->
                <span
                  v-if="currentClip.duration"
                  class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-xs rounded-lg shrink-0"
                >
                  {{ Math.round(currentClip.duration) }} giây
                </span>
              </div>

              <!-- YT IFrame API player: div này bị API thay bằng iframe -->
              <div
                class="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black border border-slate-200/80 dark:border-slate-800"
              >
                <div :id="PLAYER_ELEMENT_ID" class="w-full h-full"></div>

                <!-- Overlay bắt đầu: Chrome cần một cú click thật trước khi play qua API -->
                <div
                  v-if="!hasStarted"
                  class="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-3 z-20"
                >
                  <button
                    :disabled="!isPlayerReady"
                    class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    @click="startListening"
                  >
                    <Icon
                      :name="isPlayerReady ? 'lucide:play' : 'lucide:loader-2'"
                      :class="
                        isPlayerReady ? 'w-4 h-4' : 'w-4 h-4 animate-spin'
                      "
                    />
                    <span>{{
                      isPlayerReady
                        ? 'Bắt Đầu Luyện Nghe'
                        : 'Đang tải trình phát...'
                    }}</span>
                  </button>
                  <p
                    v-if="playerError"
                    class="text-[10px] text-amber-400 px-6 text-center"
                  >
                    Không tải được trình phát YouTube (có thể do chặn quảng cáo
                    hoặc mất mạng). Bạn vẫn có thể xem danh sách câu và chép
                    chính tả.
                  </p>
                  <p v-else class="text-[10px] text-slate-400">
                    Trình duyệt yêu cầu một lần bấm trước khi phát tiếng
                  </p>
                </div>

                <!-- Màn che phụ đề gốc của video -->
                <div
                  v-else-if="!showSubtitle"
                  class="absolute bottom-0 left-0 right-0 h-28 bg-slate-950 flex items-center justify-center pointer-events-none z-10 border-t border-slate-800 transition-all duration-300"
                >
                  <span
                    class="text-xs font-extrabold text-slate-200 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-md flex items-center gap-1.5"
                  >
                    <Icon
                      name="lucide:eye-off"
                      class="w-3.5 h-3.5 text-amber-400"
                    />
                    <span>Phụ đề đã ẩn để luyện chép chính tả</span>
                  </span>
                </div>
              </div>

              <!-- Playback controls -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <button
                  class="px-3 py-1.5 bg-primary-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:bg-primary-600 shadow-xs"
                  @click="replayCurrentClip"
                >
                  <Icon
                    :name="isPlaying ? 'lucide:rotate-ccw' : 'lucide:play'"
                    class="w-4 h-4"
                  />
                  <span>Nghe Lại Câu Này</span>
                </button>

                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-bold text-slate-400 mr-1"
                    >Tốc độ</span
                  >
                  <button
                    v-for="rate in RATES"
                    :key="rate"
                    class="px-2 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer border"
                    :class="
                      playbackRate === rate
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
                    "
                    @click="setRate(rate)"
                  >
                    {{ rate }}×
                  </button>
                </div>
              </div>

              <!-- Subtitle Toggle Bar -->
              <div
                class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <Icon
                    name="lucide:subtitles"
                    class="w-4 h-4 text-primary-500"
                  />
                  <span
                    class="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >Phụ đề trên video:</span
                  >
                </div>
                <button
                  v-if="isChecked"
                  class="px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer bg-primary-500 text-white hover:bg-primary-600 shadow-xs"
                  @click="showSubtitle = !showSubtitle"
                >
                  <Icon
                    :name="showSubtitle ? 'lucide:eye-off' : 'lucide:eye'"
                    class="w-3.5 h-3.5"
                  />
                  <span>{{ showSubtitle ? 'Ẩn Phụ Đề' : 'Hiện Phụ Đề' }}</span>
                </button>
                <span
                  v-else
                  class="text-[11px] font-bold text-slate-400 italic flex items-center gap-1"
                >
                  <Icon name="lucide:lock" class="w-3 h-3" />
                  <span>Cần kiểm tra đáp án trước</span>
                </span>
              </div>
            </div>
          </div>

          <!-- MIDDLE: Dictation input & feedback -->
          <div class="lg:col-span-4 space-y-4">
            <div
              class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5"
            >
              <div>
                <h4
                  class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <Icon
                    name="lucide:pen-tool"
                    class="w-4 h-4 text-primary-500"
                  />
                  <span>Chép Chính Tả</span>
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lắng nghe kỹ câu thoại và gõ lại chính xác bên dưới:
                </p>
              </div>

              <textarea
                v-model="userSentence"
                :disabled="isChecked"
                rows="4"
                placeholder="Gõ câu nghe được vào đây..."
                class="w-full p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-primary-500 transition-all resize-none"
              ></textarea>

              <!-- Hints -->
              <div class="space-y-2">
                <button
                  :disabled="hintLevel >= 4"
                  class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  @click="revealHint"
                >
                  <Icon
                    name="lucide:lightbulb"
                    class="w-4 h-4 text-amber-500"
                  />
                  <span>{{ hintLabel }}</span>
                  <span v-if="hintLevel > 0" class="text-[10px] opacity-60"
                    >({{ hintLevel }}/4)</span
                  >
                </button>

                <div
                  v-if="hintText"
                  class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 break-words"
                >
                  💡 {{ hintText }}
                </div>
              </div>

              <!-- Word-level feedback -->
              <div
                v-if="isChecked && report"
                class="p-4 rounded-xl space-y-3 border transition-all"
                :class="
                  isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                "
              >
                <div
                  class="flex items-center justify-between font-extrabold text-xs"
                  :class="isCorrect ? 'text-primary-500' : 'text-red-600'"
                >
                  <span class="flex items-center gap-1.5">
                    <Icon
                      :name="
                        isCorrect ? 'lucide:circle-check' : 'lucide:x-circle'
                      "
                      class="w-4 h-4"
                    />
                    <span>{{
                      isCorrect
                        ? `Đạt! ${report.score}đ`
                        : `Chưa đạt — ${report.score}đ`
                    }}</span>
                  </span>
                  <span class="text-[10px] opacity-70 uppercase">{{
                    report.level
                  }}</span>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(t, i) in report.tokens"
                    :key="i"
                    :class="chipClass(t.kind)"
                  >
                    <span>{{
                      t.kind === 'extra' ? t.spoken : t.expected
                    }}</span>
                    <span
                      v-if="t.kind === 'wrong' && t.spoken"
                      class="opacity-60 line-through"
                      >{{ t.spoken }}</span
                    >
                  </span>
                </div>

                <div
                  class="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-current/10"
                >
                  <span class="flex items-center gap-1"
                    ><span class="w-2 h-2 rounded-full bg-emerald-400"></span
                    >đúng</span
                  >
                  <span class="flex items-center gap-1"
                    ><span class="w-2 h-2 rounded-full bg-amber-400"></span
                    >sai</span
                  >
                  <span class="flex items-center gap-1"
                    ><span class="w-2 h-2 rounded-full bg-red-400"></span
                    >thiếu</span
                  >
                  <span class="flex items-center gap-1"
                    ><span class="w-2 h-2 rounded-full bg-slate-400"></span
                    >thừa</span
                  >
                </div>

                <div
                  class="text-xs pt-2 border-t border-current/10 space-y-0.5 text-slate-700 dark:text-slate-200"
                >
                  <p>
                    <span class="font-extrabold opacity-75">Đáp án:</span> "{{
                      clipText(currentClip)
                    }}"
                  </p>
                </div>

                <div
                  v-if="report.tips.length"
                  class="pt-2 border-t border-current/10"
                >
                  <button
                    class="text-[11px] font-extrabold text-primary-500 flex items-center gap-1 cursor-pointer"
                    @click="showTips = !showTips"
                  >
                    <Icon
                      :name="
                        showTips
                          ? 'lucide:chevron-down'
                          : 'lucide:chevron-right'
                      "
                      class="w-3.5 h-3.5"
                    />
                    <span>Mẹo phát âm ({{ report.tips.length }})</span>
                  </button>
                  <ul v-if="showTips" class="mt-2 space-y-1.5">
                    <li
                      v-for="tip in report.tips"
                      :key="tip.id"
                      class="text-[11px] text-slate-600 dark:text-slate-300"
                    >
                      <span class="font-extrabold">{{ tip.title }}:</span>
                      {{ tip.detail }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="pt-2">
                <button
                  v-if="!isChecked"
                  :disabled="!userSentence.trim()"
                  class="w-full bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-extrabold rounded-xl py-3 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  @click="checkDictation"
                >
                  <Icon name="lucide:check-circle" class="w-5 h-5" />
                  <span>Kiểm Tra Đáp Án</span>
                </button>
                <div v-else class="space-y-2">
                  <button
                    v-if="!isLastClip"
                    class="w-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold rounded-xl py-3 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    @click="nextClip"
                  >
                    <span>Câu Tiếp Theo</span>
                    <Icon name="lucide:arrow-right" class="w-5 h-5" />
                  </button>
                  <p
                    v-else
                    class="text-center text-xs font-extrabold text-primary-500 py-3"
                  >
                    🎉 Bạn đã hoàn thành câu cuối của video này!
                  </p>
                  <button
                    class="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl py-2.5 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
                    @click="resetClipUi"
                  >
                    <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
                    <span>Làm Lại Câu Này</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Clip list -->
          <div class="lg:col-span-3">
            <LessonDictationClipList
              :clips="clips"
              :current-idx="currentClipIdx"
              :max-unlocked-idx="maxUnlockedIdx"
              :clip-states="clipStates"
              :total-segments="totalSegments"
              :is-loading-more="isLoadingMore"
              @select="selectClip"
              @load-more="loadMoreClips"
            />
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
