<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useLanguage, type LearningLanguage } from '~/composables/use-language'
import { useSrsStore } from '~/stores/useSrsStore'
import { useSession } from '~/composables/use-session'
import type { VocabularyWord } from '~/utils/types'

definePageMeta({ layout: 'page' })
useHead({ title: 'Tra Cứu Từ Điển Song Ngữ - Sprech Mit Uns' })

const srsStore = useSrsStore()
const { currentLanguage, setLanguage } = useLanguage()
const { userId, isAdmin } = useSession()

const showCreate = ref(false)
const createBusy = ref(false)
const createErrorText = ref('')
const topicOptions = ref<{ id: string, name: string, level?: string | null }[]>([])
const createForm = ref({
  word: '',
  meaning: '',
  english: '',
  example: '',
  level: 'A1',
  type: 'Noun',
  topicId: '',
})

const savedWordMap = ref<Record<string, boolean>>({})
const notebookWordMap = ref<Record<string, boolean>>({})
const activeToastText = ref('')
const activeToastSub = ref('')
let inlineToastTimer: any = null

const showToast = (title: string, sub: string) => {
  activeToastText.value = title
  activeToastSub.value = sub
  if (inlineToastTimer) clearTimeout(inlineToastTimer)
  inlineToastTimer = setTimeout(() => {
    activeToastText.value = ''
    activeToastSub.value = ''
  }, 4000)
}

const handleAddToSrs = async (wordObj: VocabularyWord) => {
  savedWordMap.value[wordObj.word] = true
  showToast(
    `Đã thêm "${wordObj.word}" vào ôn tập SRS`,
    'Từ sẽ xuất hiện trong lịch ôn lặp lại ngắt quãng',
  )
  await srsStore.addToSrs(
    wordObj.word,
    getViMeaning(wordObj.meaning),
    wordObj.language || selectedLang.value,
    { example: wordObj.example || undefined },
  )
}

const handleAddPhraseToSrs = async (wordObj: VocabularyWord) => {
  if (!wordObj.example?.trim()) return
  showToast(
    `Đã thêm câu ví dụ vào SRS`,
    'Ôn theo cụm (chunking) thay vì từ đơn',
  )
  await srsStore.addToSrs(
    wordObj.word,
    getViMeaning(wordObj.meaning),
    wordObj.language || selectedLang.value,
    { example: wordObj.example, asPhrase: true },
  )
}

const handleSaveToNotebook = async (wordObj: VocabularyWord) => {
  if (!wordObj.id || !userId.value) return
  try {
    await $fetch('/api/vocabulary', {
      method: 'POST',
      body: {
        wordId: wordObj.id,
        word: wordObj.word,
        meaning: wordObj.meaning,
        language: wordObj.language || selectedLang.value,
        level: wordObj.level,
        type: wordObj.type,
        example: wordObj.example,
        source: 'dictionary',
      },
    })
    notebookWordMap.value[wordObj.id] = true
    showToast(
      `Đã lưu "${wordObj.word}" vào sổ từ vựng`,
      'Xem lại trong Sổ từ vựng cá nhân — không phải SRS',
    )
  } catch (e) {
    console.error(e)
    showToast('Không lưu được vào sổ', 'Thử lại sau')
  }
}

const loadNotebookIds = async () => {
  if (!userId.value) return
  try {
    const res = await $fetch<{ wordIds: string[] }>('/api/vocabulary/saved-ids')
    const map: Record<string, boolean> = {}
    for (const id of res.wordIds || []) {
      if (id) map[id] = true
    }
    notebookWordMap.value = map
  } catch {
    // ignore
  }
}

const selectedLang = computed({
  get: () => currentLanguage.value,
  set: (val: LearningLanguage) => setLanguage(val),
})
const selectedLevel = ref('')
const selectedType = ref('')
const search = ref('')

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const wordTypes = [
  { label: 'Tất cả từ loại', value: '' },
  { label: 'Danh từ (Noun)', value: 'Noun' },
  { label: 'Động từ (Verb)', value: 'Verb' },
  { label: 'Tính từ (Adjective)', value: 'Adjective' },
  { label: 'Phó từ (Adverb)', value: 'Adverb' },
  { label: 'Cụm từ / Thán từ', value: 'Phrase' },
  { label: 'Số đếm (Number)', value: 'Number' },
]

