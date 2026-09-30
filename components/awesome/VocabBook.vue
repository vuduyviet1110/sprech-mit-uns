<template>
  <section ref="section" class="vocab-book w-full space-y-4" aria-label="Sổ từ vựng dạng sách">
    <!-- ============ SHELF VIEW ============ -->
    <div v-if="!opened" class="w-full">
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)] gap-5 xl:gap-6 items-stretch min-h-[min(70vh,42rem)]">
        <!-- Shelf stage -->
        <div class="vb-shelf relative flex flex-col rounded-2xl min-h-[28rem]">
          <div class="flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 sm:pt-8">
            <div class="text-left min-w-0">
              <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Giá sách
              </h3>
              <p class="mt-1 text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
                {{ shelf.length }} cuốn · {{ languageLabel }} · chọn gáy để mở
              </p>
            </div>
            <div class="vb-stock shrink-0 rounded-xl px-3 py-2 text-right">
              <p class="text-sm font-bold text-slate-500 dark:text-slate-400">Trong kho</p>
              <p class="text-xl font-black text-primary-700 dark:text-primary-300 tabular-nums">
                {{ stockCount || totalCount || entries.length }}
              </p>
            </div>
          </div>

          <div class="relative flex-1 flex items-end justify-start gap-3 sm:gap-4 px-5 sm:px-8 pt-8 pb-2 overflow-x-auto snap-x">
            <!-- Soft backdrop books (visual weight only) -->
            <div class="pointer-events-none absolute inset-x-8 bottom-6 top-16 opacity-30 dark:opacity-40" aria-hidden="true">
              <div class="absolute left-[8%] bottom-0 h-[70%] w-10 rounded-sm bg-stone-500 shadow-md -rotate-6" />
              <div class="absolute left-[18%] bottom-0 h-[85%] w-12 rounded-sm bg-primary-800/80 shadow-md rotate-3" />
              <div class="absolute right-[16%] bottom-0 h-[78%] w-11 rounded-sm bg-amber-800/70 shadow-md -rotate-2" />
              <div class="absolute right-[6%] bottom-0 h-[62%] w-9 rounded-sm bg-stone-600/80 shadow-md rotate-5" />
            </div>

            <button
              v-for="(item, idx) in shelf"
              :key="item.id"
              :data-spine="item.id"
              type="button"
              class="vb-featured group relative z-[1] flex shrink-0 snap-start text-left cursor-pointer active:scale-[0.98] transition-transform duration-200"
              :class="item.id === 'main'
                ? 'h-[min(52vh,22rem)] w-[min(42vw,15rem)] sm:w-[16rem]'
                : 'h-[min(46vh,18.5rem)] w-[9.25rem] sm:w-[10.5rem]'"
              :title="item.name"
              @click="openBook(item.id)"
            >
              <span
                class="vb-spine relative h-full shrink-0 rounded-l-[3px] rounded-r-sm bg-gradient-to-r shadow-xl"
                :class="[
                  item.id === 'main' ? 'w-11 sm:w-12' : 'w-8 sm:w-9',
                  SPINE_TONES[idx % SPINE_TONES.length],
                ]"
              >
                <span class="absolute inset-y-0 left-0 w-2 bg-black/25 rounded-l-[3px]" />
                <span class="absolute inset-y-0 right-0 w-1 bg-white/20" />
                <span class="vb-spine-text absolute inset-0 flex items-center justify-center px-1 text-white font-black text-sm tracking-tight">
                  {{ item.name }}
                </span>
              </span>
              <span
                class="vb-board relative flex-1 h-full rounded-r-md text-white overflow-hidden border transition-colors duration-200"
                :class="BOARD_TONES[idx % BOARD_TONES.length]"
              >
                <span class="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <span class="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent" />
                <span class="relative flex h-full flex-col justify-between" :class="item.id === 'main' ? 'p-4 sm:p-5' : 'p-3'">
                  <span class="inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-white/80">
                    <Icon :name="isDictionary ? 'lucide:book-open' : 'lucide:book-marked'" class="w-4 h-4 shrink-0" />
                    {{ item.id === 'main' ? (isDictionary ? 'Kho chung' : 'Notebook') : 'Cấp' }}
                  </span>
                  <span>
                    <span class="block font-black leading-tight" :class="item.id === 'main' ? 'text-2xl sm:text-3xl' : 'text-3xl'">{{ item.name }}</span>
                    <span v-if="item.id === 'main'" class="mt-1 block text-base font-bold text-white/80">{{ languageLabel }}</span>
                  </span>
                  <span class="flex items-end justify-between gap-2">
                    <span class="text-sm font-semibold text-white/90">
                      {{ item.count != null ? `${item.count} từ` : 'Mở để đọc' }}
                    </span>
                    <span v-if="item.id === 'main'" class="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-sm font-extrabold">
                      Mở
                      <Icon name="lucide:chevron-right" class="w-4 h-4" />
                    </span>
                  </span>
                </span>
              </span>
            </button>

            <button
              v-if="!hasVolumes"
              type="button"
              class="vb-add relative z-[1] h-[min(40vh,16rem)] w-16 sm:w-20 shrink-0 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:text-primary-700 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Thêm cuốn sách"
              @click="emit('addBook')"
            >
              <Icon name="lucide:plus" class="w-6 h-6" />
              <span class="text-sm font-bold">Thêm</span>
            </button>
          </div>

          <div class="vb-plank" />
        </div>

        <!-- Guide / fill the empty half -->
        <aside class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col gap-5 text-left shadow-xs">
          <div>
            <h4 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Đọc như cầm sách thật
            </h4>
            <p class="mt-1.5 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Chọn gáy trên giá, mở bìa, rồi lật trang. Mỗi trang khoảng {{ WORDS_PER_PAGE }} từ; gần cuối sách sẽ tự tải thêm.
            </p>
          </div>

          <ol class="space-y-3">
            <li
              v-for="(step, i) in shelfSteps"
              :key="step.title"
              class="flex gap-3"
            >
              <span class="shrink-0 w-9 h-9 rounded-xl bg-primary-500/10 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-black tabular-nums">
                {{ i + 1 }}
              </span>
              <span class="min-w-0">
                <span class="block text-base font-extrabold text-slate-800 dark:text-slate-100">{{ step.title }}</span>
                <span class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ step.body }}</span>
              </span>
            </li>
          </ol>

          <div class="mt-auto grid grid-cols-2 gap-2.5">
            <div class="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 px-3 py-3">
              <p class="text-sm font-bold text-slate-500">Mỗi trang</p>
              <p class="text-lg font-black text-slate-900 dark:text-white tabular-nums">{{ WORDS_PER_PAGE }} từ</p>
            </div>
            <div class="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 px-3 py-3">
              <p class="text-sm font-bold text-slate-500">Desktop</p>
              <p class="text-lg font-black text-slate-900 dark:text-white tabular-nums">≈ {{ WORDS_PER_PAGE * 2 }} từ</p>
            </div>
          </div>

          <button
            v-if="shelf[0]"
            type="button"
            class="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white px-4 py-3 rounded-xl text-base font-extrabold active:scale-95 transition-all duration-200 cursor-pointer"
            @click="openBook(shelf[0].id)"
          >
            <Icon name="lucide:book-open" class="w-5 h-5" />
            Mở {{ shelf[0].name }}
          </button>
        </aside>
      </div>
    </div>

    <!-- ============ BOOK VIEW ============ -->
    <div v-else class="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-6">
      <aside class="w-full lg:w-56 shrink-0 space-y-2 text-left">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-primary-400 active:scale-95 transition-all duration-200 cursor-pointer"
          @click="closeBook"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Về giá sách
        </button>

        <div v-if="bookTopics.length" class="pt-1 space-y-1.5">
          <p class="px-1 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Chủ đề ({{ bookTopics.length }})
          </p>
          <div class="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1">
            <button
              type="button"
              class="shrink-0 lg:w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
              :class="activeTopic === null
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
              @click="setTopic(null)"
            >
              Tất cả · {{ entries.length }}
            </button>
            <button
              v-for="topic in bookTopics"
              :key="topic.name"
              type="button"
              class="shrink-0 lg:w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
              :class="activeTopic === topic.name
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
              :title="topic.name"
              @click="setTopic(topic.name)"
            >
              <span class="block truncate">{{ topic.name }}</span>
              <span class="block text-xs font-semibold opacity-80 tabular-nums">{{ topic.count }} từ</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="vb-stage flex-1 min-w-0 w-full">
        <div
          ref="host"
          class="vb-host relative select-none min-h-[580px] w-full flex justify-center transition-opacity duration-300"
          :class="[
            bookVisible ? 'opacity-100' : 'opacity-0',
            coverCentered ? 'vb-host--cover-center' : '',
          ]"
          @click="onHostClick"
        />
      </div>
    </div>

    <!-- Flying ghost between shelf and viewer -->
    <div
      v-if="ghost"
      ref="ghostEl"
      class="fixed z-50 rounded-lg bg-primary-600 shadow-2xl pointer-events-none"
      :style="ghostStyle"
    />

    <!--
      PageFlip moves these nodes into its own root and clones them while flipping,
      so buttons use data-action + one delegated listener instead of Vue handlers.
      Re-key on content change AND after destroy — destroy() removes the moved
      DOM, and Vue will not recreate it unless the key changes.
    -->
    <div :key="`${signature}|${bookEpoch}`" ref="source" class="hidden" aria-hidden="true">
      <div data-density="hard" class="vb-page vb-cover bg-primary-600">
        <div class="h-full flex flex-col items-center justify-between p-8 sm:p-10 md:p-12 text-center text-white">
          <div class="flex flex-col items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/80">
            <Icon :name="isDictionary ? 'lucide:book-open' : 'lucide:book-marked'" class="w-6 h-6" />
            {{ isDictionary ? 'Kho từ điển chung' : 'Notebook cá nhân' }}
          </div>
          <div class="space-y-3">
            <h2 class="text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              {{ openedVolume?.name || (isDictionary ? 'Từ điển' : 'Sổ Từ Vựng') }}
            </h2>
            <p class="text-lg md:text-xl font-bold text-white/90">
              {{ languageLabel }}
              <span v-if="activeTopic" class="block text-base text-white/75 mt-1">{{ activeTopic }}</span>
            </p>
          </div>
          <div class="space-y-1.5 max-w-[18rem]">
            <p class="text-sm md:text-base font-extrabold text-white">
              <template v-if="activeTopic">
                {{ visibleEntries.length }} từ trong chủ đề
              </template>
              <template v-else-if="isDictionary">
                {{ entries.length }} từ đang mở
                <span v-if="totalCount" class="font-semibold text-white/80"> / {{ totalCount }} trong kho</span>
              </template>
              <template v-else>
                {{ entries.length }} từ trong sổ
              </template>
            </p>
            <p class="text-sm font-semibold text-white/75 leading-snug">
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
          <header class="flex items-baseline justify-between gap-2 pb-2 mb-1 border-b border-dashed border-stone-300">
            <p class="text-sm font-extrabold text-stone-600 truncate">
              {{ chunkTopic(chunk.words) || languageLabel }}
            </p>
            <p class="shrink-0 text-sm font-bold text-stone-500 tabular-nums">
              {{ chunk.start + 1 }}–{{ chunk.start + chunk.words.length }}
            </p>
          </header>

          <ol class="flex-1 min-h-0 flex flex-col">
            <li
              v-for="entry in chunk.words"
              :key="entry.id"
              class="flex-1 min-h-0 flex gap-2 py-1.5 border-b border-stone-200/90 last:border-0"
            >
              <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                <div class="flex items-baseline gap-2 min-w-0">
                  <span class="text-base font-black text-stone-900 truncate">
                    {{ entry.word }}
                  </span>
                  <span
                    v-if="entry.type"
                    class="shrink-0 text-sm font-bold text-stone-600"
                  >
                    {{ typeLabel(entry.type) }}
                  </span>
                  <code
                    v-if="transcriptionOf(entry)"
                    class="shrink-0 text-sm font-mono text-stone-600"
                  >
                    {{ transcriptionOf(entry) }}
                  </code>
                </div>
                <p class="text-sm font-semibold text-stone-800 line-clamp-1">
                  {{ viMeaning(entry.meaning) || '—' }}
                  <span
                    v-if="enMeaning(entry.meaning)"
                    class="font-medium text-stone-600"
                  >
                    · {{ enMeaning(entry.meaning) }}
                  </span>
                </p>
                <p
                  v-if="entry.example"
                  class="text-sm italic text-stone-700 line-clamp-1"
                >
                  {{ entry.example }}
                </p>
                <p
                  v-if="entry.note"
                  class="text-sm text-amber-800 line-clamp-1"
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

    <nav v-if="opened" class="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Điều khiển sách">
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
      v-if="opened && loading && hasMore"
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

