<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Words Learned -->
    <div class="smu-surface p-5 border-blue-200/80 dark:border-blue-800">
      <div class="flex flex-row items-center justify-between pb-2">
        <p class="text-sm font-bold text-blue-700 dark:text-blue-400">Words Learned</p>
        <Icon name="lucide:trending-up" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div class="text-2xl font-extrabold text-blue-900 dark:text-blue-100">
        {{ stats.wordsLearned }}
      </div>
      <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
        +{{ stats.learnedThisWeek }} this week
      </p>
    </div>

    <!-- Current Streak -->
    <div class="smu-surface p-5 border-amber-200/80 dark:border-amber-800">
      <div class="flex flex-row items-center justify-between pb-2">
        <p class="text-sm font-bold text-amber-700 dark:text-amber-400">Current Streak</p>
        <Icon name="lucide:flame" class="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div class="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
        {{ stats.currentStreak }}
      </div>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">days in a row</p>
    </div>

    <!-- Ready to Review (SRS) -->
    <NuxtLink to="/review" class="block group">
      <div class="smu-surface p-5 border-primary-200/80 dark:border-primary-800 hover:border-primary-500/50 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer">
        <div class="flex flex-row items-center justify-between pb-2">
          <p class="text-sm font-extrabold text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
            Cần Ôn SRS <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </p>
          <Icon name="lucide:brain" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="text-3xl font-extrabold text-primary-900 dark:text-primary-100">
          {{ stats.dueSrsCount }} <span class="text-sm font-normal text-primary-600 dark:text-primary-300">từ</span>
        </div>
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
          Bấm để bắt đầu ôn ngay
        </p>
      </div>
    </NuxtLink>

    <!-- Mastered Words (SRS-only) -->
    <div class="smu-surface p-5 border-emerald-200/80 dark:border-emerald-800">
      <div class="flex flex-row items-center justify-between pb-2">
        <p class="text-sm font-bold text-emerald-700 dark:text-emerald-400">Đã thuộc (SRS)</p>
        <Icon name="lucide:star" class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div class="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
        {{ stats.masteredCount }}
      </div>
      <p class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
        {{ stats.masteryRate }}% · ôn thưa ≥30 ngày sau khi master
      </p>
    </div>

    <!-- Weekly Goal Progress -->
    <div class="smu-surface md:col-span-2 p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-lg font-extrabold text-slate-900 dark:text-white">Weekly Goal</p>
        <span class="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-bold text-blue-700 dark:text-blue-400">
          {{ stats.weeklyGoalCurrent }}/{{ stats.weeklyGoalTarget }} words
        </span>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Progress this week</span>
          <span class="font-semibold text-primary-500">
            {{ Math.round((stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100) }}%
          </span>
        </div>
        <Progress :model-value="(stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100" class="h-3 bg-slate-200 dark:bg-slate-800" />
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {{ Math.max(0, stats.weeklyGoalTarget - stats.weeklyGoalCurrent) }} words remaining to reach your goal
        </p>
      </div>
    </div>

    <!-- Study Time Today -->
    <div class="smu-surface md:col-span-2 p-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-lg font-extrabold text-slate-900 dark:text-white">Today's Study Time</p>
        <Icon name="lucide:calendar" class="h-5 w-5 text-slate-400" />
      </div>
      <div class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        {{ studyTimeMinutes }} <span class="text-lg text-slate-500 dark:text-slate-400 font-bold">minutes</span>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Keep it up! Your daily learning goal is on track.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Progress } from '~/components/ui/progress'

const stats = ref({
  wordsLearned: 0,
  learnedThisWeek: 0,
  masteredCount: 0,
  masteryRate: 0,
  currentStreak: 0,
  dueSrsCount: 0,
  weeklyGoalTarget: 50,
  weeklyGoalCurrent: 0,
  totalVocabWords: 0,
})

const studyTimeMinutes = ref(15)

onMounted(async () => {
  try {
    const { userId } = useSession()
    if (!userId.value) return
    const data = await $fetch<any>(`/api/progress/stats?userId=${userId.value}`)
    if (data) {
      stats.value = data
      // Calculate dynamic study time based on words learned (approx 1.5 min per word)
      studyTimeMinutes.value = Math.max(10, Math.round(data.wordsLearned * 1.5))
    }
  } catch (e) {
    console.error('Failed to fetch progress stats:', e)
  }
})
</script>
