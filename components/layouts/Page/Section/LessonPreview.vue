<script lang="ts" setup>
import { ref } from 'vue'

const sampleLesson = {
  title: 'At the Restaurant',
  level: 'A2',
  vocabulary: [
    {
      english: 'Menu',
      german: 'Die Speisekarte',
      pronunciation: '/ˈʃpaɪzəˌkartə/',
      audio: 'speisekarte.mp3',
    },
    {
      english: 'Waiter',
      german: 'Der Kellner',
      pronunciation: '/ˈkɛlnɐ/',
      audio: 'kellner.mp3',
    },
    {
      english: 'Bill',
      german: 'Die Rechnung',
      pronunciation: '/ˈrɛçnʊŋ/',
      audio: 'rechnung.mp3',
    },
  ],
  sentences: [
    {
      english: 'Could I have the menu, please?',
      german: 'Könnte ich bitte die Speisekarte haben?',
      audio: 'sentence1.mp3',
    },
    {
      english: 'I would like to order.',
      german: 'Ich möchte gerne bestellen.',
      audio: 'sentence2.mp3',
    },
  ],
}

const currentStep = ref(0)
const showTranslation = ref(false)

const steps = ['Vocabulary', 'Sentences', 'Practice']

function playAudio(audioFile: string) {
  const audio = new Audio(`/audio/${audioFile}`)
  audio.play().catch((error) => {
    console.error('Cannot play audio:', error)
  })
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6 bg-white/80 backdrop-blur-sm p-4 rounded shadow">
      <div class="text-center mb-4 flex items-center justify-center gap-3">
        <span class="text-blue-600 text-2xl">📖</span>
        <h2 class="text-2xl text-blue-900 font-semibold">
          {{ sampleLesson.title }}
        </h2>
        <span class="bg-blue-100 text-blue-700 px-2 rounded">{{
          sampleLesson.level
        }}</span>
      </div>

      <!-- Progress Steps -->
      <div class="flex justify-center gap-4 mt-4">
        <div
          v-for="(step, index) in steps"
          :key="step"
          class="flex items-center"
        >
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              index <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500',
            ]"
          >
            {{ index + 1 }}
          </div>
          <span
            :class="[
              'ml-2 text-sm',
              index <= currentStep ? 'text-blue-600' : 'text-gray-500',
            ]"
          >
            {{ step }}
          </span>
          <template v-if="index < steps.length - 1">
            <span class="mx-3 text-gray-300">→</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Lesson Content -->
    <div class="bg-white/90 backdrop-blur-sm p-8 rounded shadow">
      <!-- Vocabulary Step -->
      <div v-if="currentStep === 0" class="space-y-6">
        <h3 class="text-xl font-semibold text-blue-900 mb-6">New Vocabulary</h3>
        <div
          v-for="(word, index) in sampleLesson.vocabulary"
          :key="index"
          class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-4">
              <span class="text-lg text-gray-700">{{ word.english }}</span>
              <span class="text-gray-400">→</span>
              <span class="text-xl font-semibold text-blue-900">{{
                word.german
              }}</span>
            </div>
            <button
              class="border border-blue-200 hover:bg-blue-50 p-1 rounded"
              aria-label="Play audio"
              @click="playAudio(word.audio)"
            >
              🔊
            </button>
          </div>
          <div class="text-sm text-gray-500">IPA: {{ word.pronunciation }}</div>
        </div>
      </div>

      <!-- Sentences Step -->
      <div v-if="currentStep === 1" class="space-y-6">
        <h3 class="text-xl font-semibold text-blue-900 mb-6">
          Example Sentences
        </h3>
        <div
          v-for="(sentence, index) in sampleLesson.sentences"
          :key="index"
          class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-700">{{ sentence.english }}</span>
              <button
                class="border border-green-200 hover:bg-green-50 p-1 rounded"
                @click="playAudio(sentence.audio)"
                aria-label="Play audio"
              >
                🔊
              </button>
            </div>
            <div class="text-lg font-medium text-green-900">
              {{ sentence.german }}
            </div>
          </div>
        </div>
      </div>

      <!-- Practice Step -->
      <div v-if="currentStep === 2" class="text-center space-y-6">
        <h3 class="text-xl font-semibold text-blue-900">Quick Practice</h3>
        <div
          class="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-lg border border-purple-100"
        >
          <p class="text-lg text-gray-700 mb-4">
            How do you say "Menu" in German?
          </p>
          <button
            v-if="!showTranslation"
            @click="showTranslation = true"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Show Answer
          </button>
          <div v-else class="space-y-4">
            <div class="text-2xl font-bold text-purple-900">
              Die Speisekarte
            </div>
            <button
              @click="showTranslation = false"
              class="border border-purple-200 hover:bg-purple-50 px-4 py-2 rounded flex items-center justify-center gap-2"
            >
              ↻ Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          @click="currentStep = Math.max(0, currentStep - 1)"
          :disabled="currentStep === 0"
        >
          Previous
        </button>
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          @click="currentStep = Math.min(2, currentStep + 1)"
          :disabled="currentStep === 2"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
