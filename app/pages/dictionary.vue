<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { withLoading } from '~/utils/withLoading'
import { useVocabulary } from '~/composables/vocab/use-vocabulary'
import type { VocabularyWord, Topic } from '~/utils/types'

definePageMeta({ layout: 'page' })
useHead({ title: 'German Dictionary' })

const {
  vocabularies,
  selectedLevel,
  selectedTopic,
  search,
  errorMessage,
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
const handleTopicCreated = () => {
  fetchTopics()
}
onMounted(async () => {
  await fetchTopics()
  await fetchVocabularies(true)
})

async function fetchTopics() {
  console.log('Fetching topics...')
  const response = await withLoading(() =>
    $fetch<Topic[]>('/api/dictionary/topic'),
  )
  console.log('Topics response:', response)
  if (response.length > 0) {
    topics.value = response
  }
}

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
  console.log(`Selected level: ${lvl}`)
  selectedLevel.value = lvl
  page.value = 1
  fetchVocabularies(true)
}

function clearTopic() {
  selectedTopic.value = null
  selectedLevel.value = ''
  search.value = ''
  page.value = 1
  fetchVocabularies(true)
}

function addToVocabulary(entry: VocabularyWord) {
  console.log(`Add to vocab: ${entry.word}`)
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageHeader class="text-teal-600 flex justify-between gap-4">
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

      <div
        v-if="!selectedTopic"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <button
          v-for="t in topics"
          :key="t.id"
          class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          @click="selectTopic(t.name)"
        >
          <span class="text-lg font-medium text-gray-700">{{ t.name }}</span>
        </button>
      </div>

      <div v-else class="space-y-6">
        <div
          class="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm"
        >
          <h2 class="text-2xl font-bold text-gray-800">
            Topic: {{ selectedTopic }}
          </h2>
          <button
            class="mt-2 sm:mt-0 text-blue-600 hover:text-blue-800 font-medium"
            @click="clearTopic"
          >
            Back to Topics
          </button>
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

        <div v-if="vocabularies.length === 0" class="text-center text-gray-600">
          No entries found.
        </div>
        <div v-else class="grid grid-cols-1 gap-6">
          <div
            v-for="entry in vocabularies"
            :key="entry.id || entry.word"
            class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-bold text-xl text-gray-800">
                  {{ entry.word }}
                  <span v-if="entry.transcription" class="text-sm text-gray-500"
                    >({{ entry.transcription }})</span
                  >
                </div>
                <div class="text-gray-600">Meaning: {{ entry.meaning }}</div>
                <div v-if="entry.example" class="italic text-gray-500">
                  Example: {{ entry.example }}
                </div>
              </div>

              <button
                class="text-blue-600 hover:text-blue-800 font-medium"
                @click="addToVocabulary(entry)"
              >
                + Add to Vocabulary
              </button>
            </div>
          </div>
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
            :disabled="!hasMore.valueOf()"
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