type DictTopic = {
  id: string
  name: string
  slug?: string | null
  level?: string | null
  language?: string
  description?: string | null
  wordTotal?: number
  words: VocabularyWord[]
}

type TopicListResponse = {
  topics: DictTopic[]
  meta: {
    page: number
    limit: number
    hasMore: boolean
    totalTopics: number
    totalWords: number
  }
}

const PAGE_SIZE = 4
const topics = ref<DictTopic[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const totalTopicsCount = ref(0)
const totalWordsCount = ref(0)
const loadMoreSentinel = ref<HTMLElement | null>(null)

const { playAudioOrSpeak, playingWord } = useAudioPlayback()

type DictViewMode = 'grid' | 'book'
const VIEW_STORAGE_KEY = 'smu-dict-view'
const viewOptions: { value: DictViewMode, label: string, icon: string }[] = [
  { value: 'grid', label: 'Thẻ', icon: 'lucide:layout-grid' },
  { value: 'book', label: 'Sách', icon: 'lucide:book-open' },
]
const viewMode = ref<DictViewMode>('grid')

type WordListResponse = {
  items: (VocabularyWord & {
    topics?: { topic?: { name?: string | null } | null }[]
  })[]
  meta: { hasMore: boolean, totalCount: number }
}

const BOOK_PAGE_SIZE = 16
const bookWords = ref<(VocabularyWord & { topicName?: string | null, transcription?: string | null })[]>([])
const bookPage = ref(1)
const bookHasMore = ref(true)
const bookLoading = ref(false)
const bookLoadingMore = ref(false)
const bookTotal = ref(0)
/** '' is the all-words volume; A1–C2 force that level inside the book. */
const bookVolume = ref('')
const volumeLoading = ref(false)
const catalogTotal = ref(0)
const levelCounts = ref<Record<string, number>>({})
let bookFetchGen = 0

const shelfVolumes = computed(() => [
  { id: 'main', name: 'Tất cả', count: catalogTotal.value },
  ...levels.map(level => ({
    id: level,
    name: level,
    count: levelCounts.value[level] || 0,
  })),
])

const loadShelfCounts = async () => {
  try {
    const res = await $fetch<{ total: number, levels: Record<string, number> }>('/api/dictionary/level', {
      query: { language: selectedLang.value },
    })
    catalogTotal.value = res.total
    levelCounts.value = res.levels || {}
  }
  catch (e) {
    console.error(e)
  }
}

const onOpenVolume = (id: string) => {
  const next = id === 'main' ? '' : id
  if (next === bookVolume.value && !volumeLoading.value) return
  bookVolume.value = next
  fetchBookPage(true)
}

const fetchBookPage = async (reset = false) => {
  const gen = reset ? ++bookFetchGen : bookFetchGen
  if (reset) {
    bookPage.value = 1
    bookHasMore.value = true
    if (bookWords.value.length === 0) bookLoading.value = true
    else volumeLoading.value = true
  }
  else {
    if (!bookHasMore.value || bookLoadingMore.value || bookLoading.value || volumeLoading.value) return
    bookLoadingMore.value = true
    bookPage.value += 1
  }

  try {
    const level = bookVolume.value || selectedLevel.value
    const res = await $fetch<WordListResponse>('/api/dictionary', {
      query: {
        language: selectedLang.value,
        page: bookPage.value,
        limit: BOOK_PAGE_SIZE,
        ...(search.value.trim() ? { search: search.value.trim() } : {}),
        ...(level ? { level } : {}),
        ...(selectedType.value ? { type: selectedType.value } : {}),
      },
    })
    const mapped = (res.items || []).map(word => ({
      ...word,
      topicName: word.topics?.[0]?.topic?.name || null,
      transcription: word.transcription || word.pronunciation,
    }))
    if (gen !== bookFetchGen) return
    bookWords.value = reset ? mapped : [...bookWords.value, ...mapped]
    bookHasMore.value = res.meta.hasMore
    bookTotal.value = res.meta.totalCount
  }
  catch (e) {
    console.error(e)
    if (gen !== bookFetchGen) return
    if (reset && bookWords.value.length === 0) bookWords.value = []
    if (!reset) bookPage.value = Math.max(1, bookPage.value - 1)
    if (reset) bookVolume.value = ''
  }
  finally {
    if (gen === bookFetchGen) {
      bookLoading.value = false
      bookLoadingMore.value = false
      volumeLoading.value = false
    }
  }
}

const setViewMode = (mode: DictViewMode) => {
  if (mode === viewMode.value) return
  // Set loading before the mode flip so the first paint is a skeleton, not empty white.
  if (mode === 'book' && bookWords.value.length === 0) bookLoading.value = true
  if (mode === 'grid' && topics.value.length === 0) loading.value = true
  viewMode.value = mode
}

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }
  catch {}
  if (mode === 'book' && bookWords.value.length === 0) fetchBookPage(true)
  if (mode === 'grid' && topics.value.length === 0) fetchTopicsPage(true)
})

