<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Words Learned -->
    <Card class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-slate-900 border-blue-200 dark:border-blue-800">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-blue-700 dark:text-blue-400">Words Learned</CardTitle>
        <Icon name="mdi:trending-up" class="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {{ stats.wordsLearned }}
        </div>
        <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
          +{{ stats.learnedThisWeek }} this week
        </p>
      </CardContent>
    </Card>

    <!-- Current Streak -->
    <Card class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-slate-900 border-orange-200 dark:border-orange-800">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-orange-700 dark:text-orange-400">Current Streak</CardTitle>
        <Icon name="mdi:fire" class="h-4 w-4 text-orange-600 dark:text-orange-400" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-orange-900 dark:text-orange-100">
          {{ stats.currentStreak }}
        </div>
        <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">days in a row</p>
      </CardContent>
    </Card>

    <!-- Ready to Review (SRS) -->
    <NuxtLink to="/review" class="block">
      <Card class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-slate-900 border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:scale-[1.02] transition-all cursor-pointer shadow-sm relative group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            Cần Ôn SRS <Icon name="uil:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </CardTitle>
          <Icon name="mdi:brain" class="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            {{ stats.dueSrsCount }} <span class="text-sm font-normal text-purple-600 dark:text-purple-300">từ</span>
          </div>
          <p class="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
            Bấm để bắt đầu ôn ngay
          </p>
        </CardContent>
      </Card>
    </NuxtLink>

    <!-- Mastered Words -->
    <Card class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-200 dark:border-emerald-800">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-emerald-700 dark:text-emerald-400">Mastered</CardTitle>
        <Icon name="mdi:star" class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
          {{ stats.masteredCount }}
        </div>
        <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          {{ stats.masteryRate }}% mastery rate
        </p>
      </CardContent>
    </Card>

    <!-- Weekly Goal Progress -->
    <Card class="md:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg text-slate-900 dark:text-white">Weekly Goal</CardTitle>
          <Badge variant="outline" class="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
            {{ stats.weeklyGoalCurrent }}/{{ stats.weeklyGoalTarget }} words
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Progress this week</span>
            <span class="font-semibold text-primary-500">
              {{ Math.round((stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100) }}%
            </span>
          </div>
          <Progress :model-value="(stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100" class="h-3 bg-slate-200 dark:bg-slate-800" />
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {{ Math.max(0, stats.weeklyGoalTarget - stats.weeklyGoalCurrent) }} words remaining to reach your goal
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Study Time Today -->
    <Card class="md:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg text-slate-900 dark:text-white">Today's Study Time</CardTitle>
          <Icon name="mdi:calendar" class="h-5 w-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {{ studyTimeMinutes }} <span class="text-lg text-slate-500 dark:text-slate-400">minutes</span>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Keep it up! Your daily learning goal is on track.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
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
    const data = await $fetch<any>('/api/progress/stats?userId=user-demo-id')
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
