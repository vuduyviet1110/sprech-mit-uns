<script lang="ts" setup>
import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })
useHead({ title: 'Hồ Sơ Học Viên - Sprech Mit Uns' })

const { userId, fetchMe, isAuthenticated } = useSession()

const me = ref<{ email: string | null; createdAt?: string } | null>(null)
const stats = ref({
  wordsLearned: 0,
  masteredCount: 0,
  currentStreak: 0,
  dueSrsCount: 0,
  quizWins: 0,
  learnedThisWeek: 0,
})
const loading = ref(true)

onMounted(async () => {
  try {
    const profile = await fetchMe()
    me.value = profile
    if (userId.value) {
      const data = await $fetch<typeof stats.value>(`/api/progress/stats?userId=${userId.value}`)
      stats.value = {
        wordsLearned: data.wordsLearned || 0,
        masteredCount: data.masteredCount || 0,
        currentStreak: data.currentStreak || 0,
        dueSrsCount: data.dueSrsCount || 0,
        quizWins: data.quizWins || 0,
        learnedThisWeek: data.learnedThisWeek || 0,
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const displayName = computed(() => {
  if (!me.value?.email) return 'Học viên'
  return me.value.email.split('@')[0] || 'Học viên'
})

const joinLabel = computed(() => {
  if (!me.value?.createdAt) return '—'
  const d = new Date(me.value.createdAt)
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
})

const achievements = computed(() => [
  {
    id: 1,
    title: 'Người mới bắt đầu',
    desc: 'Học ít nhất 50 từ vựng',
    icon: 'lucide:award',
    unlocked: stats.value.wordsLearned >= 50,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/80',
  },
  {
    id: 2,
    title: 'Chuỗi học 3 ngày',
    desc: 'Duy trì streak ≥ 3',
    icon: 'lucide:flame',
    unlocked: stats.value.currentStreak >= 3,
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/80',
  },
  {
    id: 3,
    title: 'Thành thạo SRS',
    desc: 'Thuộc sâu ≥ 20 từ (isMastered)',
    icon: 'lucide:brain',
    unlocked: stats.value.masteredCount >= 20,
    color: 'text-primary-500 bg-emerald-50 dark:bg-emerald-950/80',
  },
])
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div class="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
        <div class="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              User Profile & Stats
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hồ Sơ Học Viên
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              Thống kê tiến trình thật từ tài khoản của bạn.
            </p>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-500 font-bold">Đang tải hồ sơ…</div>

        <div v-else-if="!isAuthenticated" class="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-6">
          <p class="text-sm font-bold text-amber-800 dark:text-amber-200">
            Bạn chưa đăng nhập.
            <NuxtLink to="/login" class="underline text-primary-600">Đăng nhập</NuxtLink>
            để xem hồ sơ.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xs">
              <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-primary-500 shadow-inner font-extrabold text-primary-600">
                {{ displayName.slice(0, 1).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">{{ displayName }}</h3>
                <p class="text-xs font-bold text-slate-400 mt-0.5">{{ me?.email }}</p>
              </div>
              <div class="inline-flex px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-xs rounded-xl">
                Tham gia {{ joinLabel }}
              </div>
            </div>
          </div>

          <div class="lg:col-span-8 space-y-6">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p class="text-[10px] font-extrabold uppercase text-slate-400">Từ đã học</p>
                <p class="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{{ stats.wordsLearned }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p class="text-[10px] font-extrabold uppercase text-slate-400">Đã thuộc</p>
                <p class="text-2xl font-black text-emerald-600 tabular-nums">{{ stats.masteredCount }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p class="text-[10px] font-extrabold uppercase text-slate-400">Streak</p>
                <p class="text-2xl font-black text-orange-500 tabular-nums">{{ stats.currentStreak }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p class="text-[10px] font-extrabold uppercase text-slate-400">SRS đến hạn</p>
                <p class="text-2xl font-black text-primary-500 tabular-nums">{{ stats.dueSrsCount }}</p>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Thành tích</h3>
              <div class="grid sm:grid-cols-3 gap-4">
                <div
                  v-for="a in achievements"
                  :key="a.id"
                  class="rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2"
                  :class="a.unlocked ? '' : 'opacity-45 grayscale'"
                >
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="a.color">
                    <Icon :name="a.icon" class="w-5 h-5" />
                  </div>
                  <p class="text-sm font-extrabold text-slate-900 dark:text-white">{{ a.title }}</p>
                  <p class="text-xs text-slate-500">{{ a.desc }}</p>
                  <p class="text-[10px] font-extrabold uppercase" :class="a.unlocked ? 'text-emerald-600' : 'text-slate-400'">
                    {{ a.unlocked ? 'Đã mở' : 'Chưa đạt' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
