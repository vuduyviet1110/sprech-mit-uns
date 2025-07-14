<script lang="ts" setup>
import { topicsData } from '~/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Progress } from '~/components/ui/progress'

definePageMeta({ layout: 'page' })
useHead({ title: 'Progress' })
defineProps({})

const selectedLevel = ref('A1')
const selectedTopic = ref()

function handleTopicSelect(topic: any) {
  console.log(topic)
  selectedTopic.value = topic
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
        class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen"
      >
        <!-- Header -->
        <header
          class="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-10"
        >
          <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Icon name="mdi:trending-up" class="h-8 w-8 text-blue-600" />
                <h1 class="text-2xl font-bold text-blue-900">Your Progress</h1>
              </div>
              <nav class="hidden md:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  class="text-blue-700 hover:text-blue-900 transition-colors duration-200"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  class="text-blue-700 hover:text-blue-900 transition-colors duration-200"
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
              <TabsList class="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                <TabsTrigger
                  v-for="(topics, level) in topicsData"
                  :key="level"
                  class="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-300 ease-out"
                  :value="level"
                >
                  <span class="relative z-10">{{ level }}</span>
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
                        <h3 class="text-xl font-semibold text-blue-900">
                          Level {{ level }} Topics
                        </h3>
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-gray-600">Progress:</span>
                          <div class="w-32">
                            <Progress
                              :model-value="calculateOverallProgress(topics)"
                              class="h-2 bg-slate-200"
                            />
                          </div>
                          <span class="text-sm font-medium text-blue-600">
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
                          class="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
                          @click="handleTopicSelect(topic)"
                        >
                          <CardHeader class="pb-4">
                            <div class="flex items-center justify-between mb-2">
                              <Badge
                                class="bg-blue-100 text-blue-700 transition-colors duration-200"
                              >
                                {{ topic.difficulty }}
                              </Badge>
                              <div class="flex items-center gap-2">
                                <Icon
                                  name="mdi:clock-outline"
                                  class="h-4 w-4 text-gray-500"
                                />
                                <span class="text-sm text-gray-500">
                                  {{ topic.estimatedTime }}
                                </span>
                              </div>
                            </div>
                            <CardTitle class="text-lg text-blue-900 mb-2">
                              {{ topic.title }}
                            </CardTitle>
                            <p class="text-gray-600 text-sm">
                              {{ topic.description }}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                  <span class="text-gray-600"
                                    >Learning Progress</span
                                  >
                                  <span class="text-blue-600">
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
                                  class="h-2 bg-slate-200"
                                />
                              </div>

                              <!-- Mastery Level -->
                              <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                  <span class="text-gray-600"
                                    >Mastery Level</span
                                  >
                                  <span class="text-green-600">
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
                                  class="h-2 bg-slate-200"
                                />
                              </div>

                              <div
                                class="flex items-center justify-between pt-2"
                              >
                                <div
                                  class="flex items-center gap-4 text-sm text-gray-500"
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
                                  class="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
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
