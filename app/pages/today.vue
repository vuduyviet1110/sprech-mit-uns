<script lang="ts" setup>
import { useDailyPath } from '~/composables/use-daily-path'
import { useDailyQuests } from '~/composables/use-daily-quests'
import { useSrsStore } from '~/stores/useSrsStore'
import { useLanguage } from '~/composables/use-language'
import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })
useHead({ title: 'Lộ trình hôm nay - Sprech Mit Uns' })

const {
  pathBlocks,
  pathCompletionCount,
  srsTodayProgress,
  dailyReviewTarget,
} = useDailyPath()
const { dailyQuests, syncSrsQuestTotal } = useDailyQuests()
const srsStore = useSrsStore()
const { currentLanguage } = useLanguage()
const { userId } = useSession()

syncSrsQuestTotal(dailyReviewTarget.value)

const { data: curriculum } = useFetch<{
  next: { slug: string; title: string; level: string; description?: string } | null
}>(() => `/api/curriculum/next?language=${currentLanguage.value}&userId=${userId.value || ''}`, {
  server: false,
  watch: [currentLanguage, userId],
})

onMounted(() => {
  srsStore.fetchDueCount(currentLanguage.value)
})

const pathPct = computed(() => Math.round((pathCompletionCount.value / 3) * 100))
const nextLesson = computed(() => curriculum.value?.next || null)
</script>

<template>
  <div class="relative w-full min-h-[calc(100vh-3.5rem)] overflow-x-clip" data-testid="today-page">
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute -top-16 -left-20 h-64 w-64 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-600/10" />
      <div class="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-700/10" />
    </div>

    <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8">
      <header class="space-y-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-[10px] font-extrabold uppercase tracking-wider">
          <Icon name="lucide:sun" class="w-3 h-3" />
          Daily Path · Low stress
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Lộ trình hôm nay
        </h1>
        <p class="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          15 phút SRS · 20 phút Shadowing · 15 phút Active Recall. Không cần chọn mode — làm lần lượt là đủ.
        </p>
      </header>

      <!-- Overall progress -->
      <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {{ pathCompletionCount }}/3 khối đã xong
          </p>
          <p class="text-xs font-bold text-slate-500 tabular-nums">{{ pathPct }}%</p>
        </div>
        <div class="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-primary-500 transition-all duration-500"
            :style="{ width: `${pathPct}%` }"
          />
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          SRS hôm nay:
          <span class="font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
            {{ srsTodayProgress.count }}/{{ srsTodayProgress.target }}
          </span>
          thẻ ·
          <span class="text-primary-600 dark:text-primary-400 font-bold">
            {{ srsStore.dueCount }} đến hạn
          </span>
        </p>
      </div>

      <!-- Three blocks -->
      <div class="space-y-4">
        <NuxtLink
          v-for="(block, idx) in pathBlocks"
          :key="block.id"
          :to="block.to"
          class="group flex gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-0.5"
          :class="
            block.completed
              ? 'border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400/60'
          "
        >
          <div
            class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-black"
            :class="block.completed ? 'bg-emerald-500' : 'bg-primary-500'"
          >
            <Icon v-if="block.completed" name="lucide:check" class="w-6 h-6" />
            <span v-else class="text-lg">{{ idx + 1 }}</span>
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-extrabold text-slate-900 dark:text-white">
                {{ block.title }}
              </h2>
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                {{ block.durationMin }} phút
              </span>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Icon :name="block.icon" class="w-3.5 h-3.5" />
              {{ block.subtitle }}
            </p>
          </div>
          <Icon
            name="lucide:chevron-right"
            class="w-5 h-5 text-slate-300 group-hover:text-primary-500 self-center shrink-0 transition-colors"
          />
        </NuxtLink>
      </div>

      <!-- Next curriculum lesson -->
      <NuxtLink
        v-if="nextLesson?.slug"
        :to="`/lesson?topic=${nextLesson.slug}`"
        class="group flex gap-4 p-5 rounded-2xl border border-primary-300/70 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 transition-all hover:-translate-y-0.5 hover:border-primary-500"
      >
        <div class="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary-500 text-white">
          <Icon name="lucide:book-marked" class="w-6 h-6" />
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-extrabold text-slate-900 dark:text-white">
              Bài tiếp theo · {{ nextLesson.title }}
            </h2>
            <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-500/15 text-primary-700 dark:text-primary-300">
              {{ nextLesson.level }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ nextLesson.description || 'Tiếp tục lộ trình A1–B1 theo ngôn ngữ đang chọn.' }}
          </p>
        </div>
        <Icon
          name="lucide:chevron-right"
          class="w-5 h-5 text-slate-300 group-hover:text-primary-500 self-center shrink-0 transition-colors"
        />
      </NuxtLink>

      <!-- Quests snippet -->
      <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:trophy" class="w-4 h-4 text-amber-500" />
          Nhiệm vụ ngày
        </h3>
        <ul class="space-y-2.5">
          <li
            v-for="q in dailyQuests.slice(0, 3)"
            :key="q.id"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span
              class="font-medium"
              :class="q.completed ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-slate-300'"
            >
              {{ q.title }}
            </span>
            <span class="text-xs font-bold tabular-nums text-slate-500 shrink-0">
              {{ q.progress }}/{{ q.total }}
            </span>
          </li>
        </ul>
        <NuxtLink
          to="/sub-menu/quizz"
          class="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Xem đấu trường & quests
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
