<script lang="ts" setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Progress } from '~/components/ui/progress'

definePageMeta({ layout: 'page' })
useHead({ title: 'Progress' })

const selectedLevel = ref('A1')
const selectedTopic = ref()

const { data: topicsData, pending } = useFetch<Record<string, any[]>>('/api/topics?userId=user-demo-id', {
  server: false,
  default: () => ({ A1: [], A2: [], B1: [], B2: [] })
})

function handleTopicSelect(topic: any) {
  if (topic.slug) {
    navigateTo(`/lesson?topic=${topic.slug}`)
  } else {
    selectedTopic.value = topic
  }
}

function handleBackToTopics() {
  selectedTopic.value = undefined
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
  <LayoutPageWrapper>
    <div>
      <LayoutPageSectionProgressTopicViewer
        v-if="selectedTopic && selectedTopic.id"
        :topic="selectedTopic"
        @back="handleBackToTopics"
      />

      <div
        v-else
        class="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors"
      >
        <!-- Header -->
        <header
          class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10"
        >
          <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Icon name="mdi:trending-up" class="h-8 w-8 text-primary-500" />
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Your Progress</h1>
              </div>
              <nav class="hidden md:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  class="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-white transition-colors duration-200"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  class="text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-white transition-colors duration-200"
                >
                  Statistics
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <div class="container mx-auto px-4 py-8">
          <!-- Progress Stats -->
          <LayoutPageSectionProgressStats />

          <!-- Level Selection and Topics -->
          <div class="mt-8">
            <Tabs v-model="selectedLevel" class="w-full">
              <TabsList class="grid w-full max-w-xl mx-auto grid-cols-3 sm:grid-cols-6 mb-8 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xs">
                <TabsTrigger
                  v-for="(topics, level) in topicsData"
                  :key="level"
                  class="text-slate-800 dark:text-slate-200 font-bold data-[state=active]:bg-primary-500 data-[state=active]:text-white dark:data-[state=active]:bg-primary-500 hover:text-primary-600 dark:hover:text-white transition-all duration-200 rounded-lg py-2"
                  :value="level"
                >
                  <span class="relative z-10 text-base">{{ level }}</span>
                </TabsTrigger>
              </TabsList>

              <Transition name="slide-fade" mode="out-in">
                <div :key="selectedLevel">
                  <TabsContent
                    v-for="(topics, level) in topicsData"
                    :key="level"
                    :value="level"
                    v-show="selectedLevel === level"
                  >
                    <div class="mb-6">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-slate-900 dark:text-white">
                          Level {{ level }} Topics
                        </h3>
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-slate-500 dark:text-slate-400">Progress:</span>
                          <div class="w-32">
                            <Progress
                              :model-value="calculateOverallProgress(topics)"
                              class="h-2 bg-slate-200 dark:bg-slate-800"
                            />
                          </div>
                          <span class="text-sm font-medium text-primary-500 dark:text-primary-400">
                            {{ calculateOverallProgress(topics) }}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <TransitionGroup
                        name="card-list"
                        tag="div"
                        class="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <Card
                          v-for="topic in topics"
                          :key="topic.id"
                          class="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          @click="handleTopicSelect(topic)"
                        >
                          <CardHeader class="pb-4">
                            <div class="flex items-center justify-between mb-2">
                              <Badge
                                class="bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 transition-colors duration-200"
                              >
                                {{ topic.difficulty }}
                              </Badge>
                              <div class="flex items-center gap-2">
                                <Icon
                                  name="mdi:clock-outline"
                                  class="h-4 w-4 text-slate-400"
                                />
                                <span class="text-sm text-slate-500 dark:text-slate-400">
                                  {{ topic.estimatedTime }}
                                </span>
                              </div>
                            </div>
                            <CardTitle class="text-lg text-slate-900 dark:text-white mb-2">
                              {{ topic.title }}
                            </CardTitle>
                            <p class="text-slate-600 dark:text-slate-400 text-sm">
                              {{ topic.description }}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                  <span class="text-slate-600 dark:text-slate-400"
                                    >Learning Progress</span
                                  >
                                  <span class="text-primary-500 font-semibold">
                                    {{ topic.completedWords }}/{{
                                      topic.wordsCount
                                    }}
                                    words
                                  </span>
                                </div>
                                <Progress
                                  :model-value="
                                    (topic.completedWords / topic.wordsCount) *
                                    100
                                  "
                                  class="h-2 bg-slate-200 dark:bg-slate-800"
                                />
                              </div>

                              <!-- Mastery Level -->
                              <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                  <span class="text-slate-600 dark:text-slate-400"
                                    >Mastery Level</span
                                  >
                                  <span class="text-emerald-500 font-semibold">
                                    {{ topic.masteredWords }}/{{
                                      topic.wordsCount
                                    }}
                                    mastered
                                  </span>
                                </div>
                                <Progress
                                  :model-value="
                                    (topic.masteredWords / topic.wordsCount) *
                                    100
                                  "
                                  class="h-2 bg-slate-200 dark:bg-slate-800"
                                />
                              </div>

                              <div
                                class="flex items-center justify-between pt-2"
                              >
                                <div
                                  class="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400"
                                >
                                  <div class="flex items-center gap-1">
                                    <Icon
                                      name="mdi:book-open-outline"
                                      class="h-4 w-4"
                                    />
                                    {{ topic.wordsCount }} words
                                  </div>
                                  <div class="flex items-center gap-1">
                                    <Icon
                                      name="mdi:star"
                                      class="h-4 w-4 text-yellow-500"
                                    />
                                    {{ topic.masteredWords }} mastered
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  class="bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors duration-200"
                                >
                                  <Icon name="mdi:brain" class="h-4 w-4 mr-2" />
                                  Continue Learning
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TransitionGroup>
                    </div>
                  </TabsContent>
                </div>
              </Transition>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Card list animation */
.card-list-move,
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.5s ease;
}
.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.card-list-leave-active {
  position: absolute;
}

/* Tab trigger animation */
[data-state='active'] {
  position: relative;
  overflow: hidden;
}
[data-state='active']::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgb(225, 255, 226);
  animation: scaleIn 0.3s ease-out forwards;
}

@keyframes scaleIn {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
