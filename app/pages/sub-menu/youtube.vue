<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLanguage } from '~/composables/use-language'

definePageMeta({ layout: 'page' })
useHead({ title: 'YouTube Dictation Lab - Sprech Mit Uns' })

const { playSound, triggerConfetti } = useGamification()
const { currentLanguage } = useLanguage()

// Starter sample lessons for German & Czech
const sampleLessonsDe = [
  {
    id: 'lesson-de-1',
    title: 'Easy German - Lời chào & Giao tiếp đường phố',
    youtubeId: '4-eDoThe6qo',
    url: 'https://www.youtube.com/watch?v=4-eDoThe6qo',
    level: 'A1',
    language: 'de',
    thumbnail: 'https://img.youtube.com/vi/4-eDoThe6qo/mqdefault.jpg',
    description: 'Bài học giao tiếp căn bản nhất dành cho người bắt đầu học tiếng Đức.'
  }
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
    description: 'Bài học tiếng Séc cơ bản giao tiếp tự nhiên dành cho người Việt.'
  }
]

const currentSampleLessons = computed(() => {
  return currentLanguage.value === 'cs' ? sampleLessonsCs : sampleLessonsDe
})

const myLessons = ref<any[]>([])

const clips = ref<any[]>([])
const currentClipIdx = ref(0)
const youtubeUrl = ref('')
const isLoading = ref(false)

const currentYoutubeId = computed(() => {
  if (currentClip.value?.youtubeId) return currentClip.value.youtubeId
  const match = youtubeUrl.value.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return match && match[1] ? match[1] : (currentLanguage.value === 'cs' ? '9-4SJ_1Ypv0' : '4-eDoThe6qo')
})
const isSaved = ref(false)

