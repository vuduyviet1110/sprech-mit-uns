<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
  >
    <!-- Header -->
    <header
      class="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button variant="ghost" class="text-blue-600 hover:text-blue-800">
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

    <div class="container mx-auto px-4 py-8">
      <!-- Navigation Tabs -->
      <div class="flex gap-2 mb-6">
        <Button
          :class="{ 'bg-blue-600 text-white': currentView === 'reading' }"
          :variant="currentView === 'reading' ? 'default' : 'outline'"
          @click="currentView = 'reading'"
        >
          <Icon name="mdi:book-open-outline" class="h-4 w-4" />
          Reading
        </Button>
        <Button
          :class="{ 'bg-blue-600 text-white': currentView === 'vocabulary' }"
          :variant="currentView === 'vocabulary' ? 'default' : 'outline'"
          @click="currentView = 'vocabulary'"
        >
          <Icon name="mdi:book-open-outline" class="h-4 w-4" />
          Vocabulary
        </Button>
        <Button
          :class="{ 'bg-blue-600 text-white': currentView === 'flashcards' }"
          :variant="currentView === 'flashcards' ? 'default' : 'outline'"
          @click="currentView = 'flashcards'"
        >
          <Icon name="mdi:book-open-outline" class="h-4 w-4" />
          Practice
        </Button>
      </div>

      <!-- Content -->
      <Card
        v-if="currentView === 'reading'"
        class="bg-white/90 backdrop-blur-sm"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-2xl text-blue-900"
              >Reading Passage</CardTitle
            >
            <div class="flex gap-2">
              <Button
                variant="outline"
                class="border-blue-200"
                size="sm"
                @click="showTranslation = !showTranslation"
              >
                <!-- <component
                  :is="showTranslation ? EyeOff : Eye"
                  class="h-4 w-4"
                /> -->
                {{ showTranslation ? 'Hide' : 'Show' }} Translation
              </Button>
              <Button variant="outline" size="sm" class="border-blue-200">
                <Volume2 class="h-4 w-4" />
                Listen
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-6">
          <!-- German Text -->
          <div
            class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100"
          >
            <h3 class="text-lg font-semibold text-blue-900 mb-4">
              German Text
            </h3>
            <p class="text-lg leading-relaxed text-gray-800 font-medium">
              {{ topic.paragraph }}
            </p>
          </div>

          <!-- English Translation -->
          <div
            v-if="showTranslation"
            class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100"
          >
            <h3 class="text-lg font-semibold text-green-900 mb-4">
              English Translation
            </h3>
            <p class="text-lg leading-relaxed text-gray-700">
              {{ topic.englishTranslation }}
            </p>
          </div>

          <!-- Reading Tips -->
          <div
            class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-100"
          >
            <h3 class="text-lg font-semibold text-orange-900 mb-4">
              Reading Tips
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li>
                • Read the German text first without looking at the translation
              </li>
              <li>• Try to identify words you already know</li>
              <li>• Use context clues to guess unfamiliar words</li>
              <li>• Listen to the audio to improve pronunciation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <LayoutPageSectionProgressVocabularyExtractor
        v-if="currentView === 'vocabulary'"
        :paragraph="topic.paragraph"
        :topicId="topic.id"
      />
      <LayoutPageSectionFlashCardSection
        v-if="currentView === 'flashcards'"
        :flashcards="flashcardsData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { flashcardsData } from '~/mock-data'

const props = defineProps<{
  topic: {
    id: string
    title: string
    paragraph: string
    difficulty: string
    englishTranslation: string
  }
}>()

const currentView = ref<'reading' | 'vocabulary' | 'flashcards'>('reading')
const showTranslation = ref(false)
</script>
