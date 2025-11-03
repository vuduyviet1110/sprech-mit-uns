<script setup lang="ts">
const props = defineProps<{
  question: string
  answers: string[]
  correctAnswerIndex: number
}>()

const selectedIndex = ref<number | null>(null)
const showResult = ref(false)

const isCorrect = computed(() => {
  return selectedIndex.value === props.correctAnswerIndex
})

const emit = defineEmits<{
  (e: 'answered', payload: { correct: boolean; selectedIndex: number }): void
}>()

const submitAnswer = () => {
  if (selectedIndex.value !== null) {
    showResult.value = true
    emit('answered', {
      correct: isCorrect.value,
      selectedIndex: selectedIndex.value,
    })
  }
}

const getAnswerLabel = (index: number) => {
  return String.fromCharCode(65 + index)
}
</script>

<template>
  <div
    class="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 max-w-4xl mx-auto"
  >
    <!-- Question Section -->
    <div class="mb-8">
      <h3 class="text-xl font-medium text-gray-800 leading-relaxed">
        {{ question }}
      </h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div
        v-for="(answer, index) in answers"
        :key="index"
        class="group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
        :class="{
          // Default state
          'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50':
            !showResult && selectedIndex !== index,
          // Selected but not submitted
          'border-blue-400 bg-blue-100 shadow-sm':
            !showResult && selectedIndex === index,
          // Correct answer (after submission)
          'border-emerald-400 bg-emerald-50 shadow-emerald-100 shadow-lg':
            showResult && index === correctAnswerIndex,
          // Wrong selected answer (after submission)
          'border-red-400 bg-red-50 shadow-red-100 shadow-lg':
            showResult &&
            selectedIndex === index &&
            index !== correctAnswerIndex,
          // Other answers after submission
          'border-gray-200 bg-gray-50 opacity-60':
            showResult &&
            selectedIndex !== index &&
            index !== correctAnswerIndex,
          // Disabled state
          'cursor-not-allowed': showResult,
        }"
        @click="!showResult && (selectedIndex = index)"
      >
        <div class="flex items-start space-x-3">
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300"
            :class="{
              'bg-gray-200 text-gray-600':
                !showResult && selectedIndex !== index,
              'bg-blue-500 text-white': !showResult && selectedIndex === index,
              'bg-emerald-500 text-white':
                showResult && index === correctAnswerIndex,
              'bg-red-500 text-white':
                showResult &&
                selectedIndex === index &&
                index !== correctAnswerIndex,
              'bg-gray-200 text-gray-400':
                showResult &&
                selectedIndex !== index &&
                index !== correctAnswerIndex,
            }"
          >
            {{ getAnswerLabel(index) }}
          </div>

          <p class="text-gray-700 font-medium leading-relaxed flex-1">
            {{ answer }}
          </p>

          <div v-if="showResult" class="flex-shrink-0">
            <div
              v-if="index === correctAnswerIndex"
              class="w-6 h-6 text-emerald-500"
            >
              <svg
                class="w-full h-full"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div
              v-else-if="selectedIndex === index"
              class="w-6 h-6 text-red-500"
            >
              <svg
                class="w-full h-full"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button & Result Section -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <button
        class="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{
          'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 shadow-lg hover:shadow-xl':
            selectedIndex !== null && !showResult,
          'bg-gray-400': selectedIndex === null || showResult,
        }"
        :disabled="selectedIndex === null || showResult"
        @click="submitAnswer"
      >
        {{ showResult ? 'Submitted' : 'Submit Answer' }}
      </button>

      <!-- Result Message -->
      <div v-if="showResult" class="flex items-center space-x-2">
        <div
          v-if="isCorrect"
          class="flex items-center space-x-2 text-emerald-600"
        >
          <div class="w-7 h-7">
            <svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="font-semibold text-lg">Correct!</span>
        </div>
        <div v-else class="flex items-center space-x-2 text-red-600">
          <div class="w-7 h-7">
            <svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="font-semibold text-lg">Incorrect!</span>
        </div>
      </div>
    </div>
  </div>
</template>
