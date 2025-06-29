<template>
  <LayoutPageWrapper>
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Danh sách từ vựng tiếng Đức</h1>

      <!-- Bộ lọc cấp độ -->
      <div class="mb-4">
        <label for="level" class="mr-2">Lọc theo cấp độ:</label>
        <select
          v-model="selectedLevel"
          class="border p-2"
          @change="fetchVocabularies"
        >
          <option value="">Tất cả</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
        </select>
      </div>

      <!-- Danh sách từ vựng -->
      <div
        v-for="vocab in vocabularies"
        :key="vocab.id || vocab.word"
        class="border p-4 mb-2 rounded"
      >
        <h2 class="text-xl font-semibold">{{ vocab.word }}</h2>
        <p><strong>Nghĩa:</strong> {{ vocab.meaning }}</p>
        <p v-if="vocab.example"><strong>Ví dụ:</strong> {{ vocab.example }}</p>
        <p><strong>Cấp độ:</strong> {{ vocab.level }}</p>
        <img
          v-if="vocab.imageUrl"
          :src="vocab.imageUrl"
          :alt="vocab.word"
          class="mt-2 h-28 w-28 object-cover"
        />
        <div v-if="vocab.audioUrl" class="mt-2">
          <audio controls>
            <source :src="vocab.audioUrl" type="audio/mpeg" />
            Trình duyệt không hỗ trợ âm thanh.
          </audio>
        </div>
        <div class="mt-2">
          <button
            class="bg-yellow-500 text-white px-4 py-2 mr-2 rounded"
            :disabled="isPlaying"
            @click="playAudioOrSpeak(vocab)"
          >
            {{ isPlaying ? 'Đang phát...' : 'Nghe phát âm' }}
          </button>
          <button
            class="bg-blue-500 text-white px-4 py-2 mr-2 rounded"
            @click="editVocabulary(vocab)"
          >
            Sửa
          </button>
          <button
            class="bg-red-500 text-white px-4 py-2 rounded"
            @click="deleteVocabulary(vocab.id || '')"
          >
            Xóa
          </button>
        </div>
        <p
          v-if="errorMessageVocab || errorMessageForm || errorMessageAudio"
          class="text-red-500 mt-2"
        >
          {{ errorMessageVocab || errorMessageForm || errorMessageAudio }}
        </p>
      </div>

      <div class="mt-6">
        <h2 class="text-xl font-bold mb-2">
          {{ editing ? 'Sửa từ vựng' : 'Thêm từ vựng' }}
        </h2>
        <form class="space-y-4" @submit.prevent="saveVocabulary">
          <div>
            <label for="word">Từ:</label>
            <input
              id="word"
              v-model="form.word"
              class="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label for="meaning">Nghĩa:</label>
            <input
              id="meaning"
              v-model="form.meaning"
              class="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label for="example">Ví dụ:</label>
            <input
              id="example"
              v-model="form.example"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label for="level">Cấp độ:</label>
            <select
              id="level"
              v-model="form.level"
              class="border p-2 w-full"
              required
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>
          </div>
          <div>
            <label for="audioUrl">URL âm thanh:</label>
            <input
              id="audioUrl"
              v-model="form.audioUrl"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label for="imgUrl">URL hình ảnh:</label>
            <input
              id="imageUrl"
              v-model="form.imageUrl"
              class="border p-2 w-full"
            />
          </div>

          <button
            type="submit"
            class="bg-green-500 text-white px-4 py-2 rounded"
          >
            {{ editing ? 'Cập nhật' : 'Thêm' }}
          </button>
          <button
            v-if="editing"
            class="bg-gray-500 text-white px-4 py-2 rounded ml-2"
            @click="cancelEdit"
          >
            Hủy
          </button>
        </form>
      </div>
    </div>
  </LayoutPageWrapper>
</template>

<script lang="ts" setup>
import { useAudioPlayback } from 'composables/vocab/use-audio-playback'
import { useVocabularyForm } from 'composables/vocab/use-vocab-form'
import { useVocabulary } from 'composables/vocab/use-vocabulary'

definePageMeta({ layout: 'page' })
useHead({ title: 'Danh sách từ vựng' })

const {
  vocabularies,
  selectedLevel,
  errorMessage: errorMessageVocab,
  fetchVocabularies,
  deleteVocabulary,
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
  isPlaying,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()

fetchVocabularies()
</script>
