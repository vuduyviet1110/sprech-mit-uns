<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'page' })
useHead({ title: '📰 Tin tức & SRS Reader - Sprech Mit Uns' })

const { playSound } = useGamification()

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
}

// Initial Daily News Articles Data
const articles = ref<Article[]>([
  {
    id: 'news-1',
    title: 'Guten Tag Berlin: Das Wetter im Frühling',
    date: '08.09.2026',
    level: 'A1',
    summary: 'Thời tiết mùa xuân tươi đẹp tại Berlin hôm nay.',
    content: 'Heute ist das Wetter in Berlin sehr schön. Die Sonne scheint und die Temperatur liegt bei zwanzig Grad.',
    sourceName: 'SprechMitUns Daily',
    isSaved: true,
  },
  {
    id: 'news-2',
    title: 'Neue Fahrradwege in München',
    date: '07.09.2026',
    level: 'A2',
    summary: 'Thành phố München mở rộng thêm nhiều làn đường dành cho xe đạp.',
    content: 'München baut neue Fahrradwege für mehr Sicherheit im Straßenverkehr. Viele Menschen fahren gern mit dem Fahrrad zur Arbeit.',
    sourceName: 'SprechMitUns Daily',
    isSaved: false,
  },
])

const searchQuery = ref('')
const selectedArticleIdx = ref(0)

