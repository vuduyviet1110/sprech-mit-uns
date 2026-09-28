<template>
  <section ref="section" class="vocab-book w-full space-y-4" aria-label="Sổ từ vựng dạng sách">
    <!-- Container with optional sidebar -->
    <div :class="['flex gap-4 items-start', pageIndex === 0 ? '' : 'justify-center']">
      <!-- Bookshelf sidebar (visible only on cover page) -->
      <div v-if="pageIndex === 0 && entries.length > 0" class="hidden lg:flex flex-col gap-2 w-48 max-h-[600px] overflow-y-auto shrink-0">
        <div class="text-xs font-bold text-slate-500 uppercase px-2 py-1">{{ entries.length }} cuốn sách</div>
        <button
          v-for="(entry, idx) in entries.slice(0, 12)"
          :key="entry.id"
          type="button"
          class="text-left p-2.5 rounded-lg text-xs font-semibold transition-all"
          :class="idx === 0 ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'"
        >
          <div class="truncate">{{ entry.word }}</div>
          <div v-if="entry.topicName" class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {{ entry.topicName }}
          </div>
        </button>
      </div>

      <!-- Book viewer -->
      <div
        ref="host"
        class="relative select-none"
        :class="pageIndex === 0 ? 'flex-1 flex justify-center' : 'w-full flex justify-center'"
        @click="onHostClick"
      />
    </div>

    <!--
      PageFlip moves these nodes into its own root and clones them while flipping,
      so buttons use data-action + one delegated listener instead of Vue handlers.
      The whole block is re-keyed whenever the page structure changes.
    -->
    <div :key="signature" ref="source" class="hidden" aria-hidden="true">
      <div data-density="hard" class="vb-page vb-cover bg-primary-600">
        <div class="h-full flex flex-col justify-between p-8 sm:p-10 md:p-12 text-left text-white">
          <div class="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/80">
            <Icon :name="isDictionary ? 'lucide:book-open' : 'lucide:book-marked'" class="w-5 h-5" />
            {{ isDictionary ? 'Kho từ điển chung' : 'Notebook cá nhân' }}
          </div>
          <div class="space-y-3">
            <h2 class="text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              {{ isDictionary ? 'Từ điển' : 'Sổ Từ Vựng' }}
            </h2>
            <p class="text-lg md:text-xl font-bold text-white/90">
              {{ languageLabel }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-sm md:text-base font-extrabold text-white">
              <template v-if="isDictionary">
                {{ entries.length }} từ đang mở
                <span v-if="totalCount" class="font-semibold text-white/80"> / {{ totalCount }} trong kho</span>
              </template>
              <template v-else>
                {{ entries.length }} từ trong sổ
              </template>
            </p>
            <p class="text-xs md:text-sm font-semibold text-white/75">
              {{ WORDS_PER_PAGE }} từ mỗi trang · kéo góc hoặc phím ← → để lật
            </p>
          </div>
        </div>
      </div>

      <div
        v-for="chunk in wordPages"
        :key="`p-${chunk.start}`"
        class="vb-page vb-paper"
      >
        <div class="h-full flex flex-col p-4 sm:p-5 text-left overflow-hidden">
          <header class="flex items-baseline justify-between gap-2 pb-2 mb-1 border-b border-dashed border-slate-200 dark:border-slate-700">
            <p class="text-sm font-extrabold text-slate-500 dark:text-slate-400 truncate">
              {{ chunkTopic(chunk.words) || languageLabel }}
            </p>
            <p class="shrink-0 text-sm font-bold text-slate-400 tabular-nums">
              {{ chunk.start + 1 }}–{{ chunk.start + chunk.words.length }}
            </p>
          </header>

          <ol class="flex-1 min-h-0 flex flex-col">
            <li
              v-for="entry in chunk.words"
              :key="entry.id"
              class="flex-1 min-h-0 flex gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                <div class="flex items-baseline gap-2 min-w-0">
                  <span class="text-base font-black text-slate-900 dark:text-white truncate">
                    {{ entry.word }}
                  </span>
                  <span
                    v-if="entry.type"
                    class="shrink-0 text-sm font-bold text-slate-500"
                  >
                    {{ typeLabel(entry.type) }}
                  </span>
                  <code
                    v-if="transcriptionOf(entry)"
                    class="shrink-0 text-sm font-mono text-slate-400"
                  >
                    {{ transcriptionOf(entry) }}
                  </code>
                </div>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                  {{ viMeaning(entry.meaning) || '—' }}
                  <span
                    v-if="enMeaning(entry.meaning)"
                    class="font-medium text-slate-400"
                  >
                    · {{ enMeaning(entry.meaning) }}
                  </span>
                </p>
                <p
                  v-if="entry.example"
                  class="text-sm italic text-slate-500 line-clamp-1"
                >
                  {{ entry.example }}
                </p>
                <p
                  v-if="entry.note"
                  class="text-sm text-amber-800 dark:text-amber-200 line-clamp-1"
                >
                  {{ entry.note }}
                </p>
              </div>

              <div class="shrink-0 flex items-center gap-1 self-center">
                <button
                  type="button"
                  data-action="play"
                  :data-id="entry.id"
                  :disabled="playingWord === entry.word"
                  class="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Phát âm"
                >
                  <Icon
                    :name="playingWord === entry.word ? 'lucide:loader-2' : 'lucide:volume-2'"
                    :class="['w-4 h-4', playingWord === entry.word ? 'animate-spin' : '']"
                  />
                </button>
                <template v-if="isDictionary">
                  <button
                    type="button"
                    data-action="saveNotebook"
                    :data-id="entry.id"
                    class="w-8 h-8 rounded-lg border flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                    :class="notebookIds[entry.id]
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900'"
                    :aria-label="notebookIds[entry.id] ? 'Đã lưu sổ' : 'Lưu sổ'"
                  >
                    <Icon :name="notebookIds[entry.id] ? 'lucide:book-check' : 'lucide:book-plus'" class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-action="addSrs"
                    :data-id="entry.id"
                    class="w-8 h-8 rounded-lg border flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                    :class="srsWords[entry.word]
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200/80 dark:border-primary-900'"
                    :aria-label="srsWords[entry.word] ? 'Đã SRS' : 'Thêm SRS'"
                  >
                    <Icon :name="srsWords[entry.word] ? 'lucide:check' : 'lucide:bookmark-plus'" class="w-4 h-4" />
                  </button>
                  <button
                    v-if="entry.example"
                    type="button"
                    data-action="addPhrase"
                    :data-id="entry.id"
                    class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                    aria-label="Ôn câu ví dụ"
                  >
                    <Icon name="lucide:quote" class="w-4 h-4" />
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    data-action="edit"
                    :data-id="entry.id"
                    class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-700 flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                    aria-label="Sửa"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-action="delete"
                    :data-id="entry.id"
                    class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
                    aria-label="Xóa"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </template>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div v-if="needsFiller" class="vb-page vb-paper" />

      <div v-if="!hasMore" data-density="hard" class="vb-page vb-cover bg-primary-600">
        <div class="h-full flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
          <Icon :name="isDictionary ? 'lucide:book-marked' : 'lucide:repeat'" class="w-10 h-10 text-primary-100" />
          <p class="text-2xl font-black">
            {{ isDictionary ? 'Hết trang đã mở' : 'Hết sổ' }}
          </p>
          <p class="text-base font-semibold text-primary-100">
            {{ isDictionary ? 'Lưu từ vào sổ cá nhân, hoặc ôn bằng SRS.' : 'Ôn lặp lại những từ này bằng SRS.' }}
          </p>
          <button
            v-if="isDictionary"
            type="button"
            data-action="notebook"
            class="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl text-base font-extrabold hover:bg-primary-50 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Icon name="lucide:book-marked" class="w-5 h-5" />
            Mở sổ từ vựng
          </button>
          <button
            type="button"
            data-action="review"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-extrabold active:scale-95 transition-all duration-200 cursor-pointer"
            :class="isDictionary ? 'bg-primary-800 text-white hover:bg-primary-700' : 'bg-white text-primary-700 hover:bg-primary-50'"
          >
            <Icon name="lucide:brain" class="w-5 h-5" />
            Ôn tại SRS
          </button>
        </div>
      </div>
    </div>

    <nav class="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Điều khiển sách">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-primary-400 disabled:opacity-40 active:scale-95 transition-all duration-200 cursor-pointer"
        :disabled="pageIndex === 0"
        @click="toCover"
      >
        <Icon name="lucide:book-marked" class="w-4 h-4" />
        Về bìa
      </button>
      <button
        type="button"
        class="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 active:scale-95 transition-all duration-200 cursor-pointer"
        :disabled="pageIndex === 0"
        aria-label="Trang trước"
        @click="prev"
      >
        <Icon name="lucide:chevron-left" class="w-5 h-5" />
      </button>
      <span class="min-w-[8rem] text-center text-base font-extrabold text-slate-700 dark:text-slate-200 tabular-nums" aria-live="polite">
        Trang {{ pageIndex + 1 }} / {{ pageCount }}
      </span>
      <button
        type="button"
        class="w-11 h-11 rounded-xl bg-primary-500 hover:bg-primary-400 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all duration-200 cursor-pointer"
        :disabled="pageIndex >= pageCount - 1"
        aria-label="Trang sau"
        @click="next"
      >
        <Icon name="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </nav>
    <p
      v-if="loading && hasMore"
      class="text-center text-sm font-bold text-slate-500"
    >
      Đang tải thêm trang…
    </p>
  </section>
</template>

<script lang="ts" setup>
import type { PageFlip } from 'page-flip/dist/js/page-flip.module.js'

export type VocabBookEntry = {
  id: string
  word: string
  meaning: string
  type?: string | null
  level?: string | null
  example?: string | null
  note?: string | null
  topicName?: string | null
  language?: string
  audioUrl?: string | null
  pronunciation?: string | null
  transcription?: string | null
  vocabularyWord?: {
    pronunciation?: string | null
    audioUrl?: string | null
    transcription?: string | null
  } | null
}

const props = withDefaults(defineProps<{
  entries: VocabBookEntry[]
  playingWord: string | null
  hasMore: boolean
  loading: boolean
  language: string
  variant?: 'notebook' | 'dictionary'
  totalCount?: number
  notebookIds?: Record<string, boolean>
  srsWords?: Record<string, boolean>
}>(), {
  variant: 'notebook',
  totalCount: 0,
  notebookIds: () => ({}),
  srsWords: () => ({}),
})

const emit = defineEmits<{
  (e: 'play', entry: VocabBookEntry): void
  (e: 'edit', entry: VocabBookEntry): void
  (e: 'delete', id: string): void
  (e: 'loadMore'): void
  (e: 'saveNotebook', entry: VocabBookEntry): void
  (e: 'addSrs', entry: VocabBookEntry): void
  (e: 'addPhrase', entry: VocabBookEntry): void
}>()

const router = useRouter()

const section = ref<HTMLElement | null>(null)
const host = ref<HTMLElement | null>(null)
const source = ref<HTMLElement | null>(null)

const pageIndex = ref(0)
const pageCount = ref(0)

let book: PageFlip | null = null
let bookRoot: HTMLElement | null = null
let PageFlipCtor: typeof PageFlip | null = null
let unmounted = false

const WORDS_PER_PAGE = 8

const isDictionary = computed(() => props.variant === 'dictionary')
const languageLabel = computed(() => (props.language === 'cs' ? 'Tiếng Séc' : 'Tiếng Đức'))

const wordPages = computed(() => {
  const pages: { start: number, words: VocabBookEntry[] }[] = []
  for (let i = 0; i < props.entries.length; i += WORDS_PER_PAGE) {
    pages.push({ start: i, words: props.entries.slice(i, i + WORDS_PER_PAGE) })
  }
  return pages
})

const chunkTopic = (words: VocabBookEntry[]) => {
  const names = words.map(w => w.topicName).filter(Boolean)
  if (!names.length) return ''
  return names.every(n => n === names[0]) ? names[0] : 'Nhiều chủ đề'
}

// Cover + word sheets; filler keeps a full spread. Back cover only when nothing left to fetch.
const needsFiller = computed(() => wordPages.value.length % 2 === 1)

const signature = computed(() => `${props.variant}|${props.entries.map(e => e.id).join(',')}|${props.hasMore ? 1 : 0}`)

const TYPE_LABELS: Record<string, string> = {
  Noun: 'Danh từ',
  Verb: 'Động từ',
  Adjective: 'Tính từ',
  Adverb: 'Phó từ',
  Phrase: 'Cụm từ',
  Number: 'Số đếm',
}
const typeLabel = (type: string) => TYPE_LABELS[type] || type

const transcriptionOf = (entry: VocabBookEntry) =>
  entry.transcription || entry.pronunciation || entry.vocabularyWord?.transcription || entry.vocabularyWord?.pronunciation || ''

const cleanMeaning = (part: string) =>
  part
    .replace(/VN\s*/i, '')
    .replace(/🇻🇳/g, '')
    .replace(/GB\s*/i, '')
    .replace(/🇬🇧/g, '')
    .replace(/^\|/, '')
    .trim()

const viMeaning = (m?: string) => (m ? cleanMeaning(m.includes('•') ? m.split('•')[0] : m) : '')
const enMeaning = (m?: string) => (m && m.includes('•') ? cleanMeaning(m.split('•')[1]) : '')

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const syncState = () => {
  if (!book) return
  pageIndex.value = book.getCurrentPageIndex()
  pageCount.value = book.getPageCount()
  prefetchIfNeeded()
}

const prefetchIfNeeded = () => {
  if (!props.hasMore || props.loading || !wordPages.value.length) return
  // Cover is 0. In landscape the last two sheets are a spread — fetch when that spread is open.
  const lastWordPageIndex = wordPages.value.length
  if (pageIndex.value >= Math.max(1, lastWordPageIndex - 1)) emit('loadMore')
}

const teardown = () => {
  if (book) {
    try {
      book.destroy()
    }
    catch {}
  }
  book = null
  bookRoot?.remove()
  bookRoot = null
}

const build = (startPage = 0) => {
  if (unmounted || !PageFlipCtor || !host.value || !source.value) return
  const pages = Array.from(source.value.children) as HTMLElement[]
  if (!pages.length) return

  bookRoot = document.createElement('div')
  host.value.appendChild(bookRoot)

  const reduced = prefersReducedMotion()
  book = new PageFlipCtor(bookRoot, {
    width: 420,
    height: 580,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 520,
    minHeight: 390,
    maxHeight: 720,
    showCover: true,
    usePortrait: true,
    drawShadow: !reduced,
    flippingTime: reduced ? 0 : 700,
    maxShadowOpacity: 0.4,
    mobileScrollSupport: false,
    disableFlipByClick: true,
    startPage: Math.min(startPage, pages.length - 1),
  })
  book.on('flip', syncState)
  book.on('init', syncState)
  book.on('changeOrientation', syncState)
  book.loadFromHTML(pages)
  syncState()
}

watch(signature, () => {
  const keep = book?.getCurrentPageIndex() ?? 0
  teardown()
  nextTick(() => build(keep))
})

const findEntry = (id?: string) => props.entries.find(e => e.id === id)

const onHostClick = (ev: MouseEvent) => {
  const btn = (ev.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')
  if (!btn || (btn as HTMLButtonElement).disabled) return
  const id = btn.dataset.id
  switch (btn.dataset.action) {
    case 'play': {
      const entry = findEntry(id)
      if (entry) emit('play', entry)
      break
    }
    case 'edit': {
      const entry = findEntry(id)
      if (entry) emit('edit', entry)
      break
    }
    case 'delete':
      if (id) emit('delete', id)
      break
    case 'loadMore':
      emit('loadMore')
      break
    case 'saveNotebook': {
      const entry = findEntry(id)
      if (entry) emit('saveNotebook', entry)
      break
    }
    case 'addSrs': {
      const entry = findEntry(id)
      if (entry) emit('addSrs', entry)
      break
    }
    case 'addPhrase': {
      const entry = findEntry(id)
      if (entry) emit('addPhrase', entry)
      break
    }
    case 'review':
      router.push('/review')
      break
    case 'notebook':
      router.push('/vocabulary')
      break
  }
}

const next = () => {
  if (!book) return
  const atEnd = book.getCurrentPageIndex() >= book.getPageCount() - 1
  if (atEnd && props.hasMore) {
    prefetchIfNeeded()
    return
  }
  book.flipNext('bottom')
}
const prev = () => book?.flipPrev('bottom')
const toCover = () => {
  if (!book) return
  if (prefersReducedMotion()) book.turnToPage(0)
  else book.flip(0, 'top')
  syncState()
}

const onKeydown = (ev: KeyboardEvent) => {
  if (!book || !section.value) return
  const target = ev.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  const rect = section.value.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) return
  if (ev.key === 'ArrowRight') {
    ev.preventDefault()
    next()
  }
  else if (ev.key === 'ArrowLeft') {
    ev.preventDefault()
    prev()
  }
}

onMounted(async () => {
  const mod = await import('page-flip/dist/js/page-flip.module.js')
  PageFlipCtor = mod.PageFlip
  await nextTick()
  build()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('keydown', onKeydown)
  teardown()
})
</script>

<style scoped>
.vb-page {
  overflow: hidden;
}

.vb-paper {
  background-color: #fff;
  border: 1px solid rgb(226 232 240 / 0.8);
}

:global(.dark) .vb-paper {
  background-color: rgb(15 23 42);
  border-color: rgb(30 41 59);
}

.vb-paper.--left {
  background-image: linear-gradient(to left, rgb(15 23 42 / 0.1), transparent 9%);
  border-radius: 1rem 0 0 1rem;
}

.vb-paper.--right {
  background-image: linear-gradient(to right, rgb(15 23 42 / 0.1), transparent 9%);
  border-radius: 0 1rem 1rem 0;
}

.vb-cover {
  background-image:
    linear-gradient(135deg, rgb(255 255 255 / 0.15), transparent 40%),
    linear-gradient(to right, rgb(0 0 0 / 0.2), transparent 8%);
  border-radius: 0.75rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.25),
    inset -1px -1px 3px rgba(0, 0, 0, 0.15);
}

/* PageFlip starts a drag when mousedown lands on anything that is not an <a>/<button>. */
.vb-page [data-action] * {
  pointer-events: none;
}
</style>
