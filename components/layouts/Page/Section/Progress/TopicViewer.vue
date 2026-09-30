<template>
  <div
    class="min-h-screen bg-slate-50 dark:bg-slate-950"
  >
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md border-b border-blue-100">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button
              variant="ghost"
              class="text-blue-600 hover:text-blue-800"
              @click="$emit('back')"
            >
              <Icon name="mdi:arrow-left" class="h-5 w-5" />
              Back to Topics
            </Button>
            <div class="flex items-center space-x-2">
              <Icon
                name="mdi:book-open-outline"
                class="h-6 w-6 text-blue-600"
              />
              <h1 class="text-xl font-bold text-blue-900">{{ topic.title }}</h1>
              <Badge class="bg-blue-100 text-blue-700">{{
                topic.difficulty
              }}</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Navigation Tabs -->
      <div class="flex gap-2 mb-6">
        <Button
          :class="
            currentView === 'reading'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600'
          "
          :variant="currentView === 'reading' ? 'default' : 'outline'"
          @click="currentView = 'reading'"
        >
          <Icon name="mdi:book-open-outline" class="h-4 w-4" />
          Reading
        </Button>
        <Button
          :class="
            currentView === 'vocabulary'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600'
          "
          :variant="currentView === 'vocabulary' ? 'default' : 'outline'"
          @click="currentView = 'vocabulary'"
        >
          <Icon name="lucide:book-a" class="h-4 w-4" />
          Vocabulary
        </Button>
        <Button
          :class="
            currentView === 'flashcards'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600'
          "
          :variant="currentView === 'flashcards' ? 'default' : 'outline'"
          @click="currentView = 'flashcards'"
        >
          <Icon name="lucide:biceps-flexed" class="h-4 w-4" />
          Practice
        </Button>
      </div>

      <!-- Cả hai tab này đều sống nhờ từ vựng của bài; không có thì nói thẳng
           thay vì hiện dữ liệu mẫu. -->
      <div
        v-if="needsWords && !hasWords"
        class="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800"
      >
        <Icon
          :name="isLoadingWords ? 'lucide:loader-2' : 'lucide:book-x'"
          :class="[
            'w-8 h-8 mx-auto text-slate-400',
            isLoadingWords ? 'animate-spin' : '',
          ]"
        />
        <p class="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
          {{
            isLoadingWords
              ? 'Đang tải từ vựng của bài học...'
              : 'Bài học này chưa có từ vựng.'
          }}
        </p>
      </div>

      <Transition v-else name="fade-slide" mode="out-in">
        <component
          :is="getCurrentComponent()"
          :key="currentView"
          :topic="topic"
          v-model:showTranslation="showTranslation"
          :topicId="topic.id"
          :paragraph="topic.paragraph"
          :flashcards="topicWords"
          :deck-key="topic.slug || topic.id"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, resolveComponent, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  topic: {
    id: string
    slug?: string | null
    title: string
    paragraph: string
    difficulty: string
    englishTranslation: string
    words?: VocabularyWord[]
  } & VocabularyWord
}>()

defineEmits(['back'])

const currentView = ref<'reading' | 'vocabulary' | 'flashcards'>('reading')
const showTranslation = ref(false)

// Từ vựng thật của bài. Trước đây chỗ này truyền `demoFlashcards` từ `~/mock-data`
// mà không kèm prop `demo`, nên lật thẻ giả (nghĩa tiếng Anh) sẽ POST
// /api/progress/word với wordId bịa. FK `UserWordProgress_wordId_fkey` chặn nên
// DB không nhiễm, nhưng mỗi lần lật thẻ là một request hỏng và localStorage vẫn
// ghi tiến độ cho từ không tồn tại.
const topicWords = ref<VocabularyWord[]>(props.topic.words ?? [])
const isLoadingWords = ref(false)

const loadTopicWords = async () => {
  if (topicWords.value.length || !props.topic.slug) return
  isLoadingWords.value = true
  try {
    const res: any = await $fetch(`/api/topics/${props.topic.slug}`)
    topicWords.value = Array.isArray(res?.words)
      ? res.words.filter((w: any) => w?.id && w?.word)
      : []
  } catch (err) {
    console.warn('Không tải được từ vựng của bài học:', err)
    topicWords.value = []
  } finally {
    isLoadingWords.value = false
  }
}

watch(
  () => props.topic.id,
  () => {
    topicWords.value = props.topic.words ?? []
    loadTopicWords()
  },
  { immediate: true },
)

const hasWords = computed(() => topicWords.value.length > 0)
const needsWords = computed(
  () => currentView.value === 'flashcards' || currentView.value === 'vocabulary',
)

const getCurrentComponent = () => {
  switch (currentView.value) {
    case 'reading':
      return resolveComponent('LayoutPageSectionProgressTextParagraph')
    case 'vocabulary':
      return resolveComponent('LayoutPageSectionProgressVocabularyExtractor')
    case 'flashcards':
      return resolveComponent('LayoutPageSectionFlashCardSection')
    default:
      return null
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
