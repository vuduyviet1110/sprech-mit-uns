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
  <div class="space-y-6 text-center max-w-xl mx-auto relative p-4 transition-colors">
    <p class="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
      <span v-html="fullSentence" />
    </p>

    <div class="flex justify-center gap-4">
      <div
        v-for="(word, i) in filledWords"
        :key="i"
        class="border-2 border-primary-500/50 bg-primary-50/50 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl min-w-[120px] cursor-pointer shadow-sm transition-all hover:border-primary-500"
        @drop="handleDrop($event, i)"
        @dragover="handleDragOver"
        @click="handleRemove(i)"
      >
        <input
          v-model="filledWords[i]"
          class="w-full text-center bg-transparent outline-none font-bold text-primary-900 dark:text-primary-300 text-lg"
          placeholder="___"
          @input="handleInput(i, $event.target?.value || '')"
        />
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-3 mt-4">
      <button
        v-for="(word, i) in options"
        :key="i"
        class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-xs disabled:opacity-30 hover:bg-primary-50 hover:border-primary-400 dark:hover:bg-slate-700 transition-all cursor-pointer"
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
        class="bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-bold px-8 py-3 rounded-xl disabled:opacity-40 shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
        :disabled="!isComplete"
        @click="handleSubmit"
      >
        Kểm tra đáp án (Submit)
      </button>
    </div>

    <div v-if="showCelebration && isCorrect" class="absolute inset-0 pointer-events-none">
      <LayoutPageLottieCelebration :show="showCelebration" />
    </div>

    <div v-if="showCelebration && !isCorrect" class="absolute inset-0 pointer-events-none">
      <LayoutPageLottieIncorrect :show="showCelebration" />
    </div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: #94a3b8;
  opacity: 1;
}
</style>
