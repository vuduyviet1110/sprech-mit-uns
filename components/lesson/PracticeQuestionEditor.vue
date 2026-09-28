<script lang="ts" setup>
import type { QuizQuestion, QuizQuestionType } from '~/utils/types'
import {
  type DraftQuizQuestion,
  emptyDraftQuestion,
  draftFromApi,
  draftToPayload,
} from '~/utils/quiz-draft'

const props = withDefaults(
  defineProps<{
    modelValue: DraftQuizQuestion[]
    topicId?: string | null
    canGenerate?: boolean
    title?: string
    showSave?: boolean
  }>(),
  {
    topicId: null,
    canGenerate: false,
    title: 'Câu hỏi Practice',
    showSave: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DraftQuizQuestion[]]
  saved: []
}>()

const questions = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const saving = ref(false)
const generating = ref(false)
const errorMsg = ref('')
const collapsed = ref(false)

const addQuestion = (type: QuizQuestionType = 'multiple_choice') => {
  questions.value = [...questions.value, emptyDraftQuestion(type)]
}

const removeQuestion = async (idx: number) => {
  const q = questions.value[idx]
  if (q?.id && props.topicId) {
    if (!confirm('Xóa câu hỏi này khỏi bài học?')) return
    try {
      await $fetch(`/api/quiz/topic/${props.topicId}?questionId=${q.id}`, { method: 'DELETE' })
    } catch (e: any) {
      errorMsg.value = e?.data?.message || e?.message || 'Không xóa được câu hỏi'
      return
    }
  }
  questions.value = questions.value.filter((_, i) => i !== idx)
  if (q?.id) emit('saved')
}

const setCorrectChoice = (qIdx: number, cIdx: number) => {
  questions.value = questions.value.map((q, i) => {
    if (i !== qIdx || !q.choices) return q
    return {
      ...q,
      choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === cIdx })),
    }
  })
}

const onTypeChange = (idx: number, type: string) => {
  const base = emptyDraftQuestion(type as QuizQuestionType)
  const prev = questions.value[idx]
  const next = [...questions.value]
  next[idx] = {
    ...base,
    id: prev?.id,
    text: prev?.text || base.text,
    level: prev?.level,
  }
  questions.value = next
}

const generateFromVocab = async () => {
  if (!props.topicId) return
  errorMsg.value = ''
  generating.value = true
  try {
    const res = await $fetch<{ questions: QuizQuestion[] }>(
      `/api/quiz/topic/${props.topicId}/generate`,
      { method: 'POST' },
    )
    questions.value = [...questions.value, ...(res.questions || []).map(draftFromApi)]
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Không sinh được câu hỏi từ từ vựng'
  } finally {
    generating.value = false
  }
}

const saveToTopic = async () => {
  if (!props.topicId) return
  errorMsg.value = ''
  saving.value = true
  try {
    const payloads = questions.value.map(draftToPayload)
    const saved: DraftQuizQuestion[] = []
    for (const p of payloads) {
      if (p.id) {
        const updated = await $fetch<QuizQuestion>(`/api/quiz/topic/${props.topicId}`, {
          method: 'PUT',
          body: p,
        })
        saved.push(draftFromApi(updated))
      } else {
        const created = await $fetch<QuizQuestion>(`/api/quiz/topic/${props.topicId}`, {
          method: 'POST',
          body: p,
        })
        saved.push(draftFromApi(created))
      }
    }
    questions.value = saved
    emit('saved')
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Lỗi khi lưu câu hỏi'
  } finally {
    saving.value = false
  }
}