const isContentLoading = computed(() =>
  viewMode.value === 'book'
    ? bookLoading.value && bookWords.value.length === 0
    : loading.value && topics.value.length === 0,
)

const isContentEmpty = computed(() => {
  if (isContentLoading.value || volumeLoading.value) return false
  if (viewMode.value === 'book') return bookWords.value.length === 0 && !bookVolume.value
  return filteredTopics.value.length === 0
})

const fetchTopicsPage = async (reset: boolean) => {
  if (reset) {
    page.value = 1
    hasMore.value = true
    topics.value = []
    loading.value = true
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) return
    loadingMore.value = true
  }

  try {
    const res = await $fetch<TopicListResponse>('/api/dictionary/topic', {
      query: {
        lang: selectedLang.value,
        page: page.value,
        limit: PAGE_SIZE,
        ...(search.value.trim() ? { search: search.value.trim() } : {}),
        ...(selectedLevel.value ? { level: selectedLevel.value } : {}),
        ...(selectedType.value ? { type: selectedType.value } : {}),
      },
    })

    topics.value = reset ? res.topics : [...topics.value, ...res.topics]
    hasMore.value = res.meta.hasMore
    totalTopicsCount.value = res.meta.totalTopics
    totalWordsCount.value = res.meta.totalWords
    if (res.meta.hasMore) page.value += 1
  } catch (e) {
    console.error(e)
    if (reset) topics.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const reloadFromFilters = useDebounceFn(() => {
  if (viewMode.value === 'book') fetchBookPage(true)
  else fetchTopicsPage(true)
}, 280)

watch(
  [selectedLang, selectedLevel, selectedType, search],
  () => {
    if (showCreate.value) loadTopicOptions()
    reloadFromFilters()
  },
)

watch(selectedLang, () => {
  bookVolume.value = ''
  loadShelfCounts()
})

useIntersectionObserver(loadMoreSentinel, (entries) => {
  if (entries[0]?.isIntersecting) fetchTopicsPage(false)
})

onMounted(() => {
  try {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === 'book') viewMode.value = 'book'
  }
  catch {}
  loadNotebookIds()
  loadShelfCounts()
  if (viewMode.value === 'book') fetchBookPage(true)
  else fetchTopicsPage(true)
})

const filteredTopics = computed(() =>
  topics.value.map((topic) => ({
    ...topic,
    filteredWords: topic.words || [],
  })),
)

const closedTopicIds = ref<Set<string>>(new Set())