const filteredArticles = computed(() => {
  if (!searchQuery.value.trim()) return articles.value
  const q = searchQuery.value.toLowerCase()
  return articles.value.filter(
    (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.level.toLowerCase().includes(q)
  )
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
const selectedSource = ref<'all' | 'tagesschau' | 'dw'>('all')
const scrapeCount = ref<number>(3)
const inputUrl = ref('')
const isScraping = ref(false)
const scrapeError = ref<string | null>(null)
const scrapeSuccessMsg = ref<string | null>(null)

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

// Split article text into interactive words
const wordsList = computed(() => {
  if (!selectedArticle.value || !selectedArticle.value.content) return []
  return selectedArticle.value.content.split(/\s+/).filter(Boolean)
})

const handleWordClick = async (word: string) => {
  const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()"']/g, '')
  if (!cleanWord) return

  activeWord.value = cleanWord
  wordMeaning.value = null
  playSound('correct')

  speakText(cleanWord, 'de-DE')

  isLookingUpWord.value = true
  try {
    const res: any = await $fetch(`/api/dictionary?search=${encodeURIComponent(cleanWord)}`)
    if (res && res.items && res.items.length > 0) {
      wordMeaning.value = res.items[0].meaning
    } else {
      wordMeaning.value = `Từ vựng tiếng Đức (${selectedArticle.value?.level || 'German'})`
    }
  } catch {
    wordMeaning.value = `Từ vựng tiếng Đức (${selectedArticle.value?.level || 'German'})`
  } finally {
    isLookingUpWord.value = false
  }
}

const speakCurrentArticle = () => {
  if (selectedArticle.value?.content) {
    speakText(selectedArticle.value.content, 'de-DE')
  }
}

const saveToSRS = async (word: string) => {
  if (!savedWords.value.includes(word)) {
    savedWords.value.push(word)
    playSound('correct')

    try {
      await $fetch('/api/srs/review', {
        method: 'POST',
        body: { wordId: word, quality: 4 },
      }).catch(() => {})
    } catch {
      // Ignore API errors
    }
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
        ? { mode: 'url', url: inputUrl.value }
        : { mode: 'rss', source: selectedSource.value, count: scrapeCount.value }

    const res: any = await $fetch('/api/news/scrape', {
      method: 'POST',
      body: payload,
    })

    if (res && res.articles && res.articles.length > 0) {
      const newArticles: Article[] = res.articles.map((a: Article) => ({ ...a, isSaved: false }))

      articles.value = [...newArticles, ...articles.value]
      selectedArticleIdx.value = 0
      playSound('correct')
      scrapeSuccessMsg.value = `Đã cào thành công ${newArticles.length} bài báo mới!`
      inputUrl.value = ''

      setTimeout(() => {
        isScrapeModalOpen.value = false
        scrapeSuccessMsg.value = null
      }, 1500)
    } else {
      scrapeError.value = 'Không tìm thấy nội dung bài báo nào.'
    }
  } catch (err: any) {
    scrapeError.value = err.data?.statusMessage || err.message || 'Lỗi khi cào bài báo. Vui lòng kiểm tra lại URL.'
  } finally {
    isScraping.value = false
  }
}
</script>

<template>
  <LayoutPageWrapper>
    <!-- Standard Header -->
    <LayoutPageHeader>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <LayoutPageTitle text="📰 Tin Tức & Interactive SRS Reader" />
          <p class="text-slate-500 dark:text-slate-400 text-base mt-1">
            Đọc báo tiếng Đức thực tế. Bấm từ để tra nghĩa, nghe phát âm &amp; lưu vào kho ôn tập SRS!
          </p>
        </div>
        <div>
          <button
            @click="isScrapeModalOpen = true"
            class="px-5 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            <Icon name="lucide:sparkles" class="w-5 h-5 animate-pulse" />
            <span>Cào Bài Báo Mới (Tối đa 5 bài)</span>
          </button>
        </div>
      </div>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="space-y-6">

        <!-- 12 Columns Split Workspace Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- LEFT COLUMN (4 Cols): Article Catalogue / List & Search -->
          <div class="lg:col-span-4 space-y-4">
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
              <!-- Search & Filter Bar -->
              <div class="relative">
                <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm bài đọc theo tiêu đề, trình độ..."
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>

              <!-- Header Catalogue Info -->
              <div class="flex items-center justify-between pt-1 text-xs">
                <span class="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Icon name="lucide:library" class="w-4 h-4 text-primary-500" />
                  <span>Danh sách bài đọc ({{ filteredArticles.length }}):</span>
                </span>
                <button
                  @click="isScrapeModalOpen = true"
                  class="text-[11px] font-bold text-primary-500 hover:underline flex items-center gap-1"
                >
                  <Icon name="lucide:plus-circle" class="w-3.5 h-3.5" />
                  <span>Cào thêm</span>
                </button>
              </div>

              <!-- Article Cards List -->
              <div v-if="filteredArticles.length === 0" class="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Icon name="lucide:file-question" class="w-6 h-6 mx-auto text-slate-300" />
                <p>Không tìm thấy bài đọc nào.</p>
              </div>

              <div v-else class="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                <div
                  v-for="(art, idx) in filteredArticles"
                  :key="art.id"
                  @click="selectedArticleIdx = idx"
                  :class="[
                    selectedArticleIdx === idx
                      ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 ring-1 ring-primary-500/30'
                      : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 hover:border-slate-300'
                  ]"
                  class="p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs relative group space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] rounded uppercase">
                        {{ art.level }}
                      </span>
                      <span v-if="art.isSaved" class="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] rounded flex items-center gap-1">
                        <Icon name="lucide:star" class="w-3 h-3 fill-current" />
                        Đã lưu
                      </span>
                    </div>
                    <span v-if="art.sourceName" class="text-[10px] font-semibold text-slate-400">
                      {{ art.sourceName }}
                    </span>
                  </div>

                  <h4 class="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary-500 transition-colors">
                    {{ art.title }}
                  </h4>

                  <div class="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-200/50 dark:border-slate-700/40">
                    <span>{{ art.date }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        @click.stop="toggleSaveArticle(art)"
                        :class="art.isSaved ? 'text-amber-500 font-bold' : 'hover:text-amber-500'"
                        class="transition-colors"
                        :title="art.isSaved ? 'Bỏ lưu' : 'Lưu bài đọc'"
                      >
                        <Icon :name="art.isSaved ? 'lucide:bookmark-check' : 'lucide:bookmark'" class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click.stop="deleteArticle(art.id)"
                        class="hover:text-rose-500 transition-colors"
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
            <div v-if="selectedArticle" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 relative min-h-[520px]">

              <!-- Article Title & Toolbar Header -->
              <div class="border-b border-slate-100 dark:border-slate-700 pb-5 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-extrabold text-xs rounded-lg">
                      Trình độ {{ selectedArticle.level }}
                    </span>
                    <span v-if="selectedArticle.sourceName" class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Icon name="lucide:globe" class="w-3.5 h-3.5" />
                      {{ selectedArticle.sourceName }}
                    </span>
                    <span class="text-xs font-medium text-slate-400">• Đăng ngày {{ selectedArticle.date }}</span>
                  </div>

                  <!-- Toolbar Buttons -->
                  <div class="flex items-center gap-2">
                    <button
                      @click="toggleSaveArticle(selectedArticle)"
                      :class="selectedArticle.isSaved ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-600'"
                      class="px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Icon :name="selectedArticle.isSaved ? 'lucide:bookmark-check' : 'lucide:bookmark'" class="w-4 h-4" />
                      <span>{{ selectedArticle.isSaved ? 'Đã lưu bài' : 'Lưu bài đọc' }}</span>
                    </button>

                    <button
                      @click="speakCurrentArticle"
                      class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Nghe toàn bộ phát âm bài báo"
                    >
                      <Icon name="lucide:volume-2" class="w-4 h-4" />
                      <span>Phát âm bài báo</span>
                    </button>

                    <button
                      @click="deleteArticle(selectedArticle.id)"
                      class="px-2.5 py-1.5 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Xóa bài đọc"
                    >
                      <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                <h2 class="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  {{ selectedArticle.title }}
                </h2>

                <p v-if="selectedArticle.summary" class="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  💡 {{ selectedArticle.summary }}
                </p>
              </div>

              <!-- Interactive Words Reading Panel (Left Aligned, Clear Spacing) -->
              <div class="space-y-4">
                <div class="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Nội dung bài viết (Bấm vào từ bất kỳ để nghe &amp; tra từ):</span>
                  <a
                    v-if="selectedArticle.sourceUrl"
                    :href="selectedArticle.sourceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-500 hover:underline flex items-center gap-1"
                  >
                    <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                    <span>Xem bài báo gốc</span>
                  </a>
                </div>

                <div class="text-base md:text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200 flex flex-wrap gap-2 pt-1 text-left">
                  <span
                    v-for="(w, idx) in wordsList"
                    :key="idx"
                    @click="handleWordClick(w)"
                    class="hover:bg-primary-100 dark:hover:bg-primary-950/60 hover:text-primary-800 dark:hover:text-primary-300 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors border-b-2 border-dotted border-slate-300 dark:border-slate-600"
                  >
                    {{ w }}
                  </span>
                </div>
              </div>

              <!-- SRS Saved Status Bar -->
              <div v-if="savedWords.length" class="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase">Từ đã lưu ôn tập SRS:</span>
                <div class="flex flex-wrap gap-2">
                  <span v-for="sw in savedWords" :key="sw" class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-lg flex items-center gap-1.5">
                    <Icon name="lucide:bookmark" class="w-3.5 h-3.5 fill-current" />
                    <span>{{ sw }}</span>
                  </span>
                </div>
              </div>

              <!-- Word Lookup Popup Modal -->
              <div v-if="activeWord" class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 rounded-2xl z-20">
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center animate-in fade-in zoom-in duration-150">
                  <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                    <span class="text-xs font-bold text-slate-400 uppercase">Tra từ &amp; Nghe âm</span>
                    <button @click="speakText(activeWord, 'de-DE')" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-primary-500 cursor-pointer">
                      <Icon name="lucide:volume-2" class="w-5 h-5" />
                    </button>
                  </div>

                  <h3 class="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-wide">{{ activeWord }}</h3>

                  <div class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl min-h-[60px] flex items-center justify-center">
                    <p v-if="isLookingUpWord" class="text-xs text-slate-400 animate-pulse flex items-center gap-2">
                      <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                      <span>Đang tra từ điển...</span>
                    </p>
                    <p v-else class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {{ wordMeaning || 'Từ vựng tiếng Đức' }}
                    </p>
                  </div>

                  <div class="flex gap-3 pt-2">
                    <button
                      @click="activeWord = null"
                      class="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      @click="saveToSRS(activeWord)"
                      class="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Icon name="lucide:zap" class="w-4 h-4 fill-current" />
                      <span>Lưu SRS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Icon name="lucide:newspaper" class="w-10 h-10 mx-auto text-slate-300" />
              <p class="text-sm font-semibold">Chọn một bài báo bên danh sách bên trái để bắt đầu luyện đọc.</p>
            </div>
          </div>

        </div>

      </div>
    </LayoutPageSection>

    <!-- News Scraper Modal -->
    <div v-if="isScrapeModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2.5 bg-primary-500/10 text-primary-500 rounded-2xl">
              <Icon name="lucide:bot" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Cào Tin Tức Tiếng Đức</h3>
              <p class="text-xs text-slate-400 font-medium">Tự chọn số bài &amp; nguồn báo tiếng Đức (Tối đa 5 bài)</p>
            </div>
          </div>
          <button @click="isScrapeModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Mode Selector -->
        <div class="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-extrabold">
          <button
            @click="scrapeMode = 'rss'"
            :class="scrapeMode === 'rss' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'"
            class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon name="lucide:rss" class="w-4 h-4" />
            <span>Tự động qua RSS Báo Đức</span>
          </button>
          <button
            @click="scrapeMode = 'url'"
            :class="scrapeMode === 'url' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'"
            class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon name="lucide:link" class="w-4 h-4" />
            <span>Nhập 1 URL cụ thể</span>
          </button>
        </div>

        <!-- RSS Options: Source & Article Count Selection -->
        <div v-if="scrapeMode === 'rss'" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn Nguồn Báo Tiếng Đức:
            </label>
            <select
              v-model="selectedSource"
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">🌐 Tất cả nguồn (Tagesschau &amp; Deutsche Welle)</option>
              <option value="tagesschau">📺 Tagesschau (Tin tức thời sự Đức)</option>
              <option value="dw">🌍 Deutsche Welle (Báo quốc tế tiếng Đức)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Số lượng bài báo muốn cào (Tối đa 5 bài):
            </label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="num in [1, 2, 3, 4, 5]"
                :key="num"
                @click="scrapeCount = num"
                :class="scrapeCount === num ? 'bg-primary-500 text-white font-extrabold ring-2 ring-primary-500/30' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
                class="py-2.5 rounded-xl text-sm transition-all"
              >
                {{ num }} bài
              </button>
            </div>
          </div>
        </div>

        <!-- URL Input Mode -->
        <div v-else class="space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Đường dẫn URL bài báo tiếng Đức:
          </label>
          <input
            v-model="inputUrl"
            type="url"
            placeholder="https://www.tagesschau.de/ausland/europa/..."
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Info Note -->
        <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <Icon name="lucide:info" class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p class="leading-relaxed">
            Các bài cào về sẽ xuất hiện ở **danh sách bài đọc tạm thời**. Bạn có thể bấm **"Lưu bài"** nếu muốn học kỹ hoặc bấm **"Xóa bài"** bất kỳ lúc nào!
          </p>
        </div>

        <!-- Notifications -->
        <div v-if="scrapeError" class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <Icon name="lucide:alert-triangle" class="w-4 h-4 shrink-0" />
          <span>{{ scrapeError }}</span>
        </div>

        <div v-if="scrapeSuccessMsg" class="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Icon name="lucide:check-circle-2" class="w-4 h-4 shrink-0" />
          <span>{{ scrapeSuccessMsg }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-2">
          <button
            @click="isScrapeModalOpen = false"
            class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>
          <button
            @click="handleScrapeNews"
            :disabled="isScraping || (scrapeMode === 'url' && !inputUrl.trim())"
            class="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Icon v-if="isScraping" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:play" class="w-4 h-4 fill-current" />
            <span>{{ isScraping ? 'Đang cào...' : `Bắt đầu Cào ${scrapeMode === 'rss' ? scrapeCount : 1} Bài` }}</span>
          </button>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
