<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useLanguage, type LearningLanguage } from '~/composables/use-language'
import type { VocabularyWord } from '~/utils/types'

definePageMeta({ layout: 'page' })
useHead({ title: 'Từ điển Theo Chủ Đề - Sprech Mit Uns' })

const { currentLanguage, setLanguage } = useLanguage()
const selectedLang = computed({
  get: () => currentLanguage.value,
  set: (val: LearningLanguage) => setLanguage(val),
})
const selectedLevel = ref('')
const selectedType = ref('')
const search = ref('')
const activeTopicId = ref<string | null>(null)

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const wordTypes = [
  { label: 'Tất cả từ loại', value: '' },
  { label: '🏷️ Danh từ (Noun)', value: 'Noun' },
  { label: '⚡ Động từ (Verb)', value: 'Verb' },
  { label: '🎨 Tính từ (Adjective)', value: 'Adjective' },
  { label: '📍 Phó từ (Adverb)', value: 'Adverb' },
  { label: '💬 Cụm từ / Thán từ', value: 'Phrase' },
  { label: '🔢 Số đếm (Number)', value: 'Number' },
]

const { data: topics, pending: loading } = useFetch<any[]>(() => `/api/dictionary/topic?lang=${selectedLang.value}`, {
  server: false,
  watch: [selectedLang],
})

const { playingWord, errorMessage: errorMessageAudio, playAudioOrSpeak } = useAudioPlayback()

// Total Counts Computed
const totalTopicsCount = computed(() => topics.value?.length || 0)

const totalWordsCount = computed(() => {
  if (!topics.value) return 0
  return topics.value.reduce((acc, t) => acc + (t.words?.length || 0), 0)
})

// Filtered Topics & Words
const filteredTopics = computed(() => {
  if (!topics.value) return []
  return topics.value
    .map((topic) => {
      // Filter words inside topic
      const matchingWords = (topic.words || []).filter((w: VocabularyWord) => {
        // Level filter
        const matchesLevel = !selectedLevel.value || (w.level && w.level.toUpperCase() === selectedLevel.value.toUpperCase())

        // Type filter (Noun, Verb, Adjective, Phrase/Interjection, etc.)
        let matchesType = true
        if (selectedType.value) {
          if (selectedType.value === 'Phrase') {
            matchesType = w.type === 'Phrase' || w.type === 'Interjection'
          } else {
            matchesType = w.type?.toLowerCase() === selectedType.value.toLowerCase()
          }
        }

        // Search Query filter
        const query = search.value.trim().toLowerCase()
        const matchesQuery =
          !query ||
          w.word.toLowerCase().includes(query) ||
          w.meaning.toLowerCase().includes(query) ||
          (w.example && w.example.toLowerCase().includes(query))

        return matchesLevel && matchesType && matchesQuery
      })

      return {
        ...topic,
        filteredWords: matchingWords,
      }
    })
    .filter((topic) => {
      if (search.value || selectedLevel.value || selectedType.value) {
        return topic.filteredWords.length > 0
      }
      return true
    })
})

const filteredWordsCount = computed(() => {
  return filteredTopics.value.reduce((acc, t) => acc + (t.filteredWords?.length || 0), 0)
})

// Independent open states for each topic (by default all topics are open)
const closedTopicIds = ref<Set<string>>(new Set())