// Fetch user saved lessons from Database
const fetchSavedLessons = async () => {
  try {
    const res: any = await $fetch('/api/youtube/lessons', {
      params: { language: currentLanguage.value }
    })
    if (res && res.success && Array.isArray(res.lessons)) {
      const dbLessons = res.lessons
      const merged = [...dbLessons]

      currentSampleLessons.value.forEach(sample => {
        if (!merged.some(item => item.url === sample.url || item.youtubeId === sample.youtubeId)) {
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

watch(currentLanguage, () => {
  fetchSavedLessons().then(() => {
    parseYoutubeLink()
  })
})

const selectLesson = (lesson: any) => {
  inputUrl.value = lesson.url
  youtubeUrl.value = lesson.url
  isSaved.value = true
  parseYoutubeLink()
}

const saveToMyLessons = async () => {
  if (!inputUrl.value.trim()) return

  try {
    const res: any = await $fetch('/api/youtube/lessons', {
      method: 'POST',
      body: {
        url: inputUrl.value.trim(),
        title: clips.value[0]?.germanText ? `Bài học: ${clips.value[0].germanText.slice(0, 30)}...` : `Bài học YouTube (${currentYoutubeId.value})`,
        level: 'A1',
        language: currentLanguage.value,
        description: 'Bài học YouTube tự thêm vào cơ sở dữ liệu'
      }
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

onMounted(() => {
  fetchSavedLessons().then(() => {
    parseYoutubeLink()
  })
})

const inputUrl = ref('')
const isLoadingParse = ref(false)
const errorMessage = ref('')

const currentClip = computed(() => clips.value[currentClipIdx.value] || clips.value[0])
const userSentence = ref('')
const isChecked = ref(false)
const isCorrect = ref(false)
const showHint = ref(false)
const isSlow = ref(false)

// History & Stats
const completedCount = ref(0)
const streakCount = ref(1)

// Dynamic YouTube URL Parser API call
const parseYoutubeLink = async () => {
  if (!inputUrl.value.trim()) return

  isLoadingParse.value = true
  errorMessage.value = ''
  youtubeUrl.value = inputUrl.value

  try {
    const res: any = await $fetch('/api/youtube/parse', {
      query: {
        url: inputUrl.value.trim(),
        language: currentLanguage.value
      }
    })

    if (res && res.success && res.clips && res.clips.length > 0) {
      clips.value = res.clips
      currentClipIdx.value = 0
      maxUnlockedIdx.value = 0
      userSentence.value = ''
      isChecked.value = false
      isCorrect.value = false
      showHint.value = false
      showSubtitle.value = false
    } else {
      errorMessage.value = 'Không tìm thấy phụ đề tiếng Đức cho video này!'
    }
  } catch (err: any) {
    console.error('Lỗi khi bóc tách phụ đề:', err)
    errorMessage.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Không thể bóc tách phụ đề từ URL YouTube này!'
  } finally {
    isLoadingParse.value = false
  }
}

let pauseTimer: any = null

const startAutoPauseTimer = (clip: any) => {
  if (pauseTimer) clearTimeout(pauseTimer)
  if (!clip) return

  const durationMs = Math.round(((clip.end || clip.start + 4) - clip.start) * 1000) + 300

  if (process.client) {
    pauseTimer = setTimeout(() => {
      if (typeof document === 'undefined') return
      const iframe = document.getElementById('youtube-dictation-iframe') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
      }
    }, durationMs)
  }
}

watch(currentClip, (newClip: any) => {
  if (!newClip) return
  if (pauseTimer) clearTimeout(pauseTimer)

  if (process.client) {
    setTimeout(() => {
      const iframe = document.getElementById('youtube-dictation-iframe') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${newClip.start || 0}, true]}`, '*')
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
        startAutoPauseTimer(newClip)
      }
    }, 150)
  }
}, { immediate: true })

const replayCurrentClip = () => {
  if (typeof document === 'undefined') return
  const iframe = document.getElementById('youtube-dictation-iframe') as HTMLIFrameElement
  const startTime = currentClip.value?.start || 0

  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${startTime}, true]}`, '*')
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    startAutoPauseTimer(currentClip.value)
  }
}

const showSubtitle = ref(false)

const cleanStr = (str: string) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'„“]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim()
}

const getSimilarity = (a: string, b: string) => {
  if (!a || !b) return 0
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const distance = matrix[a.length][b.length]
  const maxLength = Math.max(a.length, b.length)
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
}

const checkDictation = () => {
  if (!currentClip.value) return

  const target = cleanStr(currentClip.value.germanText || currentClip.value.targetSentence || '')
  const input = cleanStr(userSentence.value || '')

  if (!input) return

  const similarity = getSimilarity(target, input)
  isChecked.value = true

  if (similarity >= 0.8 || target === input) {
    isCorrect.value = true
    playSound('correct')
    triggerConfetti()

    if (currentClipIdx.value >= maxUnlockedIdx.value) {
      maxUnlockedIdx.value = currentClipIdx.value + 1
    }
  } else {
    isCorrect.value = false
    playSound('wrong')
  }
}

const maxUnlockedIdx = ref(0)

const isClipUnlocked = (index: number) => {
  return index <= maxUnlockedIdx.value
}

const selectClip = (index: number) => {
  if (isClipUnlocked(index)) {
    currentClipIdx.value = index
    userSentence.value = ''
    isChecked.value = false
    isCorrect.value = false
    showHint.value = false
    showSubtitle.value = false
  }
}

const nextClip = () => {
  if (currentClipIdx.value < clips.value.length - 1) {
    currentClipIdx.value++
    if (currentClipIdx.value > maxUnlockedIdx.value) {
      maxUnlockedIdx.value = currentClipIdx.value
    }
    userSentence.value = ''
    isChecked.value = false
    isCorrect.value = false
    showHint.value = false
    showSubtitle.value = false
  }
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 text-left">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              Audio Dictation & Listening Lab
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              YouTube Dictation Lab
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              Luyện nghe nâng cao qua video thực tế, phân tích từ vựng key & chép chính tả chuẩn xác.
            </p>
          </div>
        </div>

        <!-- Header Bar with Parser & Saved Lessons -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs text-red-600 font-bold">
            <div class="flex items-center gap-2">
              <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-500 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
            <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600 p-1 cursor-pointer">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div class="relative flex-1">
              <Icon name="lucide:link" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="inputUrl"
                type="text"
                placeholder="Dán đường dẫn YouTube tiếng Đức/Séc bất kỳ vào đây..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-primary-500 transition-all"
                @keyup.enter="parseYoutubeLink"
              />
            </div>
            <button
              @click="parseYoutubeLink"
              :disabled="isLoadingParse"
              class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Icon v-if="isLoadingParse" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:wand-2" class="w-4 h-4" />
              <span>Tạo Bài Tập</span>
            </button>
            <button
              @click="saveToMyLessons"
              class="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 border border-emerald-200 dark:border-emerald-900/60 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Icon :name="isSaved ? 'lucide:circle-check' : 'lucide:bookmark-plus'" class="w-4 h-4" />
              <span>{{ isSaved ? 'Đã Lưu Bài Học' : 'Lưu Vào Bài Học' }}</span>
            </button>
          </div>

          <!-- Preset Lessons Catalogue -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Icon name="lucide:library" class="w-4 h-4 text-primary-500" />
                <span>Thư Viện Bài Học Mẫu (My Lessons):</span>
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div
                v-for="item in myLessons"
                :key="item.id"
                @click="selectLesson(item)"
                class="group bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                :class="youtubeUrl === item.url ? 'ring-2 ring-primary-500 border-primary-500' : ''"
              >
                <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img :src="item.thumbnail" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span class="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white font-black text-[9px] rounded uppercase">
                    {{ item.level }}
                  </span>
                </div>
                <div class="p-2 space-y-0.5">
                  <h4 class="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary-500 transition-colors">
                    {{ item.title }}
                  </h4>
                  <p class="text-[10px] text-slate-400 line-clamp-1">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Interactive Dictation Workspace Grid -->
        <div v-if="isLoading" class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p class="text-xs font-bold text-slate-600 dark:text-slate-300">Đang bóc tách phụ đề từ YouTube...</p>
        </div>

        <div v-else-if="currentClip && currentClip.id" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Column (7 cols): YouTube Video Player & Clip Controls -->
          <div class="lg:col-span-7 space-y-4">
            <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:video" class="w-4 h-4 text-primary-500" />
                  <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate max-w-md">
                    {{ currentClip.title }}
                  </h3>
                </div>
                <span class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-xs rounded-lg uppercase shrink-0">
                  {{ currentClip.level || 'A1' }} LEVEL
                </span>
              </div>

              <!-- Embed Player -->
              <div class="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black border border-slate-200/80 dark:border-slate-800">
                <iframe
                  id="youtube-dictation-iframe"
                  :key="currentYoutubeId"
                  class="w-full h-full"
                  :src="`https://www.youtube.com/embed/${currentYoutubeId}?start=${currentClip?.start || 0}&enablejsapi=1&autoplay=1&controls=0&modestbranding=1&disablekb=1&fs=0`"
                  title="YouTube Dictation Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>

                <div
                  v-if="!showSubtitle"
                  class="absolute bottom-0 left-0 right-0 h-28 bg-slate-950 flex items-center justify-center pointer-events-none z-10 border-t border-slate-800 transition-all duration-300"
                >
                  <span class="text-xs font-extrabold text-slate-200 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-md flex items-center gap-1.5">
                    <Icon name="lucide:eye-off" class="w-3.5 h-3.5 text-amber-400" />
                    <span>Phụ đề đã ẩn để luyện chép chính tả</span>
                  </span>
                </div>
              </div>

              <!-- Subtitle Toggle Bar -->
              <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:subtitles" class="w-4 h-4 text-primary-500" />
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Hiển thị phụ đề trên Video:</span>
                </div>
                <button
                  v-if="isChecked"
                  @click="showSubtitle = !showSubtitle"
                  class="px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer bg-primary-500 text-white hover:bg-primary-600 shadow-xs"
                >
                  <Icon :name="showSubtitle ? 'lucide:eye-off' : 'lucide:eye'" class="w-3.5 h-3.5" />
                  <span>{{ showSubtitle ? 'Ẩn Phụ Đề' : 'Hiện Phụ Đề' }}</span>
                </button>
                <span v-else class="text-[11px] font-bold text-slate-400 italic flex items-center gap-1">
                  <Icon name="lucide:lock" class="w-3 h-3" />
                  <span>Cần kiểm tra đáp án trước</span>
                </span>
              </div>

              <!-- Controls Toolbar -->
              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-2">
                  <button
                    @click="replayCurrentClip"
                    class="px-3 py-1.5 bg-primary-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:bg-primary-600 shadow-xs"
                  >
                    <Icon name="lucide:play" class="w-4 h-4" />
                    <span>Nghe Lại Câu Này</span>
                  </button>
                  <button
                    @click="showHint = !showHint"
                    class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Icon name="lucide:lightbulb" class="w-4 h-4 text-amber-500" />
                    <span>Gợi ý</span>
                  </button>
                </div>
              </div>

              <div v-if="showHint" class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                💡 {{ currentClip.hint }}
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Dictation Input & Feedback -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h4 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="lucide:pen-tool" class="w-4 h-4 text-primary-500" />
                  <span>Chép Chính Tả</span>
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lắng nghe kỹ câu thoại trong video và gõ lại chính xác bên dưới:
                </p>
              </div>

              <div>
                <textarea
                  v-model="userSentence"
                  :disabled="isChecked"
                  rows="4"
                  placeholder="Gõ câu nghe được vào đây..."
                  class="w-full p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-primary-500 transition-all resize-none"
                ></textarea>
              </div>

              <!-- Feedback Box -->
              <div v-if="isChecked" class="p-4 rounded-xl space-y-2 border transition-all" :class="isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-primary-500' : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-600'">
                <div class="flex items-center justify-between font-extrabold text-xs">
                  <span class="flex items-center gap-1.5">
                    <Icon :name="isCorrect ? 'lucide:circle-check' : 'lucide:x-circle'" class="w-4 h-4" />
                    <span>{{ isCorrect ? 'Chính xác 100%! +30 XP' : 'Chưa chính xác, xem đáp án:' }}</span>
                  </span>
                </div>
                <div class="text-xs pt-1 border-t border-current/10 space-y-0.5">
                  <p><span class="font-extrabold opacity-75">Đáp án:</span> "{{ currentClip.germanText || currentClip.targetSentence }}"</p>
                  <p v-if="currentClip.englishTranslation"><span class="font-extrabold opacity-75">Dịch:</span> {{ currentClip.englishTranslation }}</p>
                </div>
              </div>

              <div class="pt-2">
                <button
                  v-if="!isChecked"
                  @click="checkDictation"
                  :disabled="!userSentence.trim()"
                  class="w-full bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-extrabold rounded-xl py-3 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Icon name="lucide:check-circle" class="w-5 h-5" />
                  <span>Kiểm Tra Đáp Án</span>
                </button>
                <button
                  v-else
                  @click="nextClip"
                  class="w-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold rounded-xl py-3 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Video Tiếp Theo</span>
                  <Icon name="lucide:arrow-right" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
