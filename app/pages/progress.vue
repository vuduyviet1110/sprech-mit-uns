<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Progress } from '~/components/ui/progress'
import { useSession } from '~/composables/use-session'
import { useLanguage } from '~/composables/use-language'

definePageMeta({ layout: 'page' })
useHead({ title: 'Tiến Độ Học Tập - Sprech Mit Uns' })

const selectedLevel = ref('A1')
const selectedTopic = ref()
const { userId } = useSession()
const { currentLanguage } = useLanguage()

const { data: topicsData, refresh: refreshTopics } = useFetch<Record<string, any[]>>(
  () => `/api/topics?userId=${userId.value || ''}&language=${currentLanguage.value}`,
  {
    server: false,
    watch: [userId, currentLanguage],
    default: () => ({ A1: [], A2: [], B1: [], B2: [] }),
  },
)

const currentTopics = computed<any[]>(() => {
  const data = topicsData.value as Record<string, any[]> | null
  return data && data[selectedLevel.value] ? data[selectedLevel.value] : []
})

function handleTopicSelect(topic: any) {
  if (topic.locked) {
    if (import.meta.client) {
      window.alert(topic.unlockHint || 'Bài học này chưa được mở khóa.')
    }
    return
  }
  if (topic.slug) {
    navigateTo(`/lesson?topic=${topic.slug}`)
  } else {
    selectedTopic.value = topic
  }
}

function handleBackToTopics() {
  selectedTopic.value = undefined
}

async function handleResetProgress() {
  if (typeof window !== 'undefined' && window.confirm('Bạn có chắc chắn muốn xóa toàn bộ tiến độ học tập để bắt đầu lại từ đầu?')) {
    // Mọi key mang tiến độ học. Thiếu key nào thì "xoá toàn bộ" sẽ để sót dữ liệu
    // và người dùng thấy tiến độ cũ quay lại.
    const keysToRemove = [
      'daily_path_v1',
      'daily_quests_v2',
      'daily_quests_v1',
      'app_learning_settings_v1',
      'pronunciation_drill_v1',
      'sprech_saved_news_articles',
      'german_learning_progress',
      'speed_quiz_high_score',
      // Cờ "đã đẩy dữ liệu cũ lên server" — xoá cùng dữ liệu, nếu không lần sau
      // sẽ không import lại được.
      'smu_drill_migrated_v1',
      'smu_news_migrated_v1',
    ]
    for (const k of keysToRemove) localStorage.removeItem(k)
    // Clear per-user word progress keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('word_progress') || key.includes(userId.value || ''))) {
        localStorage.removeItem(key)
      }
    }
    await $fetch('/api/progress/reset', {
      method: 'POST',
      body: { userId: userId.value },
    })
    await refreshTopics()
    refreshNuxtData()
  }
}