const toggleTopic = (id: string) => {
  const newSet = new Set(closedTopicIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  closedTopicIds.value = newSet
}

const getViMeaning = (meaningStr?: string) => {
  if (!meaningStr) return ''
  const part = meaningStr.includes('•') ? meaningStr.split('•')[0] : meaningStr
  return part.replace(/🇻🇳/g, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}

const getEnMeaning = (meaningStr?: string) => {
  if (!meaningStr || !meaningStr.includes('•')) return ''
  const part = meaningStr.split('•')[1]
  return part.replace(/🇻🇳/g, '').replace(/🇬🇧/g, '').replace(/^\|/, '').trim()
}

const isTopicOpen = (id: string) => {
  if (search.value || selectedLevel.value || selectedType.value) return true
  return !closedTopicIds.value.has(id)
}

const clearFilters = () => {
  search.value = ''
  selectedLevel.value = ''
  selectedType.value = ''
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageHeader class="mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-3 py-1 text-xs font-extrabold rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 tracking-wider">
            TOPIC DICTIONARY
          </span>
          <!-- Total Stats Badge -->
          <span v-if="!loading" class="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Icon name="uil:book-alt" class="w-4 h-4 text-teal-500" />
            <span>Kho từ: <strong class="text-teal-600 dark:text-teal-400 font-extrabold">{{ totalWordsCount }}</strong> từ vựng / <strong class="text-slate-900 dark:text-white font-extrabold">{{ totalTopicsCount }}</strong> chủ đề</span>
          </span>
        </div>

        <!-- Language Switcher -->
        <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            @click="selectedLang = 'de'; clearFilters()"
            :class="selectedLang === 'de' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            class="px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🇩🇪 Tiếng Đức</span>
          </button>
          <button
            @click="selectedLang = 'cs'; clearFilters()"
            :class="selectedLang === 'cs' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
            class="px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🇨🇿 Tiếng Séc</span>
          </button>
        </div>
      </div>

      <LayoutPageTitle text="Từ Điển Phân Loại Theo Chủ Đề & Từ Loại" class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white" />
      <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1">
        Tra cứu kho từ vựng tiếng Đức & Séc, được phân loại theo từng danh mục bài học, cấp độ và từ loại (Danh từ, Động từ, Tính từ,...).
      </p>
    </LayoutPageHeader>

    <div class="w-full space-y-6">
      <!-- Search Bar & Filters Section -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <!-- Main Search Input -->
          <div class="relative flex-1 w-full">
            <Icon name="uil:search" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="search"
              type="text"
              placeholder="Tra cứu từ vựng theo tên từ, ý nghĩa hoặc ví dụ..."
              class="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white placeholder-slate-400 text-base focus:outline-hidden focus:border-teal-500 transition-all"
            />
            <button
              v-if="search"
              @click="search = ''"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <Icon name="uil:times" class="w-5 h-5" />
            </button>
          </div>

          <!-- Level Filter Pills -->
          <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              @click="selectedLevel = ''"
              :class="!selectedLevel ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
              class="px-3.5 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Tất cả Cấp Độ
            </button>
            <button
              v-for="lvl in levels"
              :key="lvl"
              @click="selectedLevel = lvl"
              :class="selectedLevel === lvl ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
              class="px-3.5 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {{ lvl }}
            </button>
          </div>
        </div>

        <!-- Word Type Filter Bar -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
          <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Phân Loại Từ:</span>
          <button
            v-for="t in wordTypes"
            :key="t.value"
            @click="selectedType = t.value"
            :class="selectedType === t.value ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
            class="px-3 py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            {{ t.label }}
          </button>

          <button
            v-if="search || selectedLevel || selectedType"
            @click="clearFilters"
            class="ml-auto px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <Icon name="uil:redo" class="w-3.5 h-3.5" /> Xóa tất cả bộ lọc
          </button>
        </div>

        <!-- Filter Results Counter Bar -->
        <div v-if="search || selectedLevel || selectedType" class="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500">
          <span>
            Tìm thấy <strong class="text-teal-600 dark:text-teal-400 font-extrabold text-sm">{{ filteredWordsCount }}</strong> từ vựng phù hợp trong {{ filteredTopics.length }} chủ đề
          </span>
          <span class="italic text-slate-400">
            Đang lọc: {{ search ? `"${search}"` : '' }} {{ selectedLevel ? `[Cấp độ ${selectedLevel}]` : '' }} {{ selectedType ? `[Từ loại ${selectedType}]` : '' }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <LayoutPageLoading />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredTopics.length"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3"
      >
        <Icon name="uil:search-minus" class="w-12 h-12 mx-auto text-slate-400" />
        <p class="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy từ vựng nào khớp với bộ lọc từ loại/tìm kiếm.</p>
      </div>

      <!-- Topic List Groups (2-column masonry grid layout) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div
          v-for="topic in filteredTopics"
          :key="topic.id"
          class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all"
        >
          <!-- Topic Header -->
          <div
            @click="toggleTopic(topic.id)"
            class="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-extrabold text-lg">
                <Icon name="uil:folder" class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">{{ topic.name }}</h3>
                  <span class="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {{ topic.level || 'A1' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ topic.filteredWords?.length || 0 }} từ vựng {{ search || selectedLevel || selectedType ? 'khớp bộ lọc' : '' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <NuxtLink
                :to="topic.slug ? `/lesson?topic=${topic.slug}` : '/lesson'"
                @click.stop
                class="px-3.5 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Icon name="uil:book-open" class="w-4 h-4" /> Học bài này
              </NuxtLink>
              <Icon
                :name="isTopicOpen(topic.id) ? 'uil:angle-up' : 'uil:angle-down'"
                class="w-6 h-6 text-slate-400"
              />
            </div>
          </div>

          <!-- Words Grid inside Topic -->
          <div
            v-if="isTopicOpen(topic.id)"
            class="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div
                v-for="word in topic.filteredWords"
                :key="word.id || word.word"
                class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-teal-300 transition-all flex justify-between items-start gap-3"
              >
                <div class="space-y-1.5 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-lg font-extrabold text-slate-900 dark:text-white">{{ word.word }}</span>
                    <span v-if="word.type" class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60">
                      {{ word.type === 'Noun' ? 'Danh từ' : word.type === 'Verb' ? 'Động từ' : word.type === 'Adjective' ? 'Tính từ' : word.type === 'Adverb' ? 'Phó từ' : word.type === 'Number' ? 'Số đếm' : word.type }}
                    </span>
                    <span v-if="word.pronunciation" class="text-xs text-slate-400 font-mono">{{ word.pronunciation }}</span>
                  </div>
                  <!-- Trilingual Flag Meanings (Vietnamese & English SVG Flag Icons) -->
                  <div class="flex flex-col gap-1.5 text-sm mt-1">
                    <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                      <Icon name="twemoji:flag-vietnam" class="w-4 h-4 shrink-0 shadow-2xs" />
                      <span>{{ getViMeaning(word.meaning) }}</span>
                    </div>
                    <div v-if="getEnMeaning(word.meaning)" class="flex items-center gap-2 font-semibold text-sky-600 dark:text-sky-400 text-xs">
                      <Icon name="twemoji:flag-united-kingdom" class="w-4 h-4 shrink-0 shadow-2xs" />
                      <span>{{ getEnMeaning(word.meaning) }}</span>
                    </div>
                  </div>
                  <p v-if="word.example" class="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    "{{ word.example }}"
                  </p>
                </div>

                <button
                  @click="playAudioOrSpeak(word)"
                  title="Nghe phát âm"
                  class="w-9 h-9 shrink-0 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-teal-200 dark:border-teal-900/60"
                >
                  <Icon name="uil:volume-up" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
