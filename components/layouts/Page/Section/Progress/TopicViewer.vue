<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
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

      <Transition name="fade-slide" mode="out-in">
        <component
          :is="getCurrentComponent()"
          :key="currentView"
          :topic="topic"
          v-model:showTranslation="showTranslation"
          :topicId="topic.id"
          :paragraph="topic.paragraph"
          :flashcards="demoFlashcards"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, resolveComponent } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { demoFlashcards } from '~/mock-data'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  topic: {
    id: string
    title: string
    paragraph: string
    difficulty: string
    englishTranslation: string
  } & VocabularyWord
}>()

defineEmits(['back'])

const currentView = ref<'reading' | 'vocabulary' | 'flashcards'>('reading')
const showTranslation = ref(false)

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
