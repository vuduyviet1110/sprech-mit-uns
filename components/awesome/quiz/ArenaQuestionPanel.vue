<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { speakText } from '~/composables/useTTS'
import { useLanguage } from '~/composables/use-language'

const props = defineProps<{
  question: any
  /** When true, MC click submits immediately (Speed Quiz / Boss). */
  autoSubmitMc?: boolean
}>()

const emit = defineEmits<{
  answered: [payload: { isCorrect: boolean; selectedIndex: number }]
}>()

const { currentLanguage } = useLanguage()

const isSubmitted = ref(false)
const selectedChoiceIdx = ref<number | null>(null)
const selectedWords = ref<string[]>([])
const selectedOptions = ref<string[]>([])
const inputSentence = ref('')
const isCurrentCorrect = ref(false)

const qType = computed(() => props.question?.type || 'multiple_choice')

const canSubmit = computed(() => {
  if (!props.question || isSubmitted.value) return false
  if (qType.value === 'multiple_choice') return selectedChoiceIdx.value !== null
  if (qType.value === 'sentence_builder') {
    return selectedWords.value.length > 0 && selectedWords.value.every((w) => !!w)
  }
  if (
    qType.value === 'dictation' ||
    qType.value === 'typed_recall' ||
    qType.value === 'cloze'
  ) {
    return inputSentence.value.trim().length > 0
  }
  return false
})

const resetLocalState = () => {
  isSubmitted.value = false
  selectedChoiceIdx.value = null
  inputSentence.value = ''
  isCurrentCorrect.value = false
  selectedOptions.value = []

  if (props.question?.type === 'sentence_builder') {
    const wordCount = props.question.scrambleWords?.length || 3
    selectedWords.value = Array(wordCount).fill('')
  } else {
    selectedWords.value = []
  }
}

watch(() => props.question?.id, resetLocalState, { immediate: true })

const speakTarget = () => {
  const text = props.question?.targetSentence || props.question?.solution || ''
  if (!text) return
  const lang = currentLanguage.value === 'cs' ? 'cs-CZ' : 'de-DE'
  if (props.question?.audioUrl) {
    const audio = new Audio(props.question.audioUrl)
    audio.play().catch(() => speakText(text, lang))
  } else {
    speakText(text, lang)
  }
}

const handleSelectOption = (word: string) => {
  if (selectedOptions.value.includes(word) || isSubmitted.value) return
  const emptyIndex = selectedWords.value.findIndex((w) => !w)
  if (emptyIndex !== -1) {
    selectedWords.value[emptyIndex] = word
  } else {
    selectedWords.value.push(word)
  }
  selectedOptions.value.push(word)
}

const removeWord = (index: number) => {
  if (isSubmitted.value) return
  const word = selectedWords.value[index]
  selectedWords.value[index] = ''
  selectedOptions.value = selectedOptions.value.filter((w) => w !== word)
}

const evaluate = (): boolean => {
  const q = props.question
  if (!q) return false

  if (qType.value === 'multiple_choice') {
    const choice = q.choices?.find((c: any) => c.index === selectedChoiceIdx.value)
    return !!choice?.isCorrect
  }

  if (qType.value === 'sentence_builder') {
    const userBuilt = selectedWords.value.join(' ').trim().toLowerCase()
    const solution = (q.solution || q.targetSentence || '').trim().toLowerCase()
    return userBuilt === solution
  }

  if (qType.value === 'dictation' || qType.value === 'typed_recall' || qType.value === 'cloze') {
    const clean = (s: string) =>
      s.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    return clean(inputSentence.value) === clean(q.solution || q.targetSentence || '')
  }

  return false
}

const finishAnswer = (isCorrect: boolean) => {
  if (isSubmitted.value) return
  isSubmitted.value = true
  isCurrentCorrect.value = isCorrect
  emit('answered', {
    isCorrect,
    selectedIndex: selectedChoiceIdx.value ?? 0,
  })
}

const selectChoice = (index: number) => {
  if (isSubmitted.value) return
  selectedChoiceIdx.value = index
  if (props.autoSubmitMc) {
    finishAnswer(evaluate())
  }
}

const submitAnswer = () => {
  if (!canSubmit.value) return
  finishAnswer(evaluate())
}

