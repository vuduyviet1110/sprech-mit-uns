<template>
  <LayoutPageWrapper>
    <!-- Loading chính cho toàn bộ trang -->
    <LayoutPageLoading v-if="initialLoading && vocabularies.length === 0" />

    <div v-else class="mx-auto p-4 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      <h1 class="text-3xl font-bold mb-6 text-center text-slate-800 dark:text-white">
        Danh sách từ vựng
      </h1>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 mb-6">
        <div
          class="flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <label for="language" class="text-sm font-medium text-slate-700 dark:text-slate-300"
                >Ngôn ngữ:</label
              >
              <select
                v-model="selectedLanguage"
                :disabled="loading"
                class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả</option>
                <option value="de">Tiếng Đức 🇩🇪</option>
                <option value="cs">Tiếng Séc 🇨🇿</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label for="level" class="text-sm font-medium text-slate-700 dark:text-slate-300"
                >Lọc theo cấp độ:</label
              >
              <select
                v-model="selectedLevel"
                :disabled="loading"
                class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label for="level" class="text-sm font-medium text-slate-700 dark:text-slate-300"
                >Theo Ngày:</label
              >
              <select
                v-model="selectedDate"
                :disabled="loading"
                class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="last_3_days">3 ngày qua</option>
                <option value="this_week">Tuần này</option>
              </select>
            </div>
          </div>

          <div class="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Hiển thị: {{ currentTotal }} / {{ totalCount }}
            <span v-if="loading" class="ml-2 text-primary-500 font-bold">Đang tải...</span>
          </div>
        </div>
      </div>

      <div class="flex gap-6 items-start">
        <div class="transition-all duration-300 ease-in-out flex-1 min-w-0">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-slate-800 dark:text-white">
                Danh sách từ vựng
                <Icon
                  name="tabler:refresh"
                  :class="[
                    'cursor-pointer hover:scale-120 transition w-5 h-5 inline-block ml-2 text-primary-500',
                    loading ? 'animate-spin opacity-50' : '',
                  ]"
                  @click="fetchVocabularies(true)"
                />
              </h2>
              <div class="flex items-center gap-4">
                <div
                  class="flex items-center border rounded-lg p-1 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary-500 transition"
                >
                  <input
                    v-model="search"
                    :disabled="loading"
                    type="text"
                    placeholder="Tìm kiếm..."
                    class="bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none p-2 text-sm disabled:opacity-50"
                    @keyup.enter="triggerSearch"
                  />
                  <button
                    class="p-1 text-slate-500 dark:text-slate-400 hover:text-primary-500"
                    :disabled="loading"
                    @click="triggerSearch"
                  >
                    <Icon
                      name="material-symbols:search-rounded"
                      class="w-6 h-6 inline-block"
                    />
                  </button>
                </div>

                <button
                  :disabled="loading"
                  class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  @click="toggleForm"
                >
                  <span>{{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}</span>
                  <Icon
                    :name="
                      isFormOpen ? 'tabler:chevron-right' : 'tabler:chevron-left'
                    "
                    class="w-4 h-4 transition-transform"
                  />
                </button>
              </div>
            </div>

            <!-- Loading overlay cho danh sách -->
            <div class="relative">
              <div
                v-if="loading && vocabularies.length === 0"
                class="p-8 text-center"
              >
                <div class="flex justify-center items-center space-x-2">
                  <div
                    class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"
                  ></div>
                  <span class="text-slate-600 dark:text-slate-400">Đang tải từ vựng...</span>
                </div>
              </div>

              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4"
              >
                <LayoutPageSectionVocabulariesVocabItem
                  v-for="vocab in vocabularies"
                  :key="vocab.id || vocab.word"
                  :vocab="vocab"
                  :playing-word="playingWord"
                  :error-message="
                    errorMessageVocab || errorMessageForm || errorMessageAudio
                  "
                  :show-edit-button="true"
                  :show-delete-button="true"
                  @play-audio-or-speak="playAudioOrSpeak"
                  @edit-vocabulary="editVocabulary"
                  @delete-vocabulary="deleteVocabulary"
                />
              </div>

              <!-- Loading cho load more -->
              <div v-if="loadingMore" class="p-4 text-center">
                <div class="flex justify-center items-center space-x-2">
                  <div
                    class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"
                  ></div>
                  <span class="text-slate-600 dark:text-slate-400">Đang tải thêm...</span>
                </div>
              </div>

              <div
                v-else-if="hasMore && vocabularies.length > 0"
                class="p-4 text-center"
              >
                <button
                  class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="loading"
                  @click="loadMoreVocabularies"
                >
                  Tải thêm
                </button>
              </div>

              <div
                v-else-if="vocabularies.length > 0"
                class="p-4 text-center text-slate-500 dark:text-slate-400"
              >
                Đã tải hết tất cả từ vựng
              </div>

              <div
                v-else-if="!loading"
                class="p-6 my-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto"
              >
                <p class="text-lg font-medium text-slate-700 dark:text-slate-300">
                  Không tìm thấy từ vựng nào phù hợp với:
                </p>
                <div
                  class="my-2 flex flex-wrap justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <span
                    v-if="selectedLanguage"
                    class="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full"
                  >
                    Ngôn ngữ: {{ selectedLanguage === 'de' ? 'Tiếng Đức 🇩🇪' : 'Tiếng Séc 🇨🇿' }}
                  </span>
                  <span
                    v-if="selectedLevel"
                    class="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 rounded-full"
                  >
                    Cấp độ: {{ selectedLevel }}
                  </span>
                  <span
                    v-if="selectedDate"
                    class="inline-flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full"
                  >
                    Ngày: {{ selectedDate }}
                  </span>
                  <span
                    v-if="search"
                    class="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-full"
                  >
                    Tìm kiếm: {{ search }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Phần form collapse sang phải -->
        <div
          class="transition-all duration-300 ease-in-out sticky top-20 self-start"
          :class="isFormOpen ? 'w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none'"
        >
          <div class="w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-slate-800 dark:text-white">
                {{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}
              </h2>
              <button
                type="button"
                class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                @click="closeForm"
              >
                <Icon name="tabler:x" class="w-5 h-5" />
              </button>
            </div>
              <form class="p-4 space-y-4" @submit.prevent="saveVocabulary">
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      for="word"
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >Từ *</label
                    >
                    <input
                      id="word"
                      v-model="form.word"
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      class="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      <Icon name="twemoji:flag-vietnam" class="w-4 h-4 shrink-0 shadow-2xs" />
                      <span>Nghĩa tiếng Việt *</span>
                    </label>
                    <input
                      v-model="viMeaning"
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ví dụ: gặp đôi"
                      required
                    />
                  </div>
                  <div>
                    <label
                      class="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      <Icon name="twemoji:flag-united-kingdom" class="w-4 h-4 shrink-0 shadow-2xs" />
                      <span>Nghĩa tiếng Anh</span>
                    </label>
                    <input
                      v-model="enMeaning"
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ví dụ: dvojnásobný / double"
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        for="type"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >Loại từ *</label
                      >
                      <select
                        id="type"
                        v-model="form.type"
                        class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="noun">Noun</option>
                        <option value="verb">Verb</option>
                        <option value="adjective">Adjective</option>
                        <option value="interjection">Interjection</option>
                        <option value="preposition">Preposition</option>
                      </select>
                    </div>
                    <div>
                      <label
                        for="level"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >Cấp độ *</label
                      >
                      <select
                        id="level"
                        v-model="form.level"
                        class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      for="example"
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >Ví dụ</label
                    >
                    <textarea
                      id="example"
                      v-model="form.example"
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="2"
                    ></textarea>
                  </div>
                  <div>
                    <label
                      for="transcription"
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >Phiên âm</label
                    >
                    <input
                      id="transcription"
                      v-model="form.transcription"
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label
                      for="topics"
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >Topics</label
                    >
                    <select
                      id="topics"
                      v-model="form.topics"
                      multiple
                      class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-24"
                    >
                      <option
                        v-for="topic in topics"
                        :key="topic.id"
                        :value="topic.id"
                      >
                        {{ topic.name }}
                      </option>
                    </select>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label
                        for="audioUrl"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >URL âm thanh</label
                      >
                      <input
                        id="audioUrl"
                        v-model="form.audioUrl"
                        class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label
                        for="imageUrl"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >URL hình ảnh</label
                      >
                      <input
                        id="imageUrl"
                        v-model="form.imageUrl"
                        class="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 pt-4">
                  <button
                    type="submit"
                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-xs"
                  >
                    {{ editing ? 'Cập nhật' : 'Thêm' }}
                  </button>
                  <button
                    v-if="editing"
                    type="button"
                    class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-xs"
                    @click="cancelEdit"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  </LayoutPageWrapper>
</template>

<script lang="ts" setup>
import { useAudioPlayback } from 'composables/vocab/use-audio-playback'
import { useVocabularyForm } from 'composables/vocab/use-vocab-form'
import { useVocabulary } from 'composables/vocab/use-vocabulary'
import { useHead } from '#app'

definePageMeta({ layout: 'page', ssr: false })
useHead({ title: 'Danh sách từ vựng' })

const {
  vocabularies,
  selectedLevel,
  selectedLanguage,
  search,
  selectedDate,
  errorMessage: errorMessageVocab,
  fetchVocabularies,
  loadMoreVocabularies,
  deleteVocabulary,
  loading,
  loadingMore,
  initialLoading,
  hasMore,
  triggerSearch,
  currentTotal,
  totalCount,
} = useVocabulary()

const topics = ref<{ id: string; name: string }[]>([])

async function fetchTopics() {
  const response = await useFetch(() => `/api/dictionary/topic?lang=${selectedLanguage.value}`)
  if (response.data.value) {
    topics.value = response.data.value as { id: string; name: string }[]
  }
}

watch(selectedLanguage, () => {
  fetchTopics()
})

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

onMounted(async () => {
  await Promise.all([fetchVocabularies(true), fetchTopics()])
})
</script>
