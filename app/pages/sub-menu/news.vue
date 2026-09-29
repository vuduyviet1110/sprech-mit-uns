<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSrsStore } from '~/stores/useSrsStore'
import { allSourcesLabel, feedsForLanguage } from '~/utils/news-sources'

definePageMeta({ layout: 'page' })
useHead({ title: '📰 Tin tức & SRS Reader - Sprech Mit Uns' })

const { playSound } = useGamification()
const { currentLanguage } = useLanguage()
const srsStore = useSrsStore()


interface Article {
  id: string
  title: string
  date: string
  level: string
  summary: string
  content: string
  sourceUrl?: string
  sourceName?: string
  isSaved?: boolean
  lang?: 'de' | 'cs'
}

// Bài mẫu để trang không trống khi chưa cào tin. Ngày tính tương đối lúc mount —
// ngày cứng sẽ thành ngày tương lai và lẫn với tin thật.
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

const SAMPLE_SOURCE_DE = 'Bài mẫu · SprechMitUns'
const SAMPLE_SOURCE_CS = 'Bài mẫu · SprechMitUns'

const initialGermanArticles: Article[] = [
  {
    id: 'news-de-1',
    title: 'Guten Tag Berlin: Das Wetter im Frühling',
    date: daysAgo(1),
    level: 'A1',
    summary: 'Thời tiết mùa xuân tươi đẹp tại Berlin hôm nay.',
    content: 'Heute ist das Wetter in Berlin sehr schön. Die Sonne scheint und die Temperatur liegt bei zwanzig Grad.',
    sourceName: SAMPLE_SOURCE_DE,
    isSaved: true,
    lang: 'de',
  },
  {
    id: 'news-de-2',
    title: 'Neue Fahrradwege in München',
    date: daysAgo(2),
    level: 'A2',
    summary: 'Thành phố München mở rộng thêm nhiều làn đường dành cho xe đạp.',
    content: 'München baut neue Fahrradwege für mehr Sicherheit im Straßenverkehr. Viele Menschen fahren gern mit dem Fahrrad zur Arbeit.',
    sourceName: SAMPLE_SOURCE_DE,
    isSaved: false,
    lang: 'de',
  },
]

const initialCzechArticles: Article[] = [
  {
    id: 'news-cs-1',
    title: 'Krásné jarní počasí v Praze',
    date: daysAgo(1),
    level: 'A1',
    summary: 'Thời tiết mùa xuân tươi đẹp tại Praha hôm nay.',
    content: 'Dnes je v Praze velmi pěkné počasí. Slunce svítí a teplota dosahuje dvaceti stupňů.',
    sourceName: SAMPLE_SOURCE_CS,
    isSaved: true,
    lang: 'cs',
  },
  {
    id: 'news-cs-2',
    title: 'Nové cyklostezky v Brně',
    date: daysAgo(2),
    level: 'A2',
    summary: 'Thành phố Brno mở rộng nhiều làn đường xe đạp mới cho người dân.',
    content: 'Brno staví nové cyklostezky pro větší bezpečnost v městském provozu. Mnoho lidí jezdí do práce na kole.',
    sourceName: SAMPLE_SOURCE_CS,
    isSaved: false,
    lang: 'cs',
  },
]

const articles = ref<Article[]>([...initialGermanArticles, ...initialCzechArticles])

const searchQuery = ref('')
const selectedArticleIdx = ref(0)

// Active language code ('de' or 'cs')
const activeLang = computed(() => {
  return currentLanguage.value === 'cs' ? 'cs' : 'de'
})

const languageLabel = computed(() => (activeLang.value === 'cs' ? 'tiếng Séc' : 'tiếng Đức'))
const speechLangCode = computed(() => (activeLang.value === 'cs' ? 'cs-CZ' : 'de-DE'))