defineExpose({ resetLocalState, isSubmitted })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 flex-wrap">
      <span
        class="px-2.5 py-0.5 text-xs font-extrabold rounded-lg uppercase tracking-wider"
        :class="
          qType === 'dictation'
            ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
            : qType === 'sentence_builder'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : qType === 'typed_recall'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : qType === 'cloze'
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        "
      >
        {{
          qType === 'dictation'
            ? 'Nghe chép'
            : qType === 'sentence_builder'
              ? 'Ghép câu'
              : qType === 'typed_recall'
                ? 'Gõ từ'
                : qType === 'cloze'
                  ? 'Cloze'
                  : 'Trắc nghiệm'
        }}
      </span>
    </div>

    <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
      {{ question.text }}
    </h3>

    <!-- Multiple choice -->
    <div v-if="qType === 'multiple_choice'" class="space-y-3">
      <button
        v-for="choice in question.choices"
        :key="choice.id"
        type="button"
        @click="selectChoice(choice.index)"
        :disabled="isSubmitted"
        :class="[
          'w-full text-left p-4 rounded-xl border-2 font-bold text-base transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-98',
          selectedChoiceIdx === choice.index
            ? isSubmitted
              ? choice.isCorrect
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
              : 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
            : isSubmitted && choice.isCorrect
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200',
        ]"
      >
        <span>{{ choice.text }}</span>
        <Icon v-if="isSubmitted && choice.isCorrect" name="lucide:circle-check" class="w-6 h-6 text-emerald-500" />
      </button>
    </div>

    <!-- Sentence builder -->
    <div v-else-if="qType === 'sentence_builder'" class="space-y-5 text-center">
      <div class="flex flex-wrap justify-center items-center gap-2.5 min-h-[64px] p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80">
        <button
          v-for="(word, i) in selectedWords"
          :key="i"
          type="button"
          class="border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-100/80 dark:bg-emerald-950/80 px-3.5 py-2.5 rounded-xl min-w-[70px] font-extrabold text-emerald-900 dark:text-emerald-200 cursor-pointer"
          @click="removeWord(i)"
        >
          {{ word || '---' }}
        </button>
      </div>

      <div class="flex flex-wrap justify-center gap-2.5">
        <button
          v-for="(word, i) in question.scrambleWords || []"
          :key="`${word}-${i}`"
          type="button"
          :disabled="isSubmitted || selectedOptions.includes(word)"
          :class="[
            'px-4 py-2.5 rounded-xl font-extrabold text-base border transition-all cursor-pointer',
            selectedOptions.includes(word)
              ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 opacity-40 cursor-not-allowed border-slate-200'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400 active:scale-95',
          ]"
          @click="handleSelectOption(word)"
        >
          {{ word }}
        </button>
      </div>

      <div
        v-if="isSubmitted"
        class="p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        :class="
          isCurrentCorrect
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300'
        "
      >
        <Icon :name="isCurrentCorrect ? 'lucide:circle-check' : 'lucide:circle-x'" class="w-5 h-5" />
        <span>
          {{
            isCurrentCorrect
              ? 'Ghép câu chính xác!'
              : `Đáp án đúng: "${question.solution || question.targetSentence}"`
          }}
        </span>
      </div>
    </div>

    <!-- Dictation -->
    <div v-else-if="qType === 'dictation'" class="space-y-5 text-center">
      <button
        type="button"
        @click="speakTarget"
        class="px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-base rounded-2xl shadow-md transition-all active:scale-95 inline-flex items-center gap-3 cursor-pointer"
      >
        <Icon name="lucide:volume-2" class="w-7 h-7 animate-pulse" />
        <span>Bấm để nghe phát âm</span>
      </button>

      <input
        v-model="inputSentence"
        :disabled="isSubmitted"
        type="text"
        placeholder="Gõ lại chính xác câu bạn nghe được..."
        class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-lg focus:outline-hidden focus:border-primary-500 transition-all text-center"
        @keydown.enter.prevent="submitAnswer"
      />

      <div
        v-if="isSubmitted"
        class="p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        :class="
          isCurrentCorrect
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300'
        "
      >
        <Icon :name="isCurrentCorrect ? 'lucide:circle-check' : 'lucide:circle-x'" class="w-5 h-5" />
        <span>
          {{
            isCurrentCorrect
              ? 'Chính xác hoàn hảo!'
              : `Đáp án đúng: "${question.solution || question.targetSentence}"`
          }}
        </span>
      </div>
    </div>

    <!-- Typed recall / Cloze -->
    <div v-else-if="qType === 'typed_recall' || qType === 'cloze'" class="space-y-5 text-center">
      <input
        v-model="inputSentence"
        :disabled="isSubmitted"
        type="text"
        :placeholder="qType === 'cloze' ? 'Điền từ còn thiếu…' : 'Gõ từ/cụm bằng trí nhớ…'"
        class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-lg focus:outline-hidden focus:border-primary-500 transition-all text-center"
        @keydown.enter.prevent="submitAnswer"
      />

      <div
        v-if="isSubmitted"
        class="p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        :class="
          isCurrentCorrect
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
        "
      >
        <Icon :name="isCurrentCorrect ? 'lucide:circle-check' : 'lucide:info'" class="w-5 h-5" />
        <span>
          {{
            isCurrentCorrect
              ? 'Đúng rồi!'
              : `Gợi ý đáp án: "${question.solution || question.targetSentence}" — lỗi cũng là tín hiệu học.`
          }}
        </span>
      </div>
    </div>

    <!-- Submit for non-auto MC / typed modes -->
    <div
      v-if="!isSubmitted && (qType !== 'multiple_choice' || !autoSubmitMc)"
      class="flex justify-end pt-2"
    >
      <button
        type="button"
        @click="submitAnswer"
        :disabled="!canSubmit"
        class="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
      >
        Kiểm tra đáp án
      </button>
    </div>
  </div>
</template>
