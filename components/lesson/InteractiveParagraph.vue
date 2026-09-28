<script lang="ts" setup>
const props = defineProps<{
  text: string
  /** word -> meaning gloss map */
  glossMap?: Record<string, string>
}>()

const emit = defineEmits<{
  speak: [token: string]
}>()

const selected = ref<{ token: string; meaning: string } | null>(null)

const tokens = computed(() => {
  if (!props.text) return []
  // Keep punctuation attached loosely; split on whitespace
  return props.text.split(/(\s+)/).filter((t) => t.length > 0)
})

const normalizeKey = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFC')
    .replace(/^[„“"«»(]+|[.,!?;:…)”"»)]+$/g, '')

const lookup = (token: string): string | null => {
  if (!props.glossMap) return null
  const key = normalizeKey(token)
  if (!key || /^\s+$/.test(token)) return null
  if (props.glossMap[key]) return props.glossMap[key]
  // try without German/Czech article noise
  for (const [k, v] of Object.entries(props.glossMap)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return null
}

const onTokenClick = (token: string) => {
  if (/^\s+$/.test(token)) return
  const meaning = lookup(token)
  if (meaning) {
    selected.value = { token: normalizeKey(token) || token, meaning }
  } else {
    selected.value = {
      token: normalizeKey(token) || token,
      meaning: 'Chưa có gloss trong bài — thử từ điển.',
    }
  }
  emit('speak', normalizeKey(token) || token)
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-slate-800 dark:text-slate-200 text-lg md:text-xl leading-loose font-medium bg-slate-50 dark:bg-slate-950/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 tracking-wide">
      <template v-for="(tok, i) in tokens" :key="i">
        <button
          v-if="!/^\s+$/.test(tok)"
          type="button"
          class="inline rounded-md px-0.5 hover:bg-primary-100 dark:hover:bg-primary-950/60 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer border-b border-dotted border-primary-300/50 dark:border-primary-700/50"
          :class="
            selected && normalizeKey(tok) === selected.token
              ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
              : ''
          "
          @click="onTokenClick(tok)"
        >
          {{ tok }}
        </button>
        <span v-else>{{ tok }}</span>
      </template>
    </p>
    <div
      v-if="selected"
      class="flex items-start gap-3 p-3 rounded-xl bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/50"
    >
      <Icon name="lucide:book-open" class="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
      <div class="min-w-0 text-sm">
        <span class="font-extrabold text-slate-900 dark:text-white">{{ selected.token }}</span>
        <span class="text-slate-500 mx-1.5">·</span>
        <span class="font-medium text-slate-700 dark:text-slate-300">{{ selected.meaning }}</span>
      </div>
      <button
        type="button"
        class="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer"
        @click="selected = null"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
    </div>
    <p class="text-[11px] text-slate-400 font-medium">
      Chạm từ để xem nghĩa (gloss) và nghe phát âm — học theo ngữ cảnh.
    </p>
  </div>
</template>