export type VocabVolume = {
  id: string
  name: string
  count?: number
}

const props = withDefaults(defineProps<{
  entries: VocabBookEntry[]
  playingWord: string | null
  hasMore: boolean
  loading: boolean
  language: string
  variant?: 'notebook' | 'dictionary'
  totalCount?: number
  /** Full catalog size shown on the shelf, independent of the open volume. */
  stockCount?: number
  volumes?: VocabVolume[]
  /** Volume whose entries are currently loaded. `main` is the all-words book. */
  activeVolume?: string
  volumeLoading?: boolean
  notebookIds?: Record<string, boolean>
  srsWords?: Record<string, boolean>
}>(), {
  variant: 'notebook',
  totalCount: 0,
  stockCount: 0,
  volumes: () => [],
  activeVolume: 'main',
  volumeLoading: false,
  notebookIds: () => ({}),
  srsWords: () => ({}),
})

const emit = defineEmits<{
  (e: 'addBook'): void
  (e: 'openVolume', id: string): void
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

const ghostEl = ref<HTMLElement | null>(null)

const pageIndex = ref(0)
const pageCount = ref(0)
/** Landscape cover sits on the right half — nudge it to the visual center until the reader flips. */
const coverCentered = ref(false)

const opened = ref(false)
const bookVisible = ref(false)
const activeTopic = ref<string | null>(null)
const ghost = ref<{ from: DOMRect } | null>(null)
const ghostStyle = ref<Record<string, string>>({})
/** Bumped after PageFlip.destroy() so Vue remounts the hidden page templates. */
const bookEpoch = ref(0)

let book: PageFlip | null = null
let bookRoot: HTMLElement | null = null
let PageFlipCtor: typeof PageFlip | null = null
let unmounted = false
/** When set, the next signature-driven rebuild starts at this page (topic filter). */
let pendingStartPage: number | null = null

const WORDS_PER_PAGE = 8

const SPINE_TONES = [
  'from-primary-800 via-primary-700 to-primary-600',
  'from-emerald-800 via-emerald-700 to-emerald-600',
  'from-teal-800 via-teal-700 to-teal-600',
  'from-blue-800 via-blue-700 to-blue-600',
  'from-amber-800 via-amber-700 to-amber-600',
  'from-stone-700 via-stone-600 to-stone-500',
  'from-slate-700 via-slate-600 to-slate-500',
]

const BOARD_TONES = [
  'bg-primary-600 border-primary-800/50 group-hover:bg-primary-500',
  'bg-emerald-700 border-emerald-900/40 group-hover:bg-emerald-600',
  'bg-teal-700 border-teal-900/40 group-hover:bg-teal-600',
  'bg-blue-700 border-blue-900/40 group-hover:bg-blue-600',
  'bg-amber-700 border-amber-900/40 group-hover:bg-amber-600',
  'bg-stone-600 border-stone-800/50 group-hover:bg-stone-500',
  'bg-slate-600 border-slate-800/50 group-hover:bg-slate-500',
]

const isDictionary = computed(() => props.variant === 'dictionary')
const languageLabel = computed(() => (props.language === 'cs' ? 'Tiếng Séc' : 'Tiếng Đức'))

const shelfSteps = computed(() => [
  {
    title: 'Chọn gáy sách',
    body: isDictionary.value
      ? 'Cuốn Tất cả giữ nguyên kho chung. A1 đến C2 chỉ chứa từ đúng trình độ đó.'
      : 'Mở sổ cá nhân trên giá để xem từ đã lưu.',
  },
  {
    title: 'Lật như sách giấy',
    body: 'Kéo góc trang, vuốt, hoặc dùng phím ← → / nút Trước–Sau.',
  },
  {
    title: isDictionary.value ? 'Lưu sổ hoặc thêm SRS' : 'Sửa / xóa ngay trong trang',
    body: isDictionary.value
      ? 'Nút xanh dương lưu sổ; nút emerald đưa vào lịch ôn.'
      : 'Chỉnh nghĩa và ghi chú mà không rời trang sách.',
  },
])

const hasVolumes = computed(() => props.volumes.length > 0)

const shelf = computed(() => {
  if (hasVolumes.value) return props.volumes
  return [
    {
      id: 'main',
      name: isDictionary.value ? 'Từ điển' : 'Sổ từ vựng',
      count: props.totalCount || props.entries.length,
    },
  ]
})

const openedVolumeId = ref('main')
const requestedId = ref<string | null>(null)

const openedVolume = computed(() =>
  shelf.value.find(item => item.id === openedVolumeId.value) || shelf.value[0],
)

const bookTopics = computed(() => {
  const counts = new Map<string, number>()
  for (const e of props.entries) {
    if (!e.topicName) continue
    counts.set(e.topicName, (counts.get(e.topicName) || 0) + 1)
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
})

const visibleEntries = computed(() =>
  activeTopic.value === null ? props.entries : props.entries.filter(e => e.topicName === activeTopic.value),
)

const wordPages = computed(() => {
  const pages: { start: number, words: VocabBookEntry[] }[] = []
  for (let i = 0; i < visibleEntries.value.length; i += WORDS_PER_PAGE) {
    pages.push({ start: i, words: visibleEntries.value.slice(i, i + WORDS_PER_PAGE) })
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

const signature = computed(() => `${props.variant}|${visibleEntries.value.map(e => e.id).join(',')}|${props.hasMore ? 1 : 0}`)

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
  updateCoverCentering('read')
  prefetchIfNeeded()
}

/** In landscape, PageFlip parks the cover on the right half of a 2-page stage. Shift that stage so the cover sits centered; restore when flipping into a spread. */
const updateCoverCentering = (state: string = 'read') => {
  if (!book || !host.value) {
    coverCentered.value = false
    return
  }
  const onFrontCover = book.getCurrentPageIndex() === 0
  const landscape = book.getOrientation() === 'landscape'
  const idle = state === 'read'
  const should = onFrontCover && landscape && idle && bookVisible.value
  coverCentered.value = should
  if (!should) {
    host.value.style.removeProperty('--vb-cover-nudge')
    return
  }
  const coverEl = host.value.querySelector('.vb-cover') as HTMLElement | null
  const w = coverEl?.offsetWidth || 420
  host.value.style.setProperty('--vb-cover-nudge', `${-Math.round(w / 2)}px`)
}

const prefetchIfNeeded = () => {
  // A topic filter shows a slice of what is already loaded — paging it would fetch forever.
  if (activeTopic.value !== null) return
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
  if (unmounted || !opened.value || !PageFlipCtor || !host.value || !source.value) return
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
    maxShadowOpacity: 0.62,
    mobileScrollSupport: false,
    disableFlipByClick: true,
    // Hover-fold covers the last row (corner is ~diagonal/5). Buttons stay clickable;
    // turning still works by dragging the corner, the pager, or ← →.
    showPageCorners: false,
    startPage: Math.min(startPage, pages.length - 1),
  })
  book.on('flip', syncState)
  book.on('init', syncState)
  book.on('changeOrientation', syncState)
  book.on('changeState', (e) => {
    updateCoverCentering(String(e.data ?? 'read'))
  })
  book.loadFromHTML(pages)
  syncState()
}

/** Destroy PageFlip, remount Vue page templates, then init again. */
const rebuildAt = async (startPage = 0) => {
  teardown()
  bookEpoch.value += 1
  await nextTick()
  build(startPage)
}

watch(signature, () => {
  if (!opened.value) return
  const keep = pendingStartPage ?? book?.getCurrentPageIndex() ?? 0
  pendingStartPage = null
  void rebuildAt(keep)
})

const FLY_MS = 520

/** Fly a stand-in from the clicked spine to where the cover will land, then reveal the real book. */
const revealBook = async (id: string) => {
  if (opened.value || unmounted) return
  openedVolumeId.value = id
  const spine = section.value?.querySelector<HTMLElement>(`[data-spine="${id}"]`)
  const from = spine?.getBoundingClientRect()
  const reduced = prefersReducedMotion()

  opened.value = true
  bookVisible.value = reduced || !from
  await nextTick()
  // Source must have fresh DOM — closeBook / prior rebuilds bump bookEpoch for that.
  if (!source.value?.children.length) {
    bookEpoch.value += 1
    await nextTick()
  }
  build(0)

  if (reduced || !from || !host.value) {
    bookVisible.value = true
    updateCoverCentering('read')
    return
  }

  const to = host.value.getBoundingClientRect()
  // PageFlip renders a single portrait page ~420x580 centred in the host.
  const h = Math.min(580, to.height || 580)
  const w = h * (420 / 580)
  ghost.value = { from }
  ghostStyle.value = {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    transformOrigin: 'top left',
  }
  await nextTick()
  const el = ghostEl.value
  if (!el) {
    bookVisible.value = true
    ghost.value = null
    updateCoverCentering('read')
    return
  }
  el.getBoundingClientRect()
  el.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${FLY_MS}ms ease`
  el.style.transform = `translate(${to.left + (to.width - w) / 2 - from.left}px, ${to.top + (to.height - h) / 2 - from.top}px) scale(${w / from.width}, ${h / from.height})`

  window.setTimeout(() => {
    bookVisible.value = true
    ghost.value = null
    updateCoverCentering('read')
  }, FLY_MS)
}

const openBook = async (id: string) => {
  if (opened.value) return
  if (!hasVolumes.value) {
    await revealBook(id)
    return
  }
  requestedId.value = id
  emit('openVolume', id)
  const current = props.activeVolume || 'main'
  if (current === id && !props.volumeLoading) {
    requestedId.value = null
    await revealBook(id)
  }
}

watch([() => props.activeVolume, () => props.volumeLoading], async ([id, loading]) => {
  const current = id || 'main'
  if (!requestedId.value) {
    if (opened.value && current !== openedVolumeId.value) openedVolumeId.value = current
    return
  }
  if (loading) return
  if (current !== requestedId.value) {
    requestedId.value = null
    return
  }
  const openId = requestedId.value
  requestedId.value = null
  await revealBook(openId)
})

const closeBook = () => {
  teardown()
  bookEpoch.value += 1
  opened.value = false
  bookVisible.value = false
  coverCentered.value = false
  activeTopic.value = null
  pageIndex.value = 0
  pageCount.value = 0
  pendingStartPage = null
}

const setTopic = (name: string | null) => {
  if (activeTopic.value === name) return
  // Prefer cover / first spread after filtering; signature watch runs rebuildAt.
  pendingStartPage = Math.min(book?.getCurrentPageIndex() ?? 0, 1)
  activeTopic.value = name
}

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
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('keydown', onKeydown)
  teardown()
})
</script>

<style scoped>
.vb-shelf {
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgb(255 248 230 / 0.7), transparent 58%),
    linear-gradient(180deg, #f7f1e6 0%, #efe4d2 68%, #e4d3b8 100%);
  border: 1px solid rgb(92 64 28 / 0.16);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.8),
    0 22px 36px -26px rgb(62 38 12 / 0.55);
}

:global(html.dark .vb-shelf) {
  background:
    radial-gradient(ellipse 70% 42% at 50% 0%, rgb(59 166 118 / 0.12), transparent 55%),
    linear-gradient(180deg, #2c261f 0%, #1b1713 70%, #120f0c 100%);
  border-color: rgb(255 236 210 / 0.08);
  box-shadow:
    inset 0 1px 0 rgb(255 236 210 / 0.06),
    0 26px 44px -22px rgb(0 0 0 / 0.75);
}

.vb-stock {
  background: rgb(255 250 242 / 0.82);
  border: 1px solid rgb(92 64 28 / 0.14);
  box-shadow: 0 8px 16px -12px rgb(62 38 12 / 0.45);
}

:global(html.dark .vb-stock) {
  background: rgb(20 16 12 / 0.72);
  border-color: rgb(255 236 210 / 0.1);
  box-shadow: 0 10px 18px -12px rgb(0 0 0 / 0.6);
}

.vb-add {
  color: rgb(92 64 28 / 0.62);
  border-color: rgb(92 64 28 / 0.28);
  background: rgb(255 248 236 / 0.35);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.4);
}

:global(html.dark .vb-add) {
  color: rgb(232 214 186 / 0.7);
  border-color: rgb(232 214 186 / 0.28);
  background: rgb(255 236 210 / 0.04);
}

/* The plank the spines stand on. */
.vb-plank {
  position: relative;
  z-index: 2;
  height: 22px;
  margin-top: -8px;
  border-radius: 0 0 1rem 1rem;
  background: linear-gradient(180deg, #f0c27a 0%, #c47a2c 16%, #8a4b16 58%, #5c3010 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 236 190 / 0.65),
    0 12px 16px -8px rgb(48 24 6 / 0.45);
}

:global(html.dark .vb-plank) {
  background: linear-gradient(180deg, #b4783c 0%, #6e3f18 38%, #3a2414 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 214 150 / 0.28),
    0 14px 18px -8px rgb(0 0 0 / 0.7);
}

.vb-featured {
  transform-origin: bottom center;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(8px 16px 10px rgb(48 28 8 / 0.32));
}

:global(html.dark .vb-featured) {
  filter: drop-shadow(10px 18px 12px rgb(0 0 0 / 0.55));
}

.vb-board {
  background-image:
    linear-gradient(155deg, rgb(255 255 255 / 0.2), transparent 38%),
    linear-gradient(90deg, rgb(0 0 0 / 0.22), transparent 14%);
  box-shadow:
    inset -16px 0 18px -14px rgb(0 0 0 / 0.35),
    inset 0 1px 0 rgb(255 255 255 / 0.2);
}

:global(html.dark .vb-board) {
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08),
    inset -16px 0 18px -12px rgb(0 0 0 / 0.5),
    inset 0 1px 0 rgb(255 255 255 / 0.16);
}

.vb-featured:hover {
  transform: translateY(-10px);
}

.vb-featured:active {
  transform: translateY(-4px) scale(0.99);
}

.vb-spine-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .vb-featured,
  .vb-featured:hover,
  .vb-featured:active {
    transition: none;
    transform: none;
  }
}

.vb-page {
  overflow: hidden;
}

.vb-stage {
  border-radius: 1.75rem;
  padding: 1.25rem 0.75rem 1.75rem;
  background:
    radial-gradient(ellipse 46% 18% at 50% 94%, rgb(72 42 12 / 0.22), transparent 72%),
    linear-gradient(180deg, #f8f2e6, #e7d8c2);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.75),
    0 18px 32px -24px rgb(52 32 10 / 0.5);
}

:global(html.dark .vb-stage) {
  background:
    radial-gradient(ellipse 46% 18% at 50% 94%, rgb(0 0 0 / 0.55), transparent 72%),
    linear-gradient(180deg, #26211b, #14110e);
  box-shadow:
    inset 0 1px 0 rgb(255 236 210 / 0.05),
    0 22px 36px -16px rgb(0 0 0 / 0.7);
}

/* Paper stays cream in both themes so the open book reads against the desk. */
.vb-paper {
  background-color: #fbf6ec;
  background-image:
    linear-gradient(180deg, rgb(255 255 255 / 0.65), transparent 14%);
  border: 1px solid rgb(120 90 40 / 0.16);
  color: #1c1917;
}

.vb-page.--left {
  box-shadow:
    inset -16px 0 22px -14px rgb(62 38 12 / 0.28),
    -8px 18px 22px -8px rgb(28 16 4 / 0.38);
}

.vb-page.--right {
  box-shadow:
    inset 16px 0 22px -14px rgb(62 38 12 / 0.28),
    10px 18px 22px -8px rgb(28 16 4 / 0.38);
}

:global(html.dark .vb-page.--left) {
  box-shadow:
    inset -16px 0 22px -14px rgb(62 38 12 / 0.22),
    -10px 22px 26px -6px rgb(0 0 0 / 0.72);
}

:global(html.dark .vb-page.--right) {
  box-shadow:
    inset 16px 0 22px -14px rgb(62 38 12 / 0.22),
    12px 22px 26px -6px rgb(0 0 0 / 0.72);
}

.vb-cover {
  background-image:
    linear-gradient(145deg, rgb(255 255 255 / 0.2), transparent 36%),
    linear-gradient(to right, rgb(0 0 0 / 0.28), transparent 10%),
    linear-gradient(to left, rgb(0 0 0 / 0.16), transparent 8%);
  border-radius: 0.35rem 0.7rem 0.7rem 0.35rem;
  box-shadow:
    inset -18px 0 20px -16px rgb(0 0 0 / 0.4),
    inset 0 1px 0 rgb(255 255 255 / 0.18),
    12px 22px 26px -6px rgb(16 40 24 / 0.45);
}

:global(html.dark .vb-cover) {
  box-shadow:
    inset -18px 0 20px -16px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.22),
    14px 26px 32px -4px rgb(0 0 0 / 0.75);
}

/*
  Landscape + showCover parks page 0 on the right half of a 2-page stage.
  Nudge the stage left by half a page so the cover sits visually centered.
  Removed while flipping so the open-book geometry stays correct.
*/
.vb-host--cover-center :deep(.stf__parent) {
  transform: translateX(var(--vb-cover-nudge, 0px));
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .vb-host--cover-center :deep(.stf__parent) {
    transition: none;
  }
}

/* PageFlip starts a drag when mousedown lands on anything that is not an <a>/<button>. */
.vb-page [data-action] * {
  pointer-events: none;
}
</style>
