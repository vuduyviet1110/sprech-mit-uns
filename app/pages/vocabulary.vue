<template>
  <LayoutPageWrapper>
    <div class="container mx-auto p-4 max-w-7xl">
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
              @change="onLevelChange"
            >
              <option value="">Tất cả</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>
          </div>
          <div class="text-sm text-gray-600">
            Hiển thị: {{ currentTotal }} / {{ totalCount }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2">
          <div class="bg-white rounded-lg shadow-sm">
            <div class="p-4 border-b flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-800">
                Danh sách từ vựng
                <Icon
                  name="tabler:refresh"
                  @click="fetchVocabularies(true)"
                  class="cursor-pointer hover:scale-120 transition w-5 h-5 inline-block"
                />
              </h2>
              <div
                class="flex items-center border rounded-lg p-1 border-gray-300 hover:border-blue-500 transition"
              >
                <input
                  v-model="search"
                  type="text"
                  placeholder="Tìm kiếm"
                  class="focus:outline-none p-2"
                />
                <Icon
                  name="material-symbols:search-rounded"
                  class="w-8 h-8 inline-block"
                />
              </div>
            </div>
            <div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div
                  v-for="vocab in vocabularies"
                  :key="vocab.id || vocab.word"
                  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-bold text-gray-800">
                      {{ vocab.word }}
                      <span v-if="vocab.type" class="text-teal-800 text-sm"
                        >({{ vocab.type }})</span
                      >
                      <span v-else class="text-sm">( - )</span>
                    </h3>
                    <span
                      class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                    >
                      {{ vocab.level }}
                    </span>
                  </div>
                  <div class="space-y-2 mb-3">
                    <p class="text-sm">
                      <span class="font-medium text-gray-600">Nghĩa: </span>
                      <span class="text-gray-800">{{ vocab.meaning }}</span>
                    </p>
                    <p v-if="vocab.example" class="text-sm">
                      <span class="font-medium text-gray-600">Ví dụ: </span>
                      <span class="text-gray-700 italic">{{
                        vocab.example
                      }}</span>
                    </p>
                    <p v-if="vocab.transcription" class="text-sm">
                      <span class="font-medium text-gray-600">Phiên âm: </span>
                      <span class="text-gray-700">{{
                        vocab.transcription
                      }}</span>
                    </p>
                    <p
                      v-if="vocab.topics && vocab.topics.length"
                      class="text-sm"
                    >
                      <span class="font-medium text-gray-600">Topics: </span>
                      <span class="text-gray-800">
                        {{ vocab.topics.map((t) => t.topic.name).join(', ') }}
                      </span>
                    </p>
                  </div>
                  <div class="flex items-center gap-3 mb-3">
                    <img
                      v-if="vocab.imageUrl"
                      :src="vocab.imageUrl"
                      :alt="vocab.word"
                      class="w-16 h-16 object-cover rounded-lg"
                    />
                    <div v-if="vocab.audioUrl" class="flex-1">
                      <audio controls class="w-full h-8">
                        <source :src="vocab.audioUrl" type="audio/mpeg" />
                      </audio>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1"
                      :disabled="playingWord === vocab.word"
                      @click="playAudioOrSpeak(vocab)"
                    >
                      <Icon
                        :name="
                          playingWord === vocab.word
                            ? 'material-symbols-light:edit-audio'
                            : 'material-symbols-light:spatial-audio'
                        "
                        class="h-4 w-4"
                      />
                      {{ playingWord === vocab.word ? 'Đang phát' : 'Phát âm' }}
                    </button>
                    <button
                      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      @click="editVocabulary(vocab)"
                    >
                      Sửa
                    </button>
                    <button
                      class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      @click="deleteVocabulary(vocab.id || '')"
                    >
                      Xóa
                    </button>
                  </div>
                  <p
                    v-if="
                      errorMessageVocab || errorMessageForm || errorMessageAudio
                    "
                    class="text-red-500 text-xs mt-2"
                  >
                    {{
                      errorMessageVocab || errorMessageForm || errorMessageAudio
                    }}
                  </p>
                </div>
              </div>
              <!-- Nút Load More -->
              <div v-if="hasMore" class="p-4 text-center">
                <button
                  class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  :disabled="loading"
                  @click="loadMoreVocabularies"
                >
                  {{ loading ? 'Đang tải...' : 'Tải thêm' }}
                </button>
              </div>
              <!-- Thông báo khi không còn dữ liệu -->
              <div
                v-else-if="vocabularies.length > 0"
                class="p-4 text-center text-gray-600"
              >
                Đã tải hết tất cả từ vựng
              </div>
              <!-- Thông báo khi không có dữ liệu -->
              <div v-else class="p-4 text-center text-gray-600">
                Không tìm thấy từ vựng nào
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-1">
          <div class="bg-white rounded-lg shadow-sm sticky top-4">
            <div class="p-4 border-b">
              <h2 class="text-xl font-semibold text-gray-800">
                {{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}
              </h2>
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
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none h-24"
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
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              <div class="flex gap-2 pt-4">
                <button
                  type="submit"
                  class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {{ editing ? 'Cập nhật' : 'Thêm' }}
                </button>
                <button
                  v-if="editing"
                  type="button"
                  class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
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
import { ref, watch } from 'vue'
import debounce from 'lodash/debounce'
import { useAudioPlayback } from 'composables/vocab/use-audio-playback'
import { useVocabularyForm } from 'composables/vocab/use-vocab-form'
import { useVocabulary } from 'composables/vocab/use-vocabulary'
import { useHead } from '#app'
import { withLoading } from '~/utils/withLoading'

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
  errorMessage: errorMessageVocab,
  fetchVocabularies,
  loadMoreVocabularies,
  deleteVocabulary,
  loading,
  hasMore,
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

function onLevelChange() {
  fetchVocabularies(true)
}

const debouncedFetch = debounce(() => fetchVocabularies(true), 300)
watch(search, debouncedFetch)
watch(selectedLevel, () => fetchVocabularies(true))

watch(
  () => loading.value,
  (val) => {
    console.log('Loading visible:', val)
  },
)

onMounted(async () => {
  await withLoading(() => fetchVocabularies(true))
  await fetchTopics()
})
</script>

<style scoped>
select#topics option:checked {
  background-color: #109679;
  color: #e8ecf1;
}
</style>
