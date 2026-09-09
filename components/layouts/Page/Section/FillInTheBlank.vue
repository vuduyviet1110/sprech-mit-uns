<script setup lang="ts">
import { ref, computed } from 'vue'
import confetti from 'canvas-confetti'

const sentence = 'Ich ___ ein Buch ___.'
const options = ['lese', 'habe', 'das', 'gerne']
const blanksCount = 2
const correctAnswers = ['lese', 'gerne']

const filledWords = ref<string[]>(Array(blanksCount).fill(''))
const selectedOptions = ref<string[]>([])
const showCelebration = ref(false)

const handleDragStart = (event: DragEvent, word: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', word)
  }
}

const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  const word = event.dataTransfer?.getData('text/plain')
  if (
    word &&
    !selectedOptions.value.includes(word) &&
    filledWords.value[index] === ''
  ) {
    filledWords.value[index] = word
    selectedOptions.value.push(word)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleInput = (index: number, value: string) => {
  const prevWord = filledWords.value[index]
  filledWords.value[index] = value
  if (prevWord && selectedOptions.value.includes(prevWord)) {
    selectedOptions.value = selectedOptions.value.filter((w) => w !== prevWord)
  }
  if (
    value &&
    !selectedOptions.value.includes(value) &&
    options.includes(value)
  ) {
    selectedOptions.value.push(value)
  }
}

const handleSelect = (word: string) => {
  const index = filledWords.value.findIndex((w) => w === '')
  if (index !== -1 && !selectedOptions.value.includes(word)) {
    filledWords.value[index] = word
    selectedOptions.value.push(word)
  }
}

const handleRemove = (index: number) => {
  const word = filledWords.value[index]
  filledWords.value[index] = ''
  selectedOptions.value = selectedOptions.value.filter((w) => w !== word)
}

const isComplete = computed(() => !filledWords.value.includes(''))

const isCorrect = computed(() =>
  filledWords.value.every((word, i) => word === correctAnswers[i]),
)

const fullSentence = computed(() => {
  const parts = sentence.split('___')
  let result = ''
  for (let i = 0; i < parts.length; i++) {
    result += parts[i]
    if (i < parts.length - 1) {
      result += filledWords.value[i] || '___'
    }
  }
  return result
})

const handleSubmit = () => {
  if (isCorrect.value) {
    showCelebration.value = true
    confetti({
      particleCount: 550,
      spread: 200,
      origin: { y: 0.6 },
    })
    setTimeout(() => {
      showCelebration.value = false
    }, 3000)
  } else {
    showCelebration.value = true
    setTimeout(() => {
      showCelebration.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="space-y-6 text-center max-w-xl mx-auto relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm transition-colors">
    <p class="text-xl font-bold text-slate-800 dark:text-slate-100">
      <span v-html="fullSentence" />
    </p>

    <div class="flex justify-center gap-4">
      <div
        v-for="(word, i) in filledWords"
        :key="i"
        class="border border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-slate-800/80 px-4 py-2 rounded-xl min-w-[110px] cursor-pointer shadow-xs transition-colors"
        @drop="handleDrop($event, i)"
        @dragover="handleDragOver"
        @click="handleRemove(i)"
      >
        <input
          v-model="filledWords[i]"
          class="w-full text-center bg-transparent outline-none font-bold text-blue-900 dark:text-blue-300"
          placeholder="___"
          @input="handleInput(i, $event.target?.value || '')"
        />
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-3 mt-4">
      <button
        v-for="(word, i) in options"
        :key="i"
        class="bg-blue-100 dark:bg-slate-800 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-xs disabled:opacity-30 hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors"
        draggable="true"
        :disabled="selectedOptions.includes(word)"
        @click="handleSelect(word)"
        @dragstart="handleDragStart($event, word)"
      >
        {{ word }}
      </button>
    </div>

    <div class="mt-6">
      <button
        class="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl disabled:opacity-40 shadow-md transition-all"
        :disabled="!isComplete"
        @click="handleSubmit"
      >
        Submit
      </button>
    </div>

    <div v-if="showCelebration && isCorrect" class="absolute inset-0">
      <LayoutPageLottieCelebration :show="showCelebration" />
    </div>

    <div v-if="showCelebration && !isCorrect" class="absolute inset-0">
      <LayoutPageLottieIncorrect :show="showCelebration" />
    </div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: #a0aec0;
  opacity: 1;
}
</style>
