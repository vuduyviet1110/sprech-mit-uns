<script lang="ts" setup>
import { useSession } from '~/composables/use-session'

const { userId } = useSession()

const { data, pending, error, refresh } = useFetch(
  () => `/api/progress/forgetting-curve?userId=${userId.value || ''}`,
  { server: false, watch: [userId] },
)

const maxBucket = computed(() =>
  Math.max(1, ...(data.value?.intervalBuckets?.map((b: any) => b.count) || [1])),
)

const curvePoints = computed(() => {
  const curve = data.value?.retentionCurve || []
  if (!curve.length) return ''
  const w = 320
  const h = 100
  const pad = 8
  return curve
    .map((p: any, i: number) => {
      const x = pad + (i / Math.max(curve.length - 1, 1)) * (w - pad * 2)
      const y = h - pad - p.retention * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const day0 = computed(() => data.value?.retentionCurve?.[0]?.pct ?? 100)
const day7 = computed(() => data.value?.retentionCurve?.[7]?.pct ?? 0)
const day30 = computed(() => data.value?.retentionCurve?.[30]?.pct ?? 0)
</script>

<template>
  <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:activity" class="w-5 h-5 text-primary-500" />
          Đường cong quên (ước lượng)
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
          Dựa trên khoảng cách ôn SM-2 hiện tại — càng ôn đều, “độ bền” trung bình càng cao. Không khóa học khi thấp.
        </p>
      </div>
      <button
        type="button"
        class="text-xs font-bold text-slate-500 hover:text-primary-600 cursor-pointer"
        @click="refresh()"
      >
        Làm mới
      </button>
    </div>

    <div v-if="pending" class="py-10 text-center text-sm font-bold text-slate-500">
      Đang tải…
    </div>
    <div v-else-if="error || !data?.total" class="py-8 text-center text-sm text-slate-500">
      Chưa có dữ liệu SRS để vẽ đường cong. Hãy ôn vài thẻ trước.
    </div>
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Đang học</p>
          <p class="text-xl font-black text-slate-900 dark:text-white tabular-nums">{{ data.summary.learning }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Đang ôn</p>
          <p class="text-xl font-black text-slate-900 dark:text-white tabular-nums">{{ data.summary.reviewing }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Thành thạo</p>
          <p class="text-xl font-black text-primary-600 tabular-nums">{{ data.summary.mastered }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Interval TB</p>
          <p class="text-xl font-black text-slate-900 dark:text-white tabular-nums">{{ data.summary.avgInterval }}d</p>
        </div>
      </div>

      <!-- Retention curve SVG -->
      <div class="space-y-2">
        <div class="flex justify-between text-[11px] font-bold text-slate-500">
          <span>Ước lượng nhớ: hôm nay {{ day0 }}%</span>
          <span>7 ngày {{ day7 }}% · 30 ngày {{ day30 }}%</span>
        </div>
        <svg viewBox="0 0 320 100" class="w-full h-28 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <path
            :d="curvePoints"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="text-primary-500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- Interval distribution -->
      <div class="space-y-2">
        <p class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Phân bố khoảng cách ôn</p>
        <div class="space-y-2">
          <div
            v-for="b in data.intervalBuckets"
            :key="b.id"
            class="flex items-center gap-3"
          >
            <span class="w-24 shrink-0 text-[11px] font-bold text-slate-600 dark:text-slate-300">{{ b.label }}</span>
            <div class="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all"
                :style="{ width: `${Math.max(4, (b.count / maxBucket) * 100)}%` }"
              />
            </div>
            <span class="w-12 text-right text-[11px] font-extrabold tabular-nums text-slate-700 dark:text-slate-200">
              {{ b.count }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