defineExpose({ draftToPayload, saveToTopic })
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <button
        type="button"
        class="flex items-center gap-2 text-left cursor-pointer"
        @click="collapsed = !collapsed"
      >
        <Icon
          :name="collapsed ? 'uil:angle-right' : 'uil:angle-down'"
          class="w-5 h-5 text-slate-400"
        />
        <h4 class="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          {{ title }}
          <span class="text-slate-400 font-bold normal-case">({{ questions.length }})</span>
        </h4>
      </button>

      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-if="canGenerate && topicId"
          type="button"
          :disabled="generating"
          class="px-3 py-1.5 text-xs font-bold rounded-lg border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-all disabled:opacity-50 cursor-pointer"
          @click="generateFromVocab"
        >
          <span class="inline-flex items-center gap-1.5">
            <Icon v-if="generating" name="uil:spinner" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="uil:magic-wand" class="w-3.5 h-3.5" />
            Sinh từ từ vựng
          </span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          @click="addQuestion('multiple_choice')"
        >
          + Trắc nghiệm
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          @click="addQuestion('sentence_builder')"
        >
          + Ghép câu
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          @click="addQuestion('dictation')"
        >
          + Nghe chép
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          @click="addQuestion('typed_recall')"
        >
          + Gõ từ
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          @click="addQuestion('cloze')"
        >
          + Cloze
        </button>
      </div>
    </div>

    <p v-if="!canGenerate && !topicId" class="text-xs text-slate-500">
      Tự sinh từ từ vựng sẽ dùng được sau khi bài học đã có từ vựng (mở bài và bấm Quản lý câu hỏi).
    </p>

    <p v-if="errorMsg" class="text-xs font-bold text-red-600 dark:text-red-400">{{ errorMsg }}</p>

    <div v-show="!collapsed" class="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
      <div
        v-if="!questions.length"
        class="text-center py-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-500"
      >
        Chưa có câu hỏi. Thêm tay hoặc sinh từ từ vựng.
      </div>

      <div
        v-for="(q, qIdx) in questions"
        :key="q.id || qIdx"
        class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 space-y-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 flex-1">
            <span class="text-xs font-extrabold text-slate-400 w-6">#{{ qIdx + 1 }}</span>
            <select
              :value="q.type"
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
              @change="onTypeChange(qIdx, ($event.target as HTMLSelectElement).value)"
            >
              <option value="multiple_choice">Trắc nghiệm</option>
              <option value="sentence_builder">Ghép câu</option>
              <option value="dictation">Nghe chép</option>
              <option value="typed_recall">Gõ từ (recall)</option>
              <option value="cloze">Cloze</option>
            </select>
          </div>
          <button
            type="button"
            class="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
            title="Xóa câu hỏi"
            @click="removeQuestion(qIdx)"
          >
            <Icon name="uil:trash-alt" class="w-4 h-4" />
          </button>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Nội dung câu hỏi</label>
          <input
            v-model="q.text"
            type="text"
            class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
            placeholder="Câu hỏi..."
          />
        </div>

        <div v-if="q.type === 'multiple_choice' || !q.type" class="space-y-2">
          <label class="block text-sm font-bold text-slate-500 uppercase">Lựa chọn (chọn 1 đáp án đúng)</label>
          <div v-for="(c, cIdx) in q.choices" :key="cIdx" class="flex items-center gap-2">
            <input
              type="radio"
              :name="`correct-${qIdx}`"
              :checked="c.isCorrect"
              class="accent-primary-500"
              @change="setCorrectChoice(qIdx, cIdx)"
            />
            <input
              v-model="c.text"
              type="text"
              class="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              :placeholder="`Đáp án ${cIdx + 1}`"
            />
          </div>
        </div>

        <div v-else-if="q.type === 'sentence_builder'" class="space-y-2">
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Đáp án đúng (solution)</label>
            <input
              v-model="q.solution"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="Ich heiße Anna"
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Từ xáo trộn (cách nhau bằng dấu cách)</label>
            <input
              v-model="q.scrambleWordsText"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="heiße Ich Anna Tag"
            />
          </div>
        </div>

        <div v-else-if="q.type === 'dictation'" class="space-y-2">
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Câu nghe (target)</label>
            <input
              v-model="q.targetSentence"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="Guten Tag! Ich heiße Anna."
              @input="q.solution = q.targetSentence"
            />
          </div>
        </div>

        <div v-else-if="q.type === 'typed_recall'" class="space-y-2">
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Đáp án L2 (từ/cụm cần gõ)</label>
            <input
              v-model="q.solution"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="dům"
              @input="q.targetSentence = q.solution"
            />
          </div>
        </div>

        <div v-else-if="q.type === 'cloze'" class="space-y-2">
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Câu có ___ (hiển thị trong text câu hỏi)</label>
            <input
              v-model="q.targetSentence"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="Kde je ___ ?"
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-500 uppercase mb-1">Từ điền vào chỗ trống</label>
            <input
              v-model="q.solution"
              type="text"
              class="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
              placeholder="domov"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSave && topicId && questions.length" class="flex justify-end pt-1">
      <button
        type="button"
        :disabled="saving"
        class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
        @click="saveToTopic"
      >
        <Icon v-if="saving" name="uil:spinner" class="w-4 h-4 animate-spin" />
        <span>Lưu câu hỏi vào bài học</span>
      </button>
    </div>
  </div>
</template>
