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
const activeTab = ref<'featured' | 'my-lessons'>('featured')

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

const fetchYoutubeClips = async () => {
  if (!youtubeUrl.value.trim()) return
  isLoading.value = true
  try {
    const data = await $fetch<any>('/api/youtube/parse', {
      params: { url: youtubeUrl.value.trim() }
    })
    if (data && data.clips && data.clips.length > 0) {
      clips.value = data.clips
      currentClipIdx.value = 0
      maxUnlockedIdx.value = 0
      userSentence.value = ''
      isChecked.value = false
      isCorrect.value = false
      showHint.value = false
      showSubtitle.value = false
    }
  } catch (err) {
    console.error('Failed to parse YouTube transcript:', err)
  } finally {
    isLoading.value = false
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
    errorMessage.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Không thể bóc tách phụ đề từ URL YouTube này! Hãy đảm bảo video có bật phụ đề (CC).'
  } finally {
    isLoadingParse.value = false
  }
}

// Auto-pause timer dynamically aligned with Subtitle End Timestamp
let pauseTimer: any = null

const startAutoPauseTimer = (clip: any) => {
  if (pauseTimer) clearTimeout(pauseTimer)
  if (!clip) return

  // End - Start timestamp duration in milliseconds (+ 300ms network buffer)
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
        // Start pause timer dynamically synced right when seekTo begins
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

    // Unlock next clip if locked
    if (currentClipIdx.value >= maxUnlockedIdx.value) {
      maxUnlockedIdx.value = currentClipIdx.value + 1
    }
  } else {
    isCorrect.value = false
    playSound('wrong')
  }
}

