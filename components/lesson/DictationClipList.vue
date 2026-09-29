<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface Clip {
  id: number
  start: number
  end: number
  text?: string
  germanText?: string
  wordCount?: number
}

interface ClipState {
  done: boolean
  score: number
  attempts?: number
}

const props = defineProps<{
  clips: Clip[]
  currentIdx: number
  maxUnlockedIdx: number
  clipStates: Record<string, ClipState>
  totalSegments?: number
}>()

const emit = defineEmits<{ select: [index: number] }>()

const listEl = ref<HTMLElement | null>(null)

const doneCount = computed(
  () => Object.values(props.clipStates).filter((s) => s.done).length,
)

const percent = computed(() => {
  if (!props.clips.length) return 0
  return Math.round((doneCount.value / props.clips.length) * 100)
})

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

type Status = 'done' | 'current' | 'unlocked' | 'locked'

const statusOf = (index: number): Status => {
  if (index > props.maxUnlockedIdx) return 'locked'
  if (index === props.currentIdx) return 'current'
  if (props.clipStates[String(index)]?.done) return 'done'
  return 'unlocked'
}

const iconOf = (status: Status) => {
  switch (status) {
    case 'done':
      return 'lucide:circle-check'
    case 'current':
      return 'lucide:play-circle'
    case 'locked':
      return 'lucide:lock'
    default:
      return 'lucide:circle'
  }
}

const rowClass = (status: Status) => {
  const base =
    'w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5'
  switch (status) {
    case 'done':
      return `${base} cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 hover:border-primary-500`
    case 'current':
      return `${base} cursor-pointer bg-white dark:bg-slate-900 border-primary-500 ring-2 ring-primary-500/40`
    case 'locked':
      return `${base} bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 opacity-50 cursor-not-allowed`
    default:
      return `${base} cursor-pointer bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:border-primary-500`
  }
}

const iconClass = (status: Status) => {
  switch (status) {
    case 'done':
      return 'w-4 h-4 text-primary-500 shrink-0 mt-0.5'
    case 'current':
      return 'w-4 h-4 text-primary-500 shrink-0 mt-0.5 animate-pulse'
    case 'locked':
      return 'w-4 h-4 text-slate-400 shrink-0 mt-0.5'
    default:
      return 'w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5'
  }
}

const onSelect = (index: number) => {
  if (index > props.maxUnlockedIdx) return
  emit('select', index)
}

// Cuộn đoạn đang làm vào tầm nhìn
watch(
  () => props.currentIdx,
  async () => {
    await nextTick()
    const row = listEl.value?.querySelector<HTMLElement>(
      '[data-clip-current="true"]',
    )
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  },
)
</script>

<template>
  <div
    class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
  >
    <div class="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
        >
          <Icon name="lucide:list-ordered" class="w-4 h-4 text-primary-500" />
          <span>Danh Sách Câu</span>
        </span>
        <span class="text-[11px] font-extrabold text-primary-500">
          {{ doneCount }}/{{ clips.length }}
        </span>
      </div>

      <div
        class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
      >
        <div
          class="h-full bg-primary-500 rounded-full transition-all duration-300"
          :style="{ width: `${percent}%` }"
        />
      </div>

      <p
        v-if="totalSegments && totalSegments > clips.length"
        class="text-[10px] text-slate-400 italic"
      >
        Đang luyện {{ clips.length }}/{{ totalSegments }} câu của video
      </p>
    </div>

    <div ref="listEl" class="max-h-[520px] overflow-y-auto space-y-2 pr-1">
      <button
        v-for="(clip, index) in clips"
        :key="clip.id"
        type="button"
        :data-clip-current="index === currentIdx"
        :disabled="index > maxUnlockedIdx"
        :class="rowClass(statusOf(index))"
        @click="onSelect(index)"
      >
        <Icon
          :name="iconOf(statusOf(index))"
          :class="iconClass(statusOf(index))"
        />

        <div class="min-w-0 flex-1 space-y-0.5">
          <div class="flex items-center gap-2">
            <span
              class="text-[11px] font-extrabold text-slate-700 dark:text-slate-200"
            >
              Câu {{ index + 1 }}
            </span>
            <span class="text-[10px] font-mono text-slate-400">
              {{ formatTime(clip.start) }}–{{ formatTime(clip.end) }}
            </span>
            <span
              v-if="clipStates[String(index)]?.done"
              class="text-[10px] font-extrabold text-primary-500 ml-auto"
            >
              {{ clipStates[String(index)]!.score }}đ
            </span>
          </div>

          <!-- Chỉ hiện nội dung sau khi đã làm xong, tránh tiết lộ đáp án -->
          <p
            v-if="clipStates[String(index)]?.done"
            class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1"
          >
            {{ clip.text || clip.germanText }}
          </p>
          <p v-else class="text-[10px] text-slate-400 italic">
            {{ clip.wordCount ? `${clip.wordCount} từ` : 'Chưa luyện' }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
