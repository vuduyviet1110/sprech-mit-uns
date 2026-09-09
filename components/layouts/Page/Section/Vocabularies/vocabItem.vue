<template>
  <div
    class="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-900"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-purple-50/20 dark:from-indigo-950/20 dark:to-purple-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
    ></div>

    <div class="relative z-10">
      <!-- Header Section -->
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
      >
        <div class="flex justify-between flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <h3
              class="text-2xl font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            >
              {{ vocab.word }}
            </h3>
            <button
              :disabled="playingWord === vocab.word"
              class="flex-shrink-0 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
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
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
            >
              {{ vocab.type }}
            </span>
            <span
              v-else
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            >
              Không xác định
            </span>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200"
            >
              {{ vocab.level }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 gap-4 mb-6">
        <div
          class="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-950/60 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:translate"
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nghĩa</h4>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                  <Icon name="twemoji:flag-vietnam" class="w-4 h-4 shrink-0 shadow-2xs" />
                  <span>{{ getViMeaning(vocab.meaning) }}</span>
                </div>
                <div v-if="getEnMeaning(vocab.meaning)" class="flex items-center gap-2 font-semibold text-sky-600 dark:text-sky-400 text-xs">
                  <Icon name="twemoji:flag-united-kingdom" class="w-4 h-4 shrink-0 shadow-2xs" />
                  <span>{{ getEnMeaning(vocab.meaning) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.example"
          class="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-emerald-100 dark:hover:border-emerald-900 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:format-quote"
                class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ví dụ</h4>
              <blockquote
                class="text-slate-700 dark:text-slate-300 italic bg-emerald-50/50 dark:bg-emerald-950/30 px-4 py-3 rounded-lg border-l-4 border-emerald-300 dark:border-emerald-600"
              >
                "{{ vocab.example }}"
              </blockquote>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.transcription"
          class="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-orange-100 dark:hover:border-orange-900 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-orange-50 dark:bg-orange-950/60 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:record-voice-over"
                class="w-4 h-4 text-orange-600 dark:text-orange-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phiên âm</h4>
              <code
                class="inline-block text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-3 py-1.5 rounded-lg text-sm font-mono border border-orange-100 dark:border-orange-900"
              >
                {{ vocab.transcription }}
              </code>
            </div>
          </div>
        </div>

        <div
          v-if="vocab.topics && vocab.topics.length"
          class="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-purple-100 dark:hover:border-purple-900 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-purple-50 dark:bg-purple-950/60 rounded-lg flex items-center justify-center"
            >
              <Icon
                name="material-symbols:tag"
                class="w-4 h-4 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Chủ đề</h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="topic in vocab.topics"
                  :key="topic.topic.name"
                  class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900 hover:bg-purple-100 transition-colors"
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
        class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 mb-6"
      >
        <div class="flex items-start gap-3 mb-3">
          <div
            class="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center"
          >
            <Icon
              name="material-symbols:perm-media"
              class="w-4 h-4 text-slate-600 dark:text-slate-300"
            />
          </div>
          <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Hình Ảnh / Âm Thanh</h4>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-4 ml-11">
          <img
            v-if="vocab.imageUrl"
            :src="vocab.imageUrl"
            :alt="vocab.word"
            class="w-24 h-24 object-cover rounded-xl shadow-sm border-2 border-white dark:border-slate-700"
          />
          <div v-if="vocab.audioUrl" class="flex-1">
            <div
              class="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <audio controls class="w-full">
                <source :src="vocab.audioUrl" type="audio/mpeg" />
                Trình duyệt không hỗ trợ phát âm thanh.
              </audio>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          v-if="showEditButton"
          class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all hover:shadow-xs"
          @click="editVocabulary(vocab)"
          aria-label="Sửa"
        >
          <Icon name="material-symbols:edit-outline" class="w-4 h-4" />
          Chỉnh sửa
        </button>
        <button
          v-if="showDeleteButton"
          @click="deleteVocabulary(vocab.id || '')"
          class="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-sm font-medium transition-all hover:shadow-xs"
          aria-label="Xóa"
        >
          <Icon name="material-symbols:delete-outline" class="w-4 h-4" />
          Xóa
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/60 rounded-lg flex items-center justify-center"
          >
            <Icon
              name="material-symbols:error-outline"
              class="w-4 h-4 text-red-600 dark:text-red-400"
            />
          </div>
          <div>
            <h4 class="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Có lỗi xảy ra</h4>
            <p class="text-sm text-red-700 dark:text-red-400">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
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

const getViMeaning = (meaningStr?: string) => {
  if (!meaningStr) return ''
  const part = meaningStr.includes('•') ? meaningStr.split('•')[0] : meaningStr
  return part.replace(/VN\s*/i, '').replace(/🇻🇳/g, '').replace(/GB\s*/i, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}

const getEnMeaning = (meaningStr?: string) => {
  if (!meaningStr || !meaningStr.includes('•')) return ''
  const part = meaningStr.split('•')[1]
  return part.replace(/VN\s*/i, '').replace(/🇻🇳/g, '').replace(/GB\s*/i, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}
</script>
