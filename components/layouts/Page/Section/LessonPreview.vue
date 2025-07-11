<script lang="ts" setup>
import { ref } from 'vue'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { sampleLesson } from '~/mock-data'

const currentStep = ref(0)
const showTranslation = ref(false)
const {
  playingWord,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()
const steps = ['Vocabulary', 'Sentences', 'Practice']
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
      <div v-if="currentStep === 0" class="space-y-6">
        <h3 class="text-xl font-semibold text-blue-900 mb-6">New Vocabulary</h3>
        <div
          v-for="(word, index) in sampleLesson.vocabulary"
          :key="index"
          class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-4">
              <span class="text-lg text-gray-700">{{ word.word }}</span>
              <span class="text-gray-400">→</span>
              <span class="text-xl font-semibold text-blue-900">{{
                word.meaning
              }}</span>
            </div>
            <button
              class="border border-blue-200 hover:bg-blue-50 p-1 rounded"
              aria-label="Play audio"
              @click="playAudioOrSpeak(word)"
            >
              🔊
            </button>
          </div>
          <div class="text-sm text-gray-500">IPA: {{ word.example }}</div>
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
              <span class="text-gray-700">{{ sentence.word }}</span>
              <button
                class="border border-green-200 hover:bg-green-50 p-1 rounded"
                aria-label="Play audio"
                @click="playAudioOrSpeak(sentence)"
              >
                🔊
              </button>
            </div>
            <div class="text-lg font-medium text-green-900">
              {{ sentence.meaning }}
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
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            @click="showTranslation = true"
          >
            Show Answer
          </button>
          <div v-else class="space-y-4">
            <div class="text-2xl font-bold text-purple-900">
              Die Speisekarte
            </div>
            <button
              class="border border-purple-200 hover:bg-purple-50 px-4 py-2 rounded flex items-center justify-center gap-2"
              @click="showTranslation = false"
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
          :disabled="currentStep === 0"
          @click="currentStep = Math.max(0, currentStep - 1)"
        >
          Previous
        </button>
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          :disabled="currentStep === 2"
          @click="currentStep = Math.min(2, currentStep + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
