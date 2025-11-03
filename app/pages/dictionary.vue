<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useVocabulary } from '~/composables/vocab/use-vocabulary'
import type { VocabularyWord, Topic } from '~/utils/types'

definePageMeta({ layout: 'page' })
useHead({ title: 'German Dictionary' })

const {
  vocabularies,
  selectedLevel,
  selectedTopic,
  search,
  errorMessage: errorMessageVocab,
  page,
  limit,
  loading,
  hasMore,
  fetchVocabularies,
  loadMoreVocabularies,
  deleteVocabulary,
} = useVocabulary()

const topics = ref<Topic[]>([])
const levels = ['A1', 'A2', 'B1', 'B2']

const {
  data,
  pending: topicLoading,
  error,
} = useFetch<Topic[]>('/api/dictionary/topic', {
  server: false,
  lazy: false,
  onResponse({ response }) {
    if (response._data?.length) {
      topics.value = response._data
    }
  },
  onResponseError({ response }) {
    console.error('Lỗi fetch topics:', response._data)
  },
})
const handleTopicCreated = () => {
  topicLoading.value = true
  useFetch('/api/dictionary/topic', {
    server: false,
    lazy: false,
    onResponse({ response }) {
      if (response._data?.length) {
        topics.value = response._data
      }
    },
    onResponseError({ response }) {
      console.error('Lỗi fetch topics:', response._data)
    },
  })
}

onMounted(async () => {
  await fetchVocabularies(true)
})

watch([search, selectedLevel, selectedTopic], () => {
  page.value = 1
  fetchVocabularies(true)
})

function selectTopic(name: string) {
  selectedTopic.value = name
  page.value = 1
  fetchVocabularies(true)
}

function selectLevel(lvl: string) {
  selectedLevel.value = lvl
  page.value = 1
  fetchVocabularies(true)
}
const {
  playingWord,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()
function clearTopic() {
  selectedTopic.value = null
  selectedLevel.value = ''
  search.value = ''
  page.value = 1
  fetchVocabularies(true)
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageHeader
      class="text-teal-600 flex max-w-8xl mx-auto w-full justify-between gap-4"
    >
      <LayoutPageTitle
        text="List of German topics"
        class="capitalize mt-4 font-semibold text-teal-600"
      />

      <AwesomeButtonAddTopic @created="handleTopicCreated" />
    </LayoutPageHeader>

    <div class="container mx-auto px-4 py-8">
      <LayoutPageSectionTitle
        text="Select a Topic"
        class="text-2xl font-semibold text-gray-800 mb-6"
      />

      <div v-if="topicLoading" class="text-center py-10">
        <LayoutPageLoading />
      </div>

      <div
        v-else-if="!selectedTopic"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      >
        <button
          v-for="t in topics"
          :key="t.id"
          class="group relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300/40 focus:outline-none focus:ring-2 focus:ring-slate-300/50 focus:ring-offset-1"
          @click="selectTopic(t.name)"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-100/0 group-hover:from-slate-50/30 group-hover:to-slate-100/20 rounded-2xl transition-all duration-300"
          ></div>

          <div class="relative z-10 flex flex-col items-center text-center">
            <div
              class="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200/80 rounded-full flex items-center justify-center mb-3 group-hover:from-slate-200 group-hover:to-slate-300/60 transition-all duration-300"
            >
              <div
                class="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              ></div>
            </div>
            <span
              class="text-base font-medium text-slate-700 group-hover:text-slate-800 transition-colors duration-200 leading-relaxed"
            >
              {{ t.name }}
            </span>

            <div
              class="mt-2 w-1/2 h-0.5 bg-slate-200 group-hover:bg-slate-300 rounded-full transition-all duration-300 group-hover:w-full"
            ></div>
          </div>

          <div
            class="absolute inset-0 rounded-2xl ring-1 ring-slate-200/0 group-hover:ring-slate-300/30 transition-all duration-300"
          ></div>
        </button>
      </div>

      <div v-else class="space-y-6">
        <div
          class="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm"
        >
          <button
            class="mt-2 sm:mt-0 text-blue-600 hover:text-blue-800 hover:underline font-medium"
            @click="clearTopic"
          >
            <Icon name="mdi:arrow-left" class="h-5 w-5 inline-flex mr-2" />
            Back to Topics
          </button>
          <h2 class="text-2xl font-bold text-gray-800">
            Topic: {{ selectedTopic }}
          </h2>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <input
            v-model="search"
            placeholder="Search words in this topic..."
            class="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none"
          />
          <select
            v-model="selectedLevel"
            class="p-3 border text-slate-900 border-gray-300 rounded-lg focus:outline-none"
            @change="selectLevel(selectedLevel)"
          >
            <option value="">All Levels</option>
            <option v-for="lvl in levels" :key="lvl" :value="lvl">
              {{ lvl }}
            </option>
          </select>
        </div>

        <div v-if="loading" class="text-center py-10 text-gray-500">
          Loading vocabularies...
        </div>

        <div
          v-else-if="vocabularies.length === 0"
          class="text-center text-gray-600"
        >
          No entries found.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <LayoutPageSectionVocabulariesVocabItem
            v-for="vocab in vocabularies"
            :key="vocab.id || vocab.word"
            :vocab="vocab"
            :error-message="errorMessageVocab || errorMessageAudio"
            :playing-word="playingWord"
            :show-edit-button="false"
            :show-delete-button="false"
            @play-audio-or-speak="playAudioOrSpeak"
          />
        </div>

        <div class="flex justify-between items-center mt-6">
          <button
            :disabled="page === 1"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors duration-200"
            @click="(page--, fetchVocabularies(true))"
          >
            Previous
          </button>
          <span class="text-gray-600">Page {{ page }}</span>
          <button
            :disabled="!hasMore"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors duration-200"
            @click="(page++, fetchVocabularies(true))"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
