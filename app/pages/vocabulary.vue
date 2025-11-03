<template>
  <LayoutPageWrapper>
    <LayoutPageLoading v-if="loading" />
    <div v-else class="mx-auto p-4">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
        Danh sách từ vựng tiếng Đức
      </h1>

      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div
          class="flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <label for="level" class="text-sm font-medium text-gray-700"
              >Lọc theo cấp độ:</label
            >
            <select
              v-model="selectedLevel"
              class="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-0"
            >
              <option value="">Tất cả</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>
            <label for="level" class="text-sm font-medium text-gray-700"
              >Theo Ngày:</label
            >
            <select
              v-model="selectedDate"
              class="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-0"
            >
              <option value="">Date</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_3_days">last 3 days</option>
              <option value="this_week">this week</option>
            </select>
          </div>

          <div class="text-sm text-gray-600">
            Hiển thị: {{ currentTotal }} / {{ totalCount }}
          </div>
        </div>
      </div>

      <Disclosure v-slot="{ open }">
        <div class="flex gap-6">
          <div class="transition-all duration-300 ease-in-out">
            <div class="bg-white rounded-lg shadow-sm">
              <div class="p-4 border-b flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-800">
                  Danh sách từ vựng
                  <Icon
                    name="tabler:refresh"
                    class="cursor-pointer hover:scale-120 transition w-5 h-5 inline-block ml-2"
                    @click="fetchVocabularies(true)"
                  />
                </h2>
                <div class="flex items-center gap-4">
                  <div
                    class="flex items-center border rounded-lg p-1 border-gray-300 hover:border-blue-500 transition"
                  >
                    <input
                      v-model="search"
                      type="text"
                      placeholder="Tìm kiếm"
                      class="focus:outline-none p-2"
                      @keyup.enter="triggerSearch"
                    />
                    <button class="p-1" @click="triggerSearch">
                      <Icon
                        name="material-symbols:search-rounded"
                        class="w-8 h-8 inline-block"
                      />
                    </button>
                  </div>

                  <!-- Nút toggle form -->
                  <DisclosureButton
                    class="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <span>{{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}</span>
                    <Icon
                      :name="
                        open ? 'tabler:chevron-right' : 'tabler:chevron-left'
                      "
                      class="w-4 h-4 transition-transform"
                    />
                  </DisclosureButton>
                </div>
              </div>
              <div>
                <div
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
                <div v-if="hasMore" class="p-4 text-center">
                  <button
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    :disabled="loading"
                    @click="loadMoreVocabularies"
                  >
                    {{ loading ? 'Đang tải...' : 'Tải thêm' }}
                  </button>
                </div>
                <div
                  v-else-if="vocabularies.length > 0"
                  class="p-4 text-center text-gray-600"
                >
                  Đã tải hết tất cả từ vựng
                </div>
                <div
                  v-else
                  class="p-6 my-4 text-center bg-white max-w-2xl mx-auto"
                >
                  <p class="text-lg font-medium text-gray-700">
                    Không tìm thấy từ vựng nào phù hợp với:
                  </p>
                  <div
                    class="my-2 flex flex-wrap justify-center gap-2 text-sm text-gray-600"
                  >
                    <span
                      v-if="selectedLevel"
                      class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      Cấp độ: {{ selectedLevel }}
                    </span>
                    <span
                      v-if="selectedDate"
                      class="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full"
                    >
                      Ngày: {{ selectedDate }}
                    </span>
                    <span
                      v-if="search"
                      class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full"
                    >
                      Tìm kiếm: {{ search }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Phần form collapse sang phải -->
          <DisclosurePanel
            class="transition-all duration-300 ease-in-out"
            :class="open ? 'w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'"
          >
            <div class="w-96 bg-white rounded-lg shadow-sm sticky top-4 h-fit">
              <div class="p-4 border-b flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-800">
                  {{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}
                </h2>
                <DisclosureButton
                  class="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Icon name="tabler:x" class="w-5 h-5" />
                </DisclosureButton>
              </div>
              <form class="p-4 space-y-4" @submit.prevent="saveVocabulary">
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      for="word"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Từ *</label
                    >
                    <input
                      id="word"
                      v-model="form.word"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label
                      for="meaning"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Nghĩa *</label
                    >
                    <input
                      id="meaning"
                      v-model="form.meaning"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        for="type"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Loại từ *</label
                      >
                      <select
                        id="type"
                        v-model="form.type"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Cấp độ *</label
                      >
                      <select
                        id="level"
                        v-model="form.level"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Ví dụ</label
                    >
                    <textarea
                      id="example"
                      v-model="form.example"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                    ></textarea>
                  </div>
                  <div>
                    <label
                      for="transcription"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Phiên âm</label
                    >
                    <input
                      id="transcription"
                      v-model="form.transcription"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      for="topics"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Topics</label
                    >
                    <select
                      id="topics"
                      v-model="form.topics"
                      multiple
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
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
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >URL âm thanh</label
                      >
                      <input
                        id="audioUrl"
                        v-model="form.audioUrl"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label
                        for="imageUrl"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >URL hình ảnh</label
                      >
                      <input
                        id="imageUrl"
                        v-model="form.imageUrl"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 pt-4">
                  <button
                    type="submit"
                    class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {{ editing ? 'Cập nhật' : 'Thêm' }}
                  </button>
                  <button
                    v-if="editing"
                    type="button"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    @click="cancelEdit"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </DisclosurePanel>
        </div>
      </Disclosure>
    </div>
  </LayoutPageWrapper>
</template>

<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { useAudioPlayback } from 'composables/vocab/use-audio-playback'
import { useVocabularyForm } from 'composables/vocab/use-vocab-form'
import { useVocabulary } from 'composables/vocab/use-vocabulary'
import { useHead } from '#app'

definePageMeta({ layout: 'page', ssr: false })
useHead({ title: 'Danh sách từ vựng' })

const topics = ref<{ id: string; name: string }[]>([])

async function fetchTopics() {
  const response = await useFetch('/api/dictionary/topic')
  if (response.data.value) {
    topics.value = response.data.value as { id: string; name: string }[]
  }
}

const {
  vocabularies,
  selectedLevel,
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

const {
  form,
  editing,
  errorMessage: errorMessageForm,
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
