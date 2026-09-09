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
    <div class="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors">
      <div class="text-center mb-4 flex items-center justify-center gap-3">
        <span class="text-blue-600 dark:text-blue-400 text-2xl">📖</span>
        <h2 class="text-2xl text-slate-900 dark:text-white font-bold">
          {{ sampleLesson.title }}
        </h2>
        <span class="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-xs px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">{{
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
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              index <= currentStep
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
            ]"
          >
            {{ index + 1 }}
          </div>
          <span
            :class="[
              'ml-2 text-sm font-medium',
              index <= currentStep ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400',
            ]"
          >
            {{ step }}
          </span>
          <template v-if="index < steps.length - 1">
            <span class="mx-3 text-slate-300 dark:text-slate-700">→</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Lesson Content -->
    <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors">
      <div v-if="currentStep === 0" class="space-y-6">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">New Vocabulary</h3>
        <div
          v-for="(word, index) in sampleLesson.vocabulary"
          :key="index"
          class="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/90 dark:to-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700/70"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-4">
              <span class="text-lg text-slate-700 dark:text-slate-300 font-medium">{{ word.word }}</span>
              <span class="text-slate-400 dark:text-slate-500">→</span>
              <span class="text-xl font-bold text-blue-900 dark:text-blue-300">{{
                word.meaning
              }}</span>
            </div>
            <button
              class="border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-1.5 rounded-lg transition-colors"
              aria-label="Play audio"
              @click="playAudioOrSpeak(word)"
            >
              🔊
            </button>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">IPA: {{ word.example }}</div>
        </div>
      </div>

      <!-- Sentences Step -->
      <div v-if="currentStep === 1" class="space-y-6">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Example Sentences
        </h3>
        <div
          v-for="(sentence, index) in sampleLesson.sentences"
          :key="index"
          class="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-slate-800/90 dark:to-emerald-950/40 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/60"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-700 dark:text-slate-300 font-medium">{{ sentence.word }}</span>
              <button
                class="border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 p-1.5 rounded-lg transition-colors"
                aria-label="Play audio"
                @click="playAudioOrSpeak(sentence)"
              >
                🔊
              </button>
            </div>
            <div class="text-lg font-bold text-emerald-900 dark:text-emerald-300">
              {{ sentence.meaning }}
            </div>
          </div>
        </div>
      </div>

      <!-- Practice Step -->
      <div v-if="currentStep === 2" class="text-center space-y-6">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Quick Practice</h3>
        <div
          class="bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-slate-800/90 dark:to-purple-950/40 p-8 rounded-xl border border-purple-100 dark:border-purple-800/60"
        >
          <p class="text-lg text-slate-800 dark:text-slate-200 mb-4 font-medium">
            How do you say "Menu" in German?
          </p>
          <button
            v-if="!showTranslation"
            class="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            @click="showTranslation = true"
          >
            Show Answer
          </button>
          <div v-else class="space-y-4">
            <div class="text-2xl font-extrabold text-purple-900 dark:text-purple-300">
              Die Speisekarte
            </div>
            <button
              class="border border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors"
              @click="showTranslation = false"
            >
              ↻ Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
          :disabled="currentStep === 0"
          @click="currentStep = Math.max(0, currentStep - 1)"
        >
          Previous
        </button>
        <button
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
          :disabled="currentStep === 2"
          @click="currentStep = Math.min(2, currentStep + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