const toggleTopic = (id: string) => {
  const newSet = new Set(closedTopicIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  closedTopicIds.value = newSet
}

const getViMeaning = (meaningStr?: string) => {
  if (!meaningStr) return ''
  const part = meaningStr.includes('•') ? meaningStr.split('•')[0] : meaningStr
  return part.replace(/🇻🇳/g, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}

const getEnMeaning = (meaningStr?: string) => {
  if (!meaningStr || !meaningStr.includes('•')) return ''
  const part = meaningStr.split('•')[1]
  return part.replace(/🇻🇳/g, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}

const isTopicOpen = (id: string) => {
  if (search.value || selectedLevel.value || selectedType.value) return true
  return !closedTopicIds.value.has(id)
}

const clearFilters = () => {
  search.value = ''
  selectedLevel.value = ''
  selectedType.value = ''
}

const catalogTypes = wordTypes.filter(t => t.value)

const loadTopicOptions = async () => {
  try {
    const res = await $fetch<TopicListResponse>('/api/dictionary/topic', {
      query: { lang: selectedLang.value, summary: '1' },
    })
    topicOptions.value = (res.topics || []).map(t => ({
      id: t.id,
      name: t.name,
      level: t.level,
    }))
    const stillThere = topicOptions.value.some(t => t.id === createForm.value.topicId)
    if (!stillThere) createForm.value.topicId = topicOptions.value[0]?.id || ''
  } catch (e) {
    console.error(e)
  }
}

const closeCreate = () => {
  if (createBusy.value) return
  showCreate.value = false
}

const onCreateKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeCreate()
}

watch(showCreate, (open) => {
  if (open) {
    loadTopicOptions()
    window.addEventListener('keydown', onCreateKey)
  } else {
    window.removeEventListener('keydown', onCreateKey)
  }
})

onUnmounted(() => window.removeEventListener('keydown', onCreateKey))

const submitCatalogWord = async () => {
  createErrorText.value = ''
  const headword = createForm.value.word.trim()
  const vi = createForm.value.meaning.trim()
  const en = createForm.value.english.trim()
  if (!headword || !vi) {
    createErrorText.value = 'Nhập từ và nghĩa tiếng Việt'
    return
  }
  const gloss = en ? `${vi} • ${en}` : vi
  createBusy.value = true
  try {
    await $fetch('/api/dictionary', {
      method: 'POST',
      body: {
        word: headword,
        meaning: gloss,
        example: createForm.value.example.trim(),
        level: createForm.value.level,
        type: createForm.value.type,
        language: selectedLang.value,
        topicId: createForm.value.topicId || undefined,
      },
    })
    showToast(`Đã thêm "${headword}" vào từ điển`, 'Từ nằm trong kho chung, không phải sổ cá nhân')
    createForm.value.word = ''
    createForm.value.meaning = ''
    createForm.value.english = ''
    createForm.value.example = ''
    showCreate.value = false
    if (viewMode.value === 'book') fetchBookPage(true)
    else fetchTopicsPage(true)
  } catch (e: any) {
    createErrorText.value = e?.data?.message || e?.data?.statusMessage || 'Không thêm được từ'
  } finally {
    createBusy.value = false
  }
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <!-- Full Widescreen Layout -->
      <div class="w-full px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              Kho từ điển chung
            </span>
              <span v-if="!loading" class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
                <Icon name="lucide:book-open" class="w-4 h-4 text-primary-500" />
                <span>Kho từ: <strong class="text-primary-500 font-extrabold text-sm">{{ totalWordsCount }}</strong> từ vựng / <strong class="text-slate-900 dark:text-white font-extrabold text-sm">{{ totalTopicsCount }}</strong> chủ đề</span>
              </span>
            </div>

            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tra Cứu Từ Điển Phân Loại Theo Chủ Đề
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              Tra cứu kho từ hệ thống theo chủ đề. Có thể
              <strong class="font-semibold text-slate-800 dark:text-slate-200"> lưu vào sổ cá nhân</strong>
              hoặc
              <strong class="font-semibold text-slate-800 dark:text-slate-200"> thêm vào SRS</strong>
              để ôn — hai việc khác nhau.
            </p>
          </div>

          <div class="flex flex-col items-stretch sm:items-end gap-3">
            <button
              v-if="isAdmin"
              type="button"
              class="smu-btn"
              @click="showCreate = true"
            >
              <Icon name="lucide:plus" class="w-5 h-5" />
              Thêm từ
            </button>

          <!-- Language Switcher -->
          <div class="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              @click="selectedLang = 'de'; clearFilters()"
              :class="selectedLang === 'de' ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
              class="px-5 py-2.5 font-extrabold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🇩🇪 Tiếng Đức</span>
            </button>
            <button
              @click="selectedLang = 'cs'; clearFilters()"
              :class="selectedLang === 'cs' ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
              class="px-5 py-2.5 font-extrabold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🇨🇿 Tiếng Séc</span>
            </button>
          </div>
          </div>
        </div>

        <!-- Search Bar & Filter Surface -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div class="flex flex-col lg:flex-row gap-4 items-center">
            <!-- Large Search Input -->
            <div class="relative flex-1 w-full">
              <Icon name="lucide:search" class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-[1]" />
              <input
                v-model="search"
                type="text"
                placeholder="Tra cứu từ vựng theo tên từ, ý nghĩa tiếng Việt / Anh hoặc câu ví dụ..."
                class="w-full pl-14 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 text-base md:text-lg focus:outline-none focus:border-primary-500 transition-all"
              />
              <button
                v-if="search"
                @click="search = ''"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Icon name="lucide:x" class="w-6 h-6" />
              </button>
            </div>

            <!-- Level Filter Pills -->
            <div class="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              <button
                @click="selectedLevel = ''"
                :class="!selectedLevel ? 'bg-primary-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
                class="px-4 py-2.5 font-extrabold text-sm rounded-xl transition-all cursor-pointer"
              >
                Tất cả Cấp Độ
              </button>
              <button
                v-for="lvl in levels"
                :key="lvl"
                @click="selectedLevel = lvl"
                :class="selectedLevel === lvl ? 'bg-primary-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
                class="px-4 py-2.5 font-extrabold text-sm rounded-xl transition-all cursor-pointer"
              >
                {{ lvl }}
              </button>
            </div>
          </div>

          <!-- Word Type Filter Bar -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Từ Loại:</span>
            <button
              v-for="t in wordTypes"
              :key="t.value"
              @click="selectedType = t.value"
              :class="selectedType === t.value ? 'bg-primary-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
              class="px-4 py-2 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {{ t.label }}
            </button>

            <button
              v-if="search || selectedLevel || selectedType"
              @click="clearFilters"
              class="px-4 py-2 text-sm font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
              <span>Xóa bộ lọc</span>
            </button>

            <div
              class="ml-auto inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
              role="radiogroup"
              aria-label="Kiểu hiển thị"
            >
              <button
                v-for="opt in viewOptions"
                :key="opt.value"
                type="button"
                role="radio"
                :aria-checked="viewMode === opt.value"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all duration-200 cursor-pointer"
                :class="
                  viewMode === opt.value
                    ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                "
                @click="setViewMode(opt.value)"
              >
                <Icon :name="opt.icon" class="w-4 h-4" />
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading skeletons (in-flow — avoid full-screen overlay leaving a blank gap) -->
        <div v-if="isContentLoading" class="space-y-4" aria-busy="true" aria-live="polite">
          <p class="sr-only">Đang tải {{ viewMode === 'book' ? 'giá sách' : 'danh sách thẻ' }}…</p>

          <!-- Book shelf skeleton -->
          <div
            v-if="viewMode === 'book'"
            class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)] gap-5 xl:gap-6 items-stretch min-h-[min(70vh,42rem)]"
          >
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 overflow-hidden flex flex-col min-h-[28rem] animate-pulse">
              <div class="flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 sm:pt-8">
                <div class="space-y-2">
                  <div class="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div class="h-4 w-56 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div class="h-14 w-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
              <div class="flex-1 flex items-end justify-center gap-4 px-8 pb-4 pt-12">
                <div class="h-[min(52vh,22rem)] w-11 rounded-l-sm bg-primary-500/25 dark:bg-primary-400/20" />
                <div class="h-[min(52vh,22rem)] w-[min(42vw,15rem)] sm:w-[16rem] rounded-r-xl bg-primary-500/35 dark:bg-primary-400/25" />
                <div class="h-[min(40vh,16rem)] w-16 sm:w-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600" />
              </div>
              <div class="h-[18px] bg-amber-800/40 dark:bg-amber-900/50" />
            </div>
            <aside class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col gap-5 animate-pulse">
              <div class="space-y-2">
                <div class="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div class="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                <div class="h-4 w-[80%] rounded-md bg-slate-100 dark:bg-slate-800" />
              </div>
              <div v-for="n in 3" :key="n" class="flex gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary-500/15 shrink-0" />
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-700" />
                  <div class="h-3 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
              <div class="mt-auto grid grid-cols-2 gap-2.5">
                <div class="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div class="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div class="h-12 rounded-xl bg-primary-500/30" />
            </aside>
          </div>

          <!-- Card / topic grid skeleton -->
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div
              v-for="n in 4"
              :key="n"
              class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse"
            >
              <div class="p-6 flex items-center justify-between gap-4">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-12 h-12 rounded-xl bg-primary-500/15 shrink-0" />
                  <div class="space-y-2 min-w-0">
                    <div class="h-6 w-40 max-w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div class="h-4 w-28 rounded-md bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div class="h-9 w-28 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 hidden sm:block" />
              </div>
              <div class="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div
                    v-for="m in 2"
                    :key="m"
                    class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                  >
                    <div class="h-6 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div class="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    <div class="h-4 w-3/4 rounded-md bg-slate-100 dark:bg-slate-800" />
                    <div class="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="isContentEmpty"
          class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-500 space-y-4"
        >
          <Icon name="lucide:search-x" class="w-16 h-16 mx-auto text-slate-400" />
          <p class="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy từ vựng nào khớp với bộ lọc tìm kiếm hiện tại.</p>
        </div>

        <AwesomeVocabBook
          v-else-if="viewMode === 'book'"
          variant="dictionary"
          :entries="bookWords"
          :playing-word="playingWord"
          :has-more="bookHasMore"
          :loading="bookLoadingMore"
          :language="selectedLang"
          :total-count="bookTotal"
          :stock-count="catalogTotal"
          :volumes="shelfVolumes"
          :active-volume="bookVolume || 'main'"
          :volume-loading="volumeLoading"
          :notebook-ids="notebookWordMap"
          :srs-words="savedWordMap"
          @play="(w) => playAudioOrSpeak({ word: w.word, paragraph: w.word, audioUrl: w.audioUrl || w.vocabularyWord?.audioUrl, pronunciation: w.pronunciation || w.vocabularyWord?.pronunciation, lang: w.language || selectedLang })"
          @save-notebook="handleSaveToNotebook"
          @add-srs="handleAddToSrs"
          @add-phrase="handleAddPhraseToSrs"
          @load-more="fetchBookPage(false)"
          @open-volume="onOpenVolume"
        />

        <!-- Topic List Groups (2-column full-width grid layout) -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div
            v-for="topic in filteredTopics"
            :key="topic.id"
            class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all"
          >
            <!-- Topic Header -->
            <div
              @click="toggleTopic(topic.id)"
              class="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 flex items-center justify-center font-extrabold text-xl">
                  <Icon name="lucide:folder" class="w-6 h-6" />
                </div>
                <div>
                  <div class="flex items-center gap-2.5">
                    <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">{{ topic.name }}</h3>
                    <span class="px-3 py-0.5 text-xs font-extrabold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {{ topic.level || 'A1' }}
                    </span>
                  </div>
                  <p class="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {{ topic.wordTotal ?? topic.filteredWords?.length ?? 0 }} từ vựng {{ search || selectedLevel || selectedType ? 'khớp bộ lọc' : '' }}
                    <span
                      v-if="(topic.wordTotal || 0) > (topic.filteredWords?.length || 0)"
                      class="block mt-1 font-bold text-slate-600 dark:text-slate-300"
                    >
                      Đang hiện {{ topic.filteredWords?.length }} từ đầu. Mở kiểu Sách, hoặc lọc cấp {{ topic.level }}, để tra hết.
                    </span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <NuxtLink
                  :to="topic.slug ? `/lesson?topic=${topic.slug}` : '/lesson'"
                  @click.stop
                  class="px-4 py-2 text-sm font-extrabold text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/60 border border-primary-200 dark:border-primary-900/60 rounded-xl transition-all flex items-center gap-2"
                >
                  <Icon name="lucide:book-open" class="w-4 h-4" />
                  <span>Học bài này</span>
                </NuxtLink>
                <Icon
                  :name="isTopicOpen(topic.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                  class="w-6 h-6 text-slate-400"
                />
              </div>
            </div>

            <!-- Words Grid inside Topic (Big text sizes) -->
            <div
              v-if="isTopicOpen(topic.id)"
              class="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div
                  v-for="word in topic.filteredWords"
                  :key="word.id || word.word"
                  class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:border-primary-500 transition-all flex justify-between items-start gap-4"
                >
                  <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-wide">{{ word.word }}</span>
                      <span v-if="word.type" class="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 border border-emerald-200 dark:border-emerald-900/60">
                        {{ word.type === 'Noun' ? 'Danh từ' : word.type === 'Verb' ? 'Động từ' : word.type === 'Adjective' ? 'Tính từ' : word.type === 'Adverb' ? 'Phó từ' : word.type === 'Number' ? 'Số đếm' : word.type }}
                      </span>
                      <span v-if="word.pronunciation" class="text-sm text-slate-400 font-mono font-semibold">{{ word.pronunciation }}</span>
                    </div>

                    <div class="flex flex-col gap-2 text-base mt-2">
                      <div class="flex items-center gap-2 font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg">
                        <Icon name="twemoji:flag-vietnam" class="w-5 h-5 shrink-0" />
                        <span>{{ getViMeaning(word.meaning) }}</span>
                      </div>
                      <div v-if="getEnMeaning(word.meaning)" class="flex items-center gap-2 font-bold text-slate-500 text-sm md:text-base">
                        <Icon name="twemoji:flag-united-kingdom" class="w-5 h-5 shrink-0" />
                        <span>{{ getEnMeaning(word.meaning) }}</span>
                      </div>
                    </div>

                    <p v-if="word.example" class="text-sm text-slate-600 dark:text-slate-300 font-medium italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-2">
                      "{{ word.example }}"
                    </p>
                  </div>

                  <div class="flex flex-col gap-2 shrink-0 items-end">
                    <button
                      @click="playAudioOrSpeak({ word: word.word, paragraph: word.word, audioUrl: word.audioUrl, lang: word.language || selectedLang })"
                      title="Nghe phát âm"
                      class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    >
                      <Icon name="lucide:volume-2" class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleSaveToNotebook(word)"
                      :title="notebookWordMap[word.id] ? 'Đã lưu vào sổ' : 'Lưu vào sổ từ vựng'"
                      :class="notebookWordMap[word.id] ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'"
                      class="w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Icon :name="notebookWordMap[word.id] ? 'lucide:book-check' : 'lucide:book-plus'" class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleAddToSrs(word)"
                      :title="savedWordMap[word.word] ? 'Đã thêm vào SRS' : 'Thêm vào ôn tập SRS'"
                      :class="savedWordMap[word.word] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'"
                      class="w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Icon :name="savedWordMap[word.word] ? 'carbon:checkmark' : 'carbon:bookmark-add'" class="w-5 h-5" />
                    </button>
                    <button
                      v-if="word.example"
                      @click="handleAddPhraseToSrs(word)"
                      title="Ôn cả câu ví dụ (chunking)"
                      class="w-10 h-10 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Icon name="lucide:quote" class="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Infinite scroll sentinel -->
        <div
          v-if="filteredTopics.length && viewMode === 'grid'"
          ref="loadMoreSentinel"
          class="flex flex-col items-center justify-center gap-2 py-10"
          aria-hidden="true"
        >
          <div
            v-if="loadingMore"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
          >
            <Icon name="lucide:loader-2" class="h-5 w-5 animate-spin text-primary-500" />
            Đang tải thêm chủ đề…
          </div>
          <p
            v-else-if="!hasMore"
            class="text-sm font-semibold text-slate-400"
          >
            Đã hết {{ totalTopicsCount }} chủ đề
          </p>
        </div>
      </div>
    </LayoutPageSection>

    <Teleport to="body">
      <div
        v-if="isAdmin && showCreate"
        class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/60 cursor-pointer"
          aria-label="Đóng hộp thoại"
          @click="closeCreate"
        />
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="dict-create-title"
          class="relative w-full max-w-2xl max-h-[min(92vh,46rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl"
          @submit.prevent="submitCatalogWord"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <h2 id="dict-create-title" class="text-xl font-extrabold text-slate-900 dark:text-white">Thêm từ vào kho chung</h2>
              <p class="text-base text-slate-600 dark:text-slate-400">
                Ngôn ngữ đang chọn: {{ selectedLang === 'cs' ? 'tiếng Séc' : 'tiếng Đức' }}.
              </p>
            </div>
            <button
              type="button"
              class="w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-200"
              aria-label="Đóng"
              @click="closeCreate"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="space-y-2 sm:col-span-2">
              <span class="smu-label">Từ</span>
              <input
                v-model="createForm.word"
                required
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                :placeholder="selectedLang === 'cs' ? 'ví dụ: pes' : 'ví dụ: der Hund'"
              />
            </label>
            <label class="space-y-2">
              <span class="smu-label">Nghĩa tiếng Việt</span>
              <input
                v-model="createForm.meaning"
                required
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="con chó"
              />
            </label>
            <label class="space-y-2">
              <span class="smu-label">Nghĩa tiếng Anh</span>
              <input
                v-model="createForm.english"
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="dog"
              />
            </label>
            <label class="space-y-2 sm:col-span-2">
              <span class="smu-label">Câu ví dụ</span>
              <input
                v-model="createForm.example"
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                :placeholder="selectedLang === 'cs' ? 'Pes čeká u dveří.' : 'Der Hund wartet vor der Tür.'"
              />
            </label>
            <label class="space-y-2">
              <span class="smu-label">Cấp độ</span>
              <select
                v-model="createForm.level"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-950 text-base font-bold cursor-pointer focus:outline-none focus:border-primary-500"
              >
                <option v-for="lvl in levels" :key="lvl" :value="lvl">{{ lvl }}</option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="smu-label">Từ loại</span>
              <select
                v-model="createForm.type"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-950 text-base font-bold cursor-pointer focus:outline-none focus:border-primary-500"
              >
                <option v-for="t in catalogTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </label>
            <label class="space-y-2 sm:col-span-2">
              <span class="smu-label">Chủ đề</span>
              <select
                v-model="createForm.topicId"
                class="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-950 text-base font-bold cursor-pointer focus:outline-none focus:border-primary-500"
              >
                <option v-for="topic in topicOptions" :key="topic.id" :value="topic.id">
                  {{ topic.name }}{{ topic.level ? ` · ${topic.level}` : '' }}
                </option>
              </select>
            </label>
          </div>
          <p v-if="createErrorText" class="text-base font-bold text-red-500">{{ createErrorText }}</p>
          <div class="flex items-center justify-end gap-3">
            <button type="button" class="smu-btn-ghost" @click="closeCreate">Hủy</button>
            <button type="submit" class="smu-btn" :disabled="createBusy">
              <Icon :name="createBusy ? 'lucide:loader-2' : 'lucide:plus'" class="w-5 h-5" :class="createBusy ? 'animate-spin' : ''" />
              Lưu vào từ điển
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Inline Guaranteed Toast Notification -->
    <div
      v-if="activeToastText"
      class="fixed bottom-32 sm:bottom-8 right-8 z-[999999] flex items-center gap-3.5 px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500/50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white font-bold text-sm transition-all"
      style="box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.4);"
    >
      <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
        <Icon name="carbon:checkmark-outline" class="w-6 h-6 text-white" />
      </div>
      <div class="flex flex-col pr-3">
        <span class="text-base text-emerald-400 font-extrabold">{{ activeToastText }}</span>
        <span class="text-xs font-semibold text-slate-300">{{ activeToastSub }}</span>
      </div>
      <button
        @click="activeToastText = ''"
        class="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
      >
        <Icon name="carbon:close" class="w-5 h-5" />
      </button>
    </div>
  </LayoutPageWrapper>
</template>
