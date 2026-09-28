<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
    <!-- Soft atmosphere -->
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-600/10" />
      <div class="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
    </div>

    <div class="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 text-left">
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-extrabold uppercase tracking-wider">
              <Icon name="lucide:book-marked" class="w-3.5 h-3.5" />
              Notebook cá nhân
            </span>
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
              {{ totalCount }} từ đã lưu
            </span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sổ Từ Vựng
          </h1>
          <p class="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Từ đã lưu từ
            <NuxtLink to="/dictionary" class="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Từ điển</NuxtLink>
            hoặc tự thêm. Ôn lặp tại
            <NuxtLink to="/review" class="text-primary-600 dark:text-primary-400 font-semibold hover:underline">SRS</NuxtLink>.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <NuxtLink
            to="/dictionary"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold hover:border-primary-400 hover:text-primary-700 transition-colors"
          >
            <Icon name="lucide:book-open" class="w-4 h-4" />
            Từ điển
          </NuxtLink>
          <button
            type="button"
            :disabled="loading"
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-sm shadow-primary-500/20 transition-all disabled:opacity-50"
            @click="toggleForm"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            {{ editing ? 'Đang sửa…' : 'Thêm từ thủ công' }}
          </button>
        </div>
      </header>

      <!-- Compact toolbar -->
      <div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 sm:p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2.5 items-end">
          <label class="block text-left">
            <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Ngôn ngữ</span>
            <select
              v-model="selectedLanguage"
              :disabled="loading"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary-500"
            >
              <option value="de">🇩🇪 Tiếng Đức</option>
              <option value="cs">🇨🇿 Tiếng Séc</option>
            </select>
          </label>

          <label class="block text-left">
            <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Cấp độ</span>
            <select
              v-model="selectedLevel"
              :disabled="loading"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </label>

          <label class="block text-left">
            <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Nguồn</span>
            <select
              v-model="selectedSource"
              :disabled="loading"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả</option>
              <option value="dictionary">Từ điển</option>
              <option value="manual">Tự thêm</option>
            </select>
          </label>

          <label class="block text-left">
            <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Ngày lưu</span>
            <select
              v-model="selectedDate"
              :disabled="loading"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="last_3_days">3 ngày qua</option>
              <option value="this_week">Tuần này</option>
            </select>
          </label>

          <div class="col-span-2 flex items-end gap-2">
            <label class="block flex-1 text-left">
              <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Tìm kiếm</span>
              <div class="relative">
                <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="search"
                  :disabled="loading"
                  type="text"
                  placeholder="Tìm trong sổ…"
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-primary-500"
                  @keyup.enter="triggerSearch"
                />
              </div>
            </label>
            <button
              type="button"
              class="h-[38px] w-[38px] shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
              title="Làm mới"
              @click="fetchVocabularies(true)"
            >
              <Icon name="lucide:rotate-cw" :class="['w-4 h-4', loading ? 'animate-spin' : '']" />
            </button>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm font-bold text-slate-500">
            Hiển thị
            <span class="text-primary-600 dark:text-primary-400">{{ currentTotal }}</span>
            /
            {{ totalCount }} từ
          </span>
          <div
            class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
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
              @click="viewMode = opt.value"
            >
              <Icon :name="opt.icon" class="w-4 h-4" />
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content + drawer -->
      <div class="relative flex gap-5 items-start">
        <div class="flex-1 min-w-0 space-y-3">
          <div v-if="initialLoading && entries.length === 0" class="py-20 text-center">
            <LayoutPageLoading />
          </div>

          <div
            v-else-if="!loading && entries.length === 0"
            class="rounded-2xl border border-dashed border-primary-300/60 dark:border-primary-800 bg-gradient-to-br from-primary-50/80 via-white to-blue-50/40 dark:from-slate-900 dark:to-slate-950 px-6 py-14 text-center space-y-4"
          >
            <div class="w-14 h-14 mx-auto rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/25">
              <Icon name="lucide:book-marked" class="w-7 h-7" />
            </div>
            <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">
              Sổ còn trống
            </h3>
            <p class="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
              Lưu từ từ Từ điển (nút xanh dương) hoặc thêm thủ công tại đây.
            </p>
            <div class="flex flex-wrap justify-center gap-3 pt-1">
              <NuxtLink
                to="/dictionary"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-400"
              >
                <Icon name="lucide:book-open" class="w-4 h-4" />
                Mở Từ điển
              </NuxtLink>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200"
                @click="toggleForm"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                Thêm thủ công
              </button>
            </div>
          </div>

          <AwesomeVocabBook
            v-else-if="viewMode === 'book'"
            :entries="entries"
            :playing-word="playingWord"
            :has-more="hasMore"
            :loading="loading"
            :language="selectedLanguage"
            @play="(v) => playAudioOrSpeak({ ...v, audioUrl: v.vocabularyWord?.audioUrl, pronunciation: v.vocabularyWord?.pronunciation, lang: v.language || selectedLanguage })"
            @edit="editVocabulary"
            @delete="deleteVocabulary"
            @load-more="loadMoreVocabularies"
          />

          <!-- Card grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            <LayoutPageSectionVocabulariesVocabItem
              v-for="entry in entries"
              :key="entry.id"
              :vocab="entry"
              :playing-word="playingWord"
              :error-message="errorMessageVocab || errorMessageForm || errorMessageAudio"
              :show-edit-button="true"
              :show-delete-button="true"
              @play-audio-or-speak="(v) => playAudioOrSpeak({ ...v, lang: v.language || selectedLanguage })"
              @edit-vocabulary="editVocabulary"
              @delete-vocabulary="deleteVocabulary"
            />
          </div>

          <div v-if="hasMore && entries.length > 0 && viewMode === 'grid'" class="pt-2 text-center">
            <button
              type="button"
              class="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-800 dark:text-slate-100 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50"
              :disabled="loading"
              @click="loadMoreVocabularies"
            >
              Tải thêm từ
              <Icon name="lucide:chevron-down" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Side form panel -->
        <aside
          class="hidden lg:block shrink-0 sticky top-20 transition-all duration-300"
          :class="isFormOpen ? 'w-[22rem] opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none'"
        >
          <div class="w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-900/5 p-5 space-y-4 text-left">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">
                {{ editing ? (form.source === 'dictionary' ? 'Sửa ghi chú' : 'Sửa từ') : 'Thêm từ thủ công' }}
              </h3>
              <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeForm">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <p
              v-if="editing && form.source === 'dictionary'"
              class="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-2 leading-relaxed"
            >
              Từ Từ điển — chỉ sửa nghĩa hiển thị & ghi chú, không đổi kho hệ thống.
            </p>

            <form class="space-y-3" @submit.prevent="saveVocabulary">
              <div>
                <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Từ *</label>
                <input
                  v-model="form.word"
                  :disabled="editing && form.source === 'dictionary'"
                  class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary-500 disabled:opacity-60"
                  required
                />
              </div>
              <div>
                <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Nghĩa VI *</label>
                <input
                  v-model="viMeaning"
                  class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Nghĩa EN</label>
                <input
                  v-model="enMeaning"
                  class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Ghi chú</label>
                <textarea
                  v-model="form.note"
                  rows="2"
                  placeholder="Mẹo nhớ…"
                  class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary-500"
                />
              </div>

              <template v-if="!(editing && form.source === 'dictionary')">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Loại</label>
                    <select v-model="form.type" class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-2 py-2 text-xs font-bold">
                      <option value="Noun">Noun</option>
                      <option value="Verb">Verb</option>
                      <option value="Adjective">Adjective</option>
                      <option value="Adverb">Adverb</option>
                      <option value="Phrase">Phrase</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Cấp</label>
                    <select v-model="form.level" class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-2 py-2 text-xs font-bold">
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Ví dụ</label>
                  <textarea
                    v-model="form.example"
                    rows="2"
                    class="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </template>

              <p v-if="errorMessageForm" class="text-xs text-red-500 font-semibold">{{ errorMessageForm }}</p>

              <div class="flex gap-2 pt-1">
                <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-400 text-white py-2.5 rounded-xl text-xs font-extrabold">
                  {{ editing ? 'Cập nhật' : 'Thêm vào sổ' }}
                </button>
                <button
                  v-if="editing"
                  type="button"
                  class="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800"
                  @click="cancelEdit"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>

    <!-- Mobile form sheet -->
    <div
      v-if="isFormOpen"
      class="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      @click.self="closeForm"
    >
      <div class="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-left shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold">{{ editing ? 'Sửa' : 'Thêm từ thủ công' }}</h3>
          <button type="button" class="p-1.5" @click="closeForm">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
        <form class="space-y-3" @submit.prevent="saveVocabulary">
          <input
            v-model="form.word"
            :disabled="editing && form.source === 'dictionary'"
            placeholder="Từ *"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold"
            required
          />
          <input
            v-model="viMeaning"
            placeholder="Nghĩa tiếng Việt *"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold"
            required
          />
          <input
            v-model="enMeaning"
            placeholder="Nghĩa tiếng Anh"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold"
          />
          <textarea
            v-model="form.note"
            rows="2"
            placeholder="Ghi chú"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <button type="submit" class="w-full bg-primary-500 text-white py-3 rounded-xl text-sm font-extrabold">
            {{ editing ? 'Cập nhật' : 'Thêm vào sổ' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAudioPlayback } from 'composables/vocab/use-audio-playback'
import { useVocabularyForm } from 'composables/vocab/use-vocab-form'
import { useVocabulary } from 'composables/vocab/use-vocabulary'

definePageMeta({ layout: 'page', ssr: false })
useHead({ title: 'Sổ Từ Vựng Cá Nhân - Sprech Mit Uns' })

const {
  entries,
  selectedLevel,
  selectedLanguage,
  selectedSource,
  search,
  selectedDate,
  errorMessage: errorMessageVocab,
  fetchVocabularies,
  loadMoreVocabularies,
  deleteVocabulary,
  loading,
  initialLoading,
  hasMore,
  triggerSearch,
  currentTotal,
  totalCount,
} = useVocabulary()

const {
  form,
  viMeaning,
  enMeaning,
  editing,
  isFormOpen,
  errorMessage: errorMessageForm,
  toggleForm,
  closeForm,
  saveVocabulary,
  editVocabulary,
  cancelEdit,
} = useVocabularyForm()

const {
  playingWord,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()

type VocabViewMode = 'grid' | 'book'
const VIEW_STORAGE_KEY = 'smu-vocab-view'
const viewOptions: { value: VocabViewMode, label: string, icon: string }[] = [
  { value: 'grid', label: 'Thẻ', icon: 'lucide:layout-grid' },
  { value: 'book', label: 'Sách', icon: 'lucide:book-open' },
]
const viewMode = ref<VocabViewMode>('grid')

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }
  catch {}
})

onMounted(async () => {
  try {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === 'book') viewMode.value = 'book'
  }
  catch {}
  await fetchVocabularies(true)
})
</script>