// Filter articles by search query and active language
const filteredArticles = computed(() => {
  const langFiltered = articles.value.filter((a) => (a.lang || 'de') === activeLang.value)
  if (!searchQuery.value.trim()) return langFiltered
  const q = searchQuery.value.toLowerCase()
  return langFiltered.filter(
    (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.level.toLowerCase().includes(q)
  )
})

watch(activeLang, () => {
  selectedArticleIdx.value = 0
})

const selectedArticle = computed(() => {
  if (filteredArticles.value.length === 0) return null
  return filteredArticles.value[selectedArticleIdx.value] || filteredArticles.value[0]
})

const activeWord = ref<string | null>(null)
const wordMeaning = ref<string | null>(null)
const isLookingUpWord = ref(false)
const savedWords = ref<string[]>([])

// Scraper Modal & Filter State
const isScrapeModalOpen = ref(false)
const scrapeMode = ref<'rss' | 'url'>('rss')
const selectedSource = ref<string>('all')
const scrapeCount = ref<number>(3)
const inputUrl = ref('')
const isScraping = ref(false)
const scrapeError = ref<string | null>(null)
const scrapeSuccessMsg = ref<string | null>(null)
const pageAlertError = ref<string | null>(null)

// Nguồn RSS lấy từ `~/utils/news-sources` — chung với handler cào, nên dropdown
// không thể còn sót nguồn đã gỡ.
const availableRssSources = computed(() => [
  { key: 'all', name: allSourcesLabel(activeLang.value) },
  ...feedsForLanguage(activeLang.value).map((f) => ({ key: f.key, name: f.name })),
])

// Nguồn của ngôn ngữ cũ không tồn tại ở ngôn ngữ mới — nếu giữ lại thì <select>
// hiện rỗng vì value không khớp option nào.
watch(availableRssSources, (sources) => {
  if (!sources.some((s) => s.key === selectedSource.value)) {
    selectedSource.value = 'all'
  }
})

onMounted(() => {
  try {
    const stored = localStorage.getItem('sprech_saved_news_articles')
    if (stored) {
      const parsed: Article[] = JSON.parse(stored)
      if (parsed.length > 0) {
        const savedIds = new Set(parsed.map((a) => a.id))
        articles.value.forEach((a) => {
          if (savedIds.has(a.id)) a.isSaved = true
        })
        const extraSaved = parsed.filter((pa) => !articles.value.some((a) => a.id === pa.id))
        articles.value = [...extraSaved, ...articles.value]
      }
    }
  } catch (e) {
    console.error('Error loading saved articles:', e)
  }
})

function saveSavedArticlesToStorage() {
  try {
    const savedOnly = articles.value.filter((a) => a.isSaved)
    localStorage.setItem('sprech_saved_news_articles', JSON.stringify(savedOnly))
  } catch (e) {
    console.error('Error saving articles to storage:', e)
  }
}

// Split article text into interactive words & paragraphs
const articleParagraphs = computed(() => {
  if (!selectedArticle.value || !selectedArticle.value.content) return []
  const text = selectedArticle.value.content
  const rawParagraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean)
  if (rawParagraphs.length > 0) {
    return rawParagraphs.map(p => p.split(/\s+/).filter(Boolean)).filter(p => p.length > 0)
  }
  return [text.split(/\s+/).filter(Boolean)]
})

const wordsList = computed(() => {
  if (!selectedArticle.value || !selectedArticle.value.content) return []
  return selectedArticle.value.content.split(/\s+/).filter(Boolean)
})