// Progression lock state (Track unlocked clips index)
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
  <LayoutPageWrapper>
    <!-- Standard Header -->
    <LayoutPageHeader>
      <LayoutPageTitle text="YouTube Dictation Lab" />
      <p class="text-slate-500 dark:text-slate-400 text-base">
        Luyện nghe nâng cao qua video thực tế, phân tích từ vựng key & chép chính tả chuẩn xác.
      </p>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="space-y-6">

        <!-- HEADER BAR WITH YOUTUBE PARSER INPUT & SAVE TO MY LESSONS -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <!-- ERROR MESSAGE BANNER ALERT -->
        <div v-if="errorMessage" class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-bold transition-all">
          <div class="flex items-center gap-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>
          <button @click="errorMessage = ''" class="text-rose-400 hover:text-rose-600 p-1 cursor-pointer">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div class="relative flex-1">
            <Icon name="lucide:link" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="inputUrl"
              type="text"
              placeholder="Dán đường dẫn YouTube tiếng Đức bất kỳ vào đây (VD: https://www.youtube.com/watch?v=...)..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-all font-medium"
              @keyup.enter="parseYoutubeLink"
            />
          </div>
          <button
            @click="parseYoutubeLink"
            :disabled="isLoadingParse"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Icon v-if="isLoadingParse" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:wand-2" class="w-4 h-4" />
            <span>Tự Động Tạo Bài Tập</span>
          </button>
          <button
            @click="saveToMyLessons"
            class="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Icon :name="isSaved ? 'lucide:check-circle-2' : 'lucide:bookmark-plus'" class="w-4 h-4 text-emerald-500" />
            <span>{{ isSaved ? 'Đã Lưu Vào Bài Học' : 'Lưu Vào Bài Học Của Tôi' }}</span>
          </button>
        </div>

        <!-- 5 PRESET LESSONS CATALOGUE (MY LESSONS COLLECTION) -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Icon name="lucide:library" class="w-4 h-4 text-amber-500" />
              <span>Thư Viện Bài Học Mẫu (My Lessons):</span>
            </span>
            <span class="text-[11px] font-bold text-slate-400">Chọn video bên dưới để học ngay</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div
              v-for="item in myLessons"
              :key="item.id"
              @click="selectLesson(item)"
              class="group relative bg-slate-50 dark:bg-slate-900/80 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              :class="youtubeUrl === item.url ? 'ring-2 ring-primary-500 border-primary-500' : ''"
            >
              <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img :src="item.thumbnail" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span class="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 text-white font-black text-[9px] rounded uppercase">
                  {{ item.level }}
                </span>
              </div>
              <div class="p-2 space-y-1">
                <h4 class="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary-500 transition-colors">
                  {{ item.title }}
                </h4>
                <p class="text-[10px] text-slate-400 line-clamp-1">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Main Interactive Dictation Workspace Grid (2 Columns Layout) -->
        <div v-if="isLoading" class="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Đang bóc tách phụ đề từ YouTube...</p>
        </div>

        <div v-else-if="currentClip && currentClip.id" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Column (7 cols): YouTube Video Player & Clip Controls -->
          <div class="lg:col-span-7 space-y-4">
            <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <!-- Clip Header Info -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:video" class="w-4 h-4 text-primary-500" />
                  <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate max-w-md">
                    {{ currentClip.title }}
                  </h3>
                </div>
                <span class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold text-xs rounded-lg uppercase shrink-0">
                  {{ currentClip.level || 'A1' }} LEVEL
                </span>
              </div>

              <!-- Embed YouTube Player -->
              <div class="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black border border-slate-200 dark:border-slate-700">
                <iframe
                  id="youtube-dictation-iframe"
                  :key="currentYoutubeId"
                  class="w-full h-full"
                  :src="`https://www.youtube.com/embed/${currentYoutubeId}?start=${currentClip?.start || 0}&enablejsapi=1&autoplay=1&controls=0&modestbranding=1&disablekb=1&fs=0`"
                  title="YouTube Dictation Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>

                <!-- Transparent Interaction Guard Overlay -->
                <div class="absolute inset-0 bg-transparent cursor-default"></div>

                <!-- Subtitle Shield Mask (Directly Toggled by showSubtitle state on top of the video) -->
                <div
                  v-if="!showSubtitle"
                  class="absolute bottom-0 left-0 right-0 h-28 bg-slate-950 flex items-center justify-center pointer-events-none z-10 border-t border-slate-800 transition-all duration-300"
                >
                  <span class="text-xs font-extrabold text-slate-200 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-md flex items-center gap-1.5">
                    <Icon name="lucide:eye-off" class="w-3.5 h-3.5 text-amber-400" />
                    <span>Phụ đề đã được ẩn để luyện chép chính tả</span>
                  </span>
                </div>
              </div>

              <!-- Subtitle Toggle Bar (Unlocked Only After Checking Answer) -->
              <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:subtitles" class="w-4 h-4 text-primary-500" />
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Hiển thị phụ đề trên Video:</span>
                </div>
                <button
                  v-if="isChecked"
                  @click="showSubtitle = !showSubtitle"
                  class="px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  :class="showSubtitle ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'"
                >
                  <Icon :name="showSubtitle ? 'lucide:eye-off' : 'lucide:eye'" class="w-3.5 h-3.5" />
                  <span>{{ showSubtitle ? 'Ẩn Phụ Đề' : 'Hiện Phụ Đề Trực Tiếp' }}</span>
                </button>
                <span v-else class="text-[11px] font-bold text-slate-400 italic flex items-center gap-1">
                  <Icon name="lucide:lock" class="w-3 h-3" />
                  <span>Khóa (Cần kiểm tra đáp án trước)</span>
                </span>
              </div>

              <!-- Audio Controls Toolbar -->
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
                    @click="isSlow = !isSlow"
                    :class="isSlow ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'"
                    class="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Icon name="lucide:gauge" class="w-4 h-4" />
                    <span>Phát chậm (0.75x)</span>
                  </button>
                  <button
                    @click="showHint = !showHint"
                    class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Icon name="lucide:lightbulb" class="w-4 h-4 text-amber-500" />
                    <span>Gợi ý</span>
                  </button>
                </div>

                <!-- Playlist Selector (Locked Until Current Answer Checked) -->
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 overflow-x-auto max-w-[240px] py-1">
                  <button
                    v-for="(clip, index) in clips"
                    :key="clip.id"
                    @click="isClipUnlocked(index) && selectClip(index)"
                    :disabled="!isClipUnlocked(index)"
                    class="w-7 h-7 text-xs font-bold rounded-lg transition-all flex items-center justify-center shrink-0"
                    :class="[
                      currentClipIdx === index
                        ? 'bg-primary-500 text-white shadow-sm'
                        : isClipUnlocked(index)
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer'
                        : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed border border-dashed border-slate-300 dark:border-slate-700'
                    ]"
                    :title="isClipUnlocked(index) ? `Đoạn ${index + 1}` : 'Vui lòng hoàn thành câu trước để mở khóa'"
                  >
                    <Icon v-if="!isClipUnlocked(index)" name="lucide:lock" class="w-3 h-3" />
                    <span v-else>{{ index + 1 }}</span>
                  </button>
                </div>
                </div>
              </div>

              <!-- Hint Display -->
              <div v-if="showHint" class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                💡 {{ currentClip.hint }}
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Dictation Input & Feedback (5 Cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h4 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="lucide:pen-tool" class="w-4 h-4 text-primary-500" />
                  <span>Chép Chính Tả</span>
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lắng nghe kỹ câu thoại trong video và gõ lại chính xác bên dưới:
                </p>
              </div>

              <!-- Dictation Input Box -->
              <div>
                <textarea
                  v-model="userSentence"
                  :disabled="isChecked"
                  rows="4"
                  placeholder="Gõ câu tiếng Đức nghe được vào đây..."
                  class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:border-primary-500 transition-all resize-none"
                ></textarea>
              </div>

              <!-- Submitted Feedback Box -->
              <div v-if="isChecked" class="p-4 rounded-xl space-y-2 border transition-all" :class="isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'">
                <div class="flex items-center justify-between font-bold text-xs">
                  <span class="flex items-center gap-1.5">
                    <Icon :name="isCorrect ? 'lucide:check-circle-2' : 'lucide:x-circle'" class="w-4 h-4" />
                    <span>{{ isCorrect ? 'Chính xác 100%! +30 XP' : 'Chưa chính xác, thử lại hoặc xem đáp án:' }}</span>
                  </span>
                </div>
                <div class="text-xs pt-1 border-t border-current/10 space-y-0.5">
                  <p><span class="font-bold opacity-75">Đáp án:</span> "{{ currentClip.germanText || currentClip.targetSentence }}"</p>
                  <p v-if="currentClip.englishTranslation"><span class="font-bold opacity-75">Dịch:</span> {{ currentClip.englishTranslation }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-2">
                <button
                  v-if="!isChecked"
                  @click="checkDictation"
                  :disabled="!userSentence.trim()"
                  class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl py-3 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Icon name="lucide:check-circle" class="w-5 h-5" />
                  <span>Kiểm Tra Đáp Án</span>
                </button>
                <button
                  v-else
                  @click="nextClip"
                  class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl py-3 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Video Tiếp Theo</span>
                  <Icon name="lucide:arrow-right" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- BOTTOM FEATURE: KEY VOCABULARY & PROGRESS STATS -->
        <div v-if="currentClip?.vocabularies && currentClip.vocabularies.length > 0" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Key Vocabulary List in this Video -->
          <div class="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h4 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="lucide:book-open" class="w-4 h-4 text-primary-500" />
                <span>Từ Vựng Key Trong Video Này</span>
              </h4>
              <span class="text-xs font-bold text-slate-400">{{ currentClip.vocabularies?.length || 0 }} từ vựng</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                v-for="v in currentClip.vocabularies"
                :key="v.word"
                class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
              >
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-sm text-slate-900 dark:text-white">{{ v.word }}</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                    {{ v.type }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ v.meaning }}</p>
              </div>
            </div>
          </div>

          <!-- Dictation Stats Widget -->
          <div class="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <h4 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:trophy" class="w-4 h-4 text-amber-500" />
              <span>Tiến Độ Luyện Nghe</span>
            </h4>

            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                <span class="block text-2xl font-black text-primary-500">{{ completedCount }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Câu Hoàn Thành</span>
              </div>
              <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                <span class="block text-2xl font-black text-orange-500">🔥 {{ streakCount }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Chuỗi Ngày Học</span>
              </div>
            </div>

            <div class="text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
              Luyện nghe mỗi ngày 15 phút giúp tăng 80% khả năng phản xạ giao tiếp tự nhiên!
            </div>
          </div>
        </div>

      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
