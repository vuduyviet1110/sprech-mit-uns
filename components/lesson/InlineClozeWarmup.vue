<script lang="ts" setup>
import { fuzzyMatch } from '~/utils/fuzzy-text'

const props = defineProps<{
  words: { word: string; meaning: string; example?: string | null }[]
}>()

interface ClozeItem {
  prompt: string
  solution: string
  meaning: string
}

const items = computed<ClozeItem[]>(() => {
  const out: ClozeItem[] = []
  for (const w of props.words || []) {
    if (!w.example?.trim() || !w.word?.trim()) continue
    const example = w.example.replace(/[„“"«»]/g, '').trim()
    const escaped = w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'i')
    if (!re.test(example)) continue
    out.push({
      prompt: example.replace(re, '___'),
      solution: w.word,
      meaning: w.meaning,
    })
    if (out.length >= 2) break
  }
  return out
})

const answers = ref<string[]>([])
const checked = ref<boolean[]>([])
const results = ref<('exact' | 'close' | 'miss' | null)[]>([])

watch(
  items,
  (list) => {
    answers.value = list.map(() => '')
    checked.value = list.map(() => false)
    results.value = list.map(() => null)
  },
  { immediate: true },
)

const check = (idx: number) => {
  const item = items.value[idx]
  if (!item) return
  const { level } = fuzzyMatch(answers.value[idx] || '', item.solution)
  results.value[idx] = level
  checked.value[idx] = true
}
</script>

<template>
  <div v-if="items.length" class="space-y-4">
    <h4 class="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
      <Icon name="lucide:text-cursor-input" class="w-4 h-4 text-sky-500" />
      Cloze nhanh trước khi Practice
    </h4>
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 space-y-2"
    >
      <p class="text-base font-bold text-slate-800 dark:text-slate-100">{{ item.prompt }}</p>
      <p class="text-xs text-slate-500">Gợi ý nghĩa: {{ item.meaning }}</p>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="answers[idx]"
          type="text"
          class="flex-1 min-w-[140px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
          placeholder="Điền từ…"
          @keydown.enter.prevent="check(idx)"
        />
        <button
          type="button"
          class="px-3 py-2 rounded-lg bg-sky-500 text-white text-xs font-extrabold cursor-pointer"
          @click="check(idx)"
        >
          Kiểm
        </button>
      </div>
      <p
        v-if="checked[idx]"
        class="text-xs font-bold"
        :class="{
          'text-emerald-600': results[idx] === 'exact' || results[idx] === 'close',
          'text-amber-600': results[idx] === 'miss',
        }"
      >
        <template v-if="results[idx] === 'exact'">Đúng!</template>
        <template v-else-if="results[idx] === 'close'">Gần đúng — đáp án: {{ item.solution }}</template>
        <template v-else>Đáp án: {{ item.solution }} — không sao, tiếp tục nhé.</template>
      </p>
    </div>
  </div>
</template>