const cleanWordStr = (str: string) => {
  return str.replace(/[.,/#!$%^&*;:{}=\-_`~()"']/g, '')
}

const handleWordClick = async (word: string) => {
  const cleanWord = cleanWordStr(word)
  if (!cleanWord) return

  activeWord.value = cleanWord
  wordMeaning.value = null
  playSound('correct')

  speakText(cleanWord, speechLangCode.value)

  isLookingUpWord.value = true
  try {
    const res: any = await $fetch(`/api/dictionary?search=${encodeURIComponent(cleanWord)}&lang=${activeLang.value}`)
    if (res && res.items && res.items.length > 0 && res.items[0].meaning) {
      wordMeaning.value = res.items[0].meaning
    } else {
      // Auto-translate using server Google Translate proxy API if word not in local dictionary
      const transRes: any = await $fetch(`/api/translate?text=${encodeURIComponent(cleanWord)}&from=${activeLang.value}&to=vi`)
      if (transRes && transRes.translated) {
        wordMeaning.value = transRes.translated
      } else {
        wordMeaning.value = `Từ vựng ${languageLabel.value}`
      }
    }
  } catch {
    wordMeaning.value = `Từ vựng ${languageLabel.value}`
  } finally {
    isLookingUpWord.value = false
  }
}

const speakCurrentArticle = () => {
  if (selectedArticle.value?.content) {
    speakText(selectedArticle.value.content, speechLangCode.value)
  }
}

const newsToastText = ref<string>('')
let newsToastTimer: any = null

const saveToSRS = async (word: string) => {
  if (!savedWords.value.includes(word)) {
    savedWords.value.push(word)
    playSound('correct')
    newsToastText.value = `Đã thêm "${word}" vào ôn tập SRS!`
    if (newsToastTimer) clearTimeout(newsToastTimer)
    newsToastTimer = setTimeout(() => {
      newsToastText.value = ''
    }, 4000)
    await srsStore.addToSrs(word, wordMeaning.value || undefined, activeLang.value)
  }
  activeWord.value = null
}


const toggleSaveArticle = (article: Article) => {
  article.isSaved = !article.isSaved
  saveSavedArticlesToStorage()
  if (article.isSaved) {
    playSound('correct')
  }
}

const deleteArticle = (artId: string) => {
  const index = articles.value.findIndex((a) => a.id === artId)
  if (index !== -1) {
    const art = articles.value[index]
    articles.value.splice(index, 1)
    if (art && art.isSaved) saveSavedArticlesToStorage()

    if (selectedArticleIdx.value >= filteredArticles.value.length) {
      selectedArticleIdx.value = Math.max(0, filteredArticles.value.length - 1)
    }
  }
}

const handleScrapeNews = async () => {
  scrapeError.value = null
  scrapeSuccessMsg.value = null
  isScraping.value = true

  try {
    const payload =
      scrapeMode.value === 'url'
        ? { mode: 'url', url: inputUrl.value, lang: activeLang.value }
        : { mode: 'rss', source: selectedSource.value, count: scrapeCount.value, lang: activeLang.value }

    const res: any = await $fetch('/api/news/scrape', {
      method: 'POST',
      body: payload,
    })

    if (res && res.articles && res.articles.length > 0) {
      const newArticles: Article[] = res.articles.map((a: Article) => ({ ...a, isSaved: false, lang: activeLang.value }))

      articles.value = [...newArticles, ...articles.value]
      selectedArticleIdx.value = 0

      const blockedArticle = newArticles.find(a => a.content.includes('⚠️ [CHÚ Ý:'))
      if (blockedArticle) {
        pageAlertError.value = `Cảnh báo: Trang báo ${blockedArticle.sourceName || ''} đã chặn truy cập (Lỗi 403 Forbidden). Chỉ có thể hiển thị tóm tắt.`
        playSound('wrong')
      } else {
        playSound('correct')
        pageAlertError.value = null
      }

      scrapeSuccessMsg.value = `Đã cào ${newArticles.length} bài báo ${languageLabel.value} mới!`
      inputUrl.value = ''

      setTimeout(() => {
        isScrapeModalOpen.value = false
        scrapeSuccessMsg.value = null
      }, 1500)
    } else {
      const msg = 'Không tìm thấy nội dung bài báo nào từ liên kết hoặc nguồn RSS.'
      scrapeError.value = msg
      pageAlertError.value = msg
      playSound('wrong')
    }
  } catch (err: any) {
    const errorDetail = err.data?.statusMessage || err.message || 'Không thể truy cập trang báo. Vui lòng kiểm tra lại liên kết URL.'
    scrapeError.value = errorDetail
    pageAlertError.value = `Lỗi cào báo: ${errorDetail}`
    playSound('wrong')
  } finally {
    isScraping.value = false
  }
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 text-left">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              News Reader & Vocabulary Extraction
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              📰 Tin Tức & Interactive Reader
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mt-1">
              Đọc báo {{ languageLabel }} thực tế. Bấm từ để tra nghĩa, nghe phát âm &amp; lưu vào kho ôn tập SRS!
            </p>
          </div>
          <div>
            <button
              @click="isScrapeModalOpen = true"
              class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer text-xs"
            >
              <Icon name="lucide:sparkles" class="w-4 h-4" />
              <span>Cào Bài Báo Mới ({{ languageLabel }})</span>
            </button>
          </div>
        </div>

        <!-- Notification Banner when Scrape Error occurs -->
        <div v-if="pageAlertError" class="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-600 dark:text-rose-400 font-bold shadow-xs animate-shake">
          <div class="flex items-center gap-2.5">
            <Icon name="lucide:alert-triangle" class="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{{ pageAlertError }}</span>
          </div>
          <button @click="pageAlertError = null" class="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-lg cursor-pointer">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- 12 Columns Split Workspace Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- LEFT COLUMN (4 Cols): Article Catalogue / List & Search -->
          <div class="lg:col-span-4 space-y-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <!-- Search & Filter Bar -->
              <div class="relative">
                <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm bài đọc theo tiêu đề..."
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>

              <!-- Header Catalogue Info -->
              <div class="flex items-center justify-between pt-1 text-xs">
                <span class="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Icon name="lucide:library" class="w-4 h-4 text-primary-500" />
                  <span>Danh sách bài đọc {{ languageLabel }} ({{ filteredArticles.length }}):</span>
                </span>
              </div>

              <!-- Article Cards List -->
              <div v-if="filteredArticles.length === 0" class="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                <Icon name="lucide:file-question" class="w-6 h-6 mx-auto text-slate-300" />
                <p>Không tìm thấy bài đọc {{ languageLabel }} nào.</p>
              </div>

              <div v-else class="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                <div
                  v-for="(art, idx) in filteredArticles"
                  :key="art.id"
                  @click="selectedArticleIdx = idx"
                  :class="[
                    selectedArticleIdx === idx
                      ? 'border-primary-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-primary-500/30'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  ]"
                  class="p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs relative space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-[10px] rounded uppercase">
                        {{ art.level }}
                      </span>
                      <span v-if="art.isSaved" class="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-600 font-extrabold text-[10px] rounded flex items-center gap-1">
                        <Icon name="lucide:star" class="w-3 h-3 fill-current" />
                        Đã lưu
                      </span>
                    </div>
                  </div>

                  <h4 class="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {{ art.title }}
                  </h4>

                  <div class="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <span>{{ art.date }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        @click.stop="toggleSaveArticle(art)"
                        :class="art.isSaved ? 'text-amber-500 font-bold' : 'hover:text-amber-500'"
                        class="transition-colors cursor-pointer"
                        :title="art.isSaved ? 'Bỏ lưu' : 'Lưu bài đọc'"
                      >
                        <Icon :name="art.isSaved ? 'lucide:bookmark-check' : 'lucide:bookmark'" class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click.stop="deleteArticle(art.id)"
                        class="hover:text-rose-500 transition-colors cursor-pointer"
                        title="Xóa bài đọc này"
                      >
                        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN (8 Cols): Main Interactive Reader Workspace Panel -->
          <div class="lg:col-span-8 space-y-4">
            <div v-if="selectedArticle" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 relative min-h-[520px]">
              <!-- Article Title & Toolbar Header -->
              <div class="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-xs rounded-lg">
                      Trình độ {{ selectedArticle.level }}
                    </span>
                    <span v-if="selectedArticle.sourceName" class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs rounded-lg">
                      {{ selectedArticle.sourceName }}
                    </span>
                    <span class="text-xs font-medium text-slate-400">• {{ selectedArticle.date }}</span>
                  </div>

                  <!-- Toolbar Buttons -->
                  <div class="flex items-center gap-2">
                    <a
                      v-if="selectedArticle.sourceUrl"
                      :href="selectedArticle.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Xem bài gốc trên trang báo"
                    >
                      <Icon name="lucide:external-link" class="w-4 h-4 text-primary-500" />
                      <span>Xem bài gốc</span>
                    </a>

                    <button
                      @click="toggleSaveArticle(selectedArticle)"
                      :class="selectedArticle.isSaved ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'"
                      class="px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Icon :name="selectedArticle.isSaved ? 'lucide:bookmark-check' : 'lucide:bookmark'" class="w-4 h-4" />
                      <span>{{ selectedArticle.isSaved ? 'Đã lưu' : 'Lưu bài' }}</span>
                    </button>

                    <button
                      @click="speakCurrentArticle"
                      class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Icon name="lucide:volume-2" class="w-4 h-4" />
                      <span>Phát âm bài</span>
                    </button>
                  </div>
                </div>

                <h2 class="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {{ selectedArticle.title }}
                </h2>
              </div>

              <!-- Interactive Paragraphs & Words Reading Panel -->
              <div class="space-y-4">
                <!-- Word Lookup Popover Card -->
                <div
                  v-if="activeWord"
                  class="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 space-y-2 animate-fadeIn transition-all"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-lg font-extrabold">{{ activeWord }}</span>
                      <button @click="speakText(activeWord, speechLangCode)" class="p-1 hover:bg-emerald-600 rounded-lg cursor-pointer">
                        <Icon name="lucide:volume-2" class="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <button @click="activeWord = null" class="p-1 hover:bg-emerald-600 rounded-lg cursor-pointer">
                      <Icon name="lucide:x" class="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div class="text-xs font-semibold text-emerald-50">
                    <span v-if="isLookingUpWord" class="italic flex items-center gap-1.5">
                      <Icon name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                      Đang tra từ điển...
                    </span>
                    <span v-else>{{ wordMeaning || 'Đang cập nhật nghĩa từ vựng' }}</span>
                  </div>

                  <div class="pt-2 flex items-center justify-end gap-2">
                    <button
                      @click="saveToSRS(activeWord)"
                      :disabled="savedWords.includes(activeWord)"
                      class="px-3 py-1.5 bg-white text-emerald-700 font-extrabold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      <Icon :name="savedWords.includes(activeWord) ? 'lucide:check' : 'lucide:bookmark-plus'" class="w-3.5 h-3.5" />
                      <span>{{ savedWords.includes(activeWord) ? 'Đã lưu SRS' : 'Lưu vào Ôn tập SRS' }}</span>
                    </button>
                  </div>
                </div>

                <template v-for="(paraWords, pIdx) in articleParagraphs" :key="pIdx">
                  <!-- Render Heading (###) -->
                  <div
                    v-if="paraWords[0] && paraWords[0].startsWith('###')"
                    class="w-full pt-4 pb-1 text-xl md:text-2xl font-black text-emerald-800 dark:text-emerald-400 border-b border-emerald-500/20 flex flex-wrap gap-x-2 gap-y-1 text-left"
                  >
                    <span
                      v-for="(w, idx) in paraWords"
                      :key="idx"
                      @click="handleWordClick(w.replace(/^###\s*/, ''))"
                      :class="activeWord && cleanWordStr(w) === activeWord ? 'bg-emerald-500 text-white rounded px-1' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/80 hover:text-emerald-600 dark:hover:text-emerald-300 border-b border-dotted border-emerald-400/50'"
                      class="py-0.5 rounded cursor-pointer transition-colors font-black tracking-tight"
                    >
                      {{ idx === 0 ? w.replace(/^###\s*/, '') : w }}
                    </span>
                  </div>

                  <!-- Render Regular Paragraph -->
                  <div
                    v-else
                    class="text-base md:text-lg font-normal leading-relaxed text-slate-800 dark:text-slate-200 flex flex-wrap gap-x-1.5 gap-y-1 text-left pb-3"
                  >
                    <span
                      v-for="(w, idx) in paraWords"
                      :key="idx"
                      @click="handleWordClick(w)"
                      :class="activeWord && cleanWordStr(w) === activeWord ? 'bg-emerald-500 text-white rounded' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/80 hover:text-primary-600 dark:hover:text-primary-400 border-b border-dotted border-slate-300 dark:border-slate-700'"
                      class="px-1 py-0.5 rounded cursor-pointer transition-colors font-medium"
                    >
                      {{ w }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPageSection>

    <!-- News Scraper Modal -->
    <div v-if="isScrapeModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-lg space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Cào Tin Tức {{ languageLabel }}</h3>
          <button @click="isScrapeModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Scrape Mode Toggle (RSS / Custom URL) -->
          <div class="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              @click="scrapeMode = 'rss'"
              :class="scrapeMode === 'rss' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Icon name="lucide:rss" class="w-4 h-4" />
              <span>Nguồn báo RSS</span>
            </button>
            <button
              @click="scrapeMode = 'url'"
              :class="scrapeMode === 'url' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Icon name="lucide:link" class="w-4 h-4" />
              <span>Dán URL bài báo</span>
            </button>
          </div>

          <!-- RSS Mode Controls -->
          <div v-if="scrapeMode === 'rss'" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn nguồn báo {{ languageLabel }}:
              </label>
              <select
                v-model="selectedSource"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option v-for="src in availableRssSources" :key="src.key" :value="src.key">
                  {{ src.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Số lượng bài báo muốn cào:
              </label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="num in [1, 2, 3, 4, 5]"
                  :key="num"
                  @click="scrapeCount = num"
                  :class="scrapeCount === num ? 'bg-primary-500 text-white font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                  class="py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {{ num }} bài
                </button>
              </div>
            </div>
          </div>

          <!-- URL Mode Input -->
          <div v-else class="space-y-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nhập liên kết bài báo {{ languageLabel }}:
            </label>
            <input
              v-model="inputUrl"
              type="url"
              placeholder="https://..."
              class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <!-- Alert Messages -->
          <div v-if="scrapeError" class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-bold">
            {{ scrapeError }}
          </div>
          <div v-if="scrapeSuccessMsg" class="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {{ scrapeSuccessMsg }}
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            @click="isScrapeModalOpen = false"
            class="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="handleScrapeNews"
            :disabled="isScraping"
            class="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>{{ isScraping ? 'Đang cào...' : 'Bắt đầu Cào Bài' }}</span>
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="newsToastText"
      class="fixed bottom-8 right-8 z-[999999] flex items-center gap-3.5 px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500/50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white font-bold text-sm transition-all"
      style="box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.4);"
    >
      <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
        <Icon name="carbon:checkmark-outline" class="w-6 h-6 text-white" />
      </div>
      <div class="flex flex-col pr-3">
        <span class="text-base text-emerald-400 font-extrabold">{{ newsToastText }}</span>
        <span class="text-xs font-semibold text-slate-300">Đã cập nhật danh sách ôn tập SRS</span>
      </div>
      <button
        @click="newsToastText = ''"
        class="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
      >
        <Icon name="carbon:close" class="w-5 h-5" />
      </button>
    </div>
  </LayoutPageWrapper>
</template>