function calculateOverallProgress(topics: any[]) {
  if (!Array.isArray(topics)) return 0
  const totalWords = topics.reduce((sum, t) => sum + (t.wordsCount || 0), 0)
  const completedWords = topics.reduce(
    (sum, t) => sum + (t.completedWords || 0),
    0,
  )
  return totalWords > 0 ? Math.round((completedWords / totalWords) * 100) : 0
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div v-if="selectedTopic && selectedTopic.id" class="w-full px-4 sm:px-6 lg:px-8">
        <LayoutPageSectionProgressTopicViewer
          :topic="selectedTopic"
          @back="handleBackToTopics"
        />
      </div>

      <div v-else class="w-full px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              Learning Analytics & Mastery
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Icon name="lucide:trending-up" class="w-9 h-9 text-primary-500" />
              <span>Tiến Độ Học Tập Cá Nhân</span>
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              Theo dõi chuỗi học, cấp độ thành thạo từ vựng và tiến trình hoàn thành các bài học.
            </p>
          </div>
          <div>
            <button
              @click="handleResetProgress"
              class="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
              <span>Xóa & Đặt lại Tiến độ</span>
            </button>
          </div>
        </div>

        <!-- Progress Stats Dashboard Component -->
        <LayoutPageSectionProgressStats />

        <!-- Soft forgetting curve (SM-2 intervals) -->
        <LayoutPageSectionProgressForgettingCurve />

        <!-- Level Selection and Topics Grid -->
        <div class="space-y-6 pt-4">
          <Tabs v-model="selectedLevel" class="w-full">
            <TabsList class="grid w-full max-w-xl mx-auto grid-cols-4 sm:grid-cols-4 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <TabsTrigger
                v-for="level in ['A1', 'A2', 'B1', 'B2']"
                :key="level"
                class="font-extrabold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary-500 shadow-xs transition-all rounded-xl py-2.5 cursor-pointer"
                :value="level"
              >
                <span>Cấp Độ {{ level }}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent :value="selectedLevel" class="space-y-6">
              <!-- Level Overview Header -->
              <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">
                    Danh Mục Bài Học Cấp Độ {{ selectedLevel }}
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hoàn thành các bài học để nâng chỉ số thành thạo từ vựng.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-slate-400">Tiến độ cấp độ:</span>
                  <div class="w-36">
                    <Progress
                      :model-value="calculateOverallProgress(currentTopics)"
                      class="h-2.5 bg-slate-100 dark:bg-slate-800"
                    />
                  </div>
                  <span class="text-sm font-extrabold text-primary-500">
                    {{ calculateOverallProgress(currentTopics) }}%
                  </span>
                </div>
              </div>

              <!-- Topic Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  v-for="topic in currentTopics"
                  :key="topic.id"
                  class="transition-all duration-200 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl"
                  :class="
                    topic.locked
                      ? 'opacity-70 cursor-not-allowed'
                      : 'cursor-pointer hover:border-primary-500 hover:shadow-md'
                  "
                  @click="handleTopicSelect(topic)"
                >
                  <CardHeader class="pb-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Badge class="bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 border border-emerald-200 dark:border-emerald-800 font-extrabold text-xs">
                          {{ topic.difficulty }}
                        </Badge>
                        <Badge
                          v-if="topic.locked"
                          class="bg-slate-100 dark:bg-slate-800 text-slate-500 border-0 font-extrabold text-xs"
                        >
                          <Icon name="lucide:lock" class="w-3 h-3 mr-1" />
                          Khóa
                        </Badge>
                      </div>
                      <div class="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Icon name="lucide:clock" class="w-4 h-4" />
                        <span>{{ topic.estimatedTime }}</span>
                      </div>
                    </div>
                    <CardTitle class="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
                      {{ topic.title }}
                    </CardTitle>
                    <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                      {{ topic.locked ? topic.unlockHint : topic.description }}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-4">
                      <div class="space-y-1.5">
                        <div class="flex justify-between text-xs font-bold">
                          <span class="text-slate-500">Tiến độ đã hoàn thành</span>
                          <span class="text-primary-500">
                            {{ topic.completedWords }}/{{ topic.wordsCount }} từ
                          </span>
                        </div>
                        <Progress
                          :model-value="(topic.completedWords / (topic.wordsCount || 1)) * 100"
                          class="h-2 bg-slate-100 dark:bg-slate-800"
                        />
                      </div>

                      <div class="space-y-1.5">
                        <div class="flex justify-between text-xs font-bold">
                          <span class="text-slate-500">Mức độ đã thuộc sâu</span>
                          <span class="text-emerald-500">
                            {{ topic.masteredWords }}/{{ topic.wordsCount }} từ
                          </span>
                        </div>
                        <Progress
                          :model-value="(topic.masteredWords / (topic.wordsCount || 1)) * 100"
                          class="h-2 bg-slate-100 dark:bg-slate-800"
                        />
                      </div>

                      <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span class="flex items-center gap-1">
                            <Icon name="lucide:book-open" class="w-4 h-4" />
                            {{ topic.wordsCount }} từ
                          </span>
                          <span class="flex items-center gap-1 text-amber-500">
                            <Icon name="lucide:star" class="w-4 h-4" />
                            {{ topic.masteredWords }} thuộc
                          </span>
                        </div>
                        <Button
                          size="sm"
                          :disabled="topic.locked"
                          class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Icon :name="topic.locked ? 'lucide:lock' : 'lucide:brain'" class="w-4 h-4 mr-1.5" />
                          {{ topic.locked ? 'Chưa mở' : 'Học Tiếp' }}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
