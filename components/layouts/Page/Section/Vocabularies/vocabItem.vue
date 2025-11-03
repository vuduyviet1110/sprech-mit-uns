<template>
  <div
    class="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-indigo-100"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-purple-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    ></div>

    <div class="relative z-10">
      <!-- Header Section -->
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
      >
        <div class="flex justify-between flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <h3
              class="text-2xl font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors"
            >
              {{ vocab.word }}
            </h3>
            <button
              :disabled="playingWord === vocab.word"
              class="flex-shrink-0 w-10 h-10 bg-indigo-400 disabled:bg-indigo-400 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
              aria-label="Play pronunciation"
              @click="playAudioOrSpeak(vocab)"
            >
              <Icon
                :name="
                  playingWord === vocab.word
                    ? 'material-symbols-light:edit-audio'
                    : 'material-symbols-light:spatial-audio'
                "
                class="w-5 h-5"
              />
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="vocab.type"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              {{ vocab.type }}
            </span>
            <span
              v-else
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200"
            >
              Không xác định
            </span>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800"
            >
              {{ vocab.level }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 gap-4 mb-6">
        <div
          class="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:translate"
                class="w-4 h-4 text-blue-600"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-700 mb-1">Nghĩa</h4>
              <p class="text-gray-800 leading-relaxed">{{ vocab.meaning }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.example"
          class="bg-white border border-gray-100 rounded-xl p-4 hover:border-green-100 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:format-quote"
                class="w-4 h-4 text-green-600"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Ví dụ</h4>
              <blockquote
                class="text-gray-700 italic bg-green-50/50 px-4 py-3 rounded-lg border-l-4 border-green-200"
              >
                "{{ vocab.example }}"
              </blockquote>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.transcription"
          class="bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-100 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:record-voice-over"
                class="w-4 h-4 text-orange-600"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Phiên âm</h4>
              <code
                class="inline-block text-orange-600 bg-orange-50 px-3 py-2 rounded-lg text-sm font-mono border border-orange-100"
              >
                {{ vocab.transcription }}
              </code>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.topics && vocab.topics.length"
          class="bg-white border border-gray-100 rounded-xl p-4 hover:border-purple-100 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:tag"
                class="w-4 h-4 text-purple-600"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Chủ đề</h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="topic in vocab.topics"
                  :key="topic.topic.name"
                  class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  {{ topic.topic.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="vocab.imageUrl || vocab.audioUrl"
        class="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-5 border border-gray-100 mb-6"
      >
        <div class="flex items-start gap-3 mb-3">
          <div
            class="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <Icon
              name="material-symbols:perm-media"
              class="w-4 h-4 text-gray-600"
            />
          </div>
          <h4 class="text-sm font-semibold text-gray-700">Hình Ảnh</h4>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-4 ml-11">
          <img
            v-if="vocab.imageUrl"
            :src="vocab.imageUrl"
            :alt="vocab.word"
            class="w-24 h-24 object-cover rounded-xl shadow-sm border-2 border-white"
          />
          <div v-if="vocab.audioUrl" class="flex-1">
            <div
              class="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
            >
              <audio controls class="w-full">
                <source :src="vocab.audioUrl" type="audio/mpeg" />
                Trình duyệt không hỗ trợ phát âm thanh.
              </audio>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          v-if="showEditButton"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-all hover:shadow-sm"
          @click="editVocabulary(vocab)"
          aria-label="Sửa"
        >
          <Icon name="material-symbols:edit-outline" class="w-4 h-4" />
          Chỉnh sửa
        </button>
        <button
          v-if="showDeleteButton"
          @click="deleteVocabulary(vocab.id || '')"
          class="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all hover:shadow-sm"
          aria-label="Xóa"
        >
          <Icon name="material-symbols:delete-outline" class="w-4 h-4" />
          Xóa
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"
          >
            <Icon
              name="material-symbols:error-outline"
              class="w-4 h-4 text-red-600"
            />
          </div>
          <div>
            <h4 class="text-sm font-medium text-red-800 mb-1">Có lỗi xảy ra</h4>
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  vocab: VocabularyWord
  playingWord: string | null
  errorMessage: string | null
  showEditButton?: boolean
  showDeleteButton?: boolean
}>()

const emit = defineEmits<{
  (e: 'playAudioOrSpeak', vocab: any): void
  (e: 'editVocabulary', vocab: any): void
  (e: 'deleteVocabulary', id: string): void
}>()

const playAudioOrSpeak = (vocab: any) => {
  emit('playAudioOrSpeak', vocab)
}

const editVocabulary = (vocab: any) => {
  emit('editVocabulary', vocab)
}

const deleteVocabulary = (id: string) => {
  emit('deleteVocabulary', id)
}
</script>
