<template>
  <div class="space-y-6">
    <Card class="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle class="text-2xl text-blue-900"
          >Vocabulary from Text</CardTitle
        >
        <p class="text-gray-600">
          Learn these key words from the passage. Click the buttons to track
          your progress.
        </p>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            v-for="word in vocabularyData"
            :key="word.id"
            :class="[
              'p-4',
              wordsProgress[word.id]?.isMastered
                ? 'bg-green-50 border-green-200'
                : wordsProgress[word.id]?.correctCount ||
                    wordsProgress[word.id]?.incorrectCount
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200',
            ]"
          >
            <div class="space-y-4">
              <!-- Word Header -->
              <div class="flex items-center justify-between">
                <div class="flex gap-2">
                  <Badge :class="getDifficultyColor(word.difficulty)">{{
                    word.difficulty
                  }}</Badge>
                  <Badge :class="getTypeColor(word.type)">{{
                    word.type
                  }}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 w-8 p-0"
                  @click="playAudioOrSpeak(word)"
                >
                  <Icon name="mdi:volume-high" class="h-4 w-4" />
                </Button>
              </div>

              <!-- Word Content -->
              <div class="space-y-2">
                <div class="flex items-center gap-4">
                  <span class="text-xl font-bold text-blue-900">{{
                    word.word
                  }}</span>
                  <span class="text-gray-600">→</span>
                  <span class="text-lg text-gray-800">{{ word.meaning }}</span>
                </div>
                <div class="text-sm text-gray-500">
                  IPA: {{ word.pronunciation }}
                </div>
              </div>

              <!-- Example -->
              <div class="bg-white/50 p-3 rounded border">
                <div class="text-sm font-medium text-blue-800 mb-1">
                  {{ word.example }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ word.exampleTranslation }}
                </div>
              </div>

              <!-- Progress Info -->
              <div
                v-if="wordsProgress[word.id]"
                class="flex items-center gap-4 text-xs text-gray-600"
              >
                <span>✓ {{ wordsProgress[word.id].correctCount }}</span>
                <span>✗ {{ wordsProgress[word.id].incorrectCount }}</span>
                <span>🔥 {{ wordsProgress[word.id].streak }}</span>
                <span>⭐ Lv.{{ wordsProgress[word.id].masteryLevel }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <Button
                  v-if="!isLearning(word.id)"
                  size="sm"
                  class="bg-blue-600 hover:bg-blue-700"
                  @click="handleWordAction(word.id, 'add')"
                >
                  <Icon name="mdi:plus" class="h-4 w-4 mr-2" />
                  Start Learning
                </Button>

                <template v-else-if="!wordsProgress[word.id]?.isMastered">
                  <Button
                    size="sm"
                    variant="outline"
                    class="border-red-200 text-red-600 hover:bg-red-50"
                    @click="handleWordAction(word.id, 'incorrect')"
                  >
                    Hard
                  </Button>
                  <Button
                    size="sm"
                    class="bg-green-600 hover:bg-green-700"
                    @click="handleWordAction(word.id, 'correct')"
                  >
                    <Icon name="mdi:check" class="h-4 w-4 mr-2" />
                    Got it!
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    class="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    @click="handleWordAction(word.id, 'master')"
                  >
                    <Icon name="mdi:star" class="h-4 w-4 mr-2" />
                    Master
                  </Button>
                </template>

                <Badge
                  v-else
                  class="bg-green-100 text-green-700 px-3 py-1 flex items-center"
                >
                  <Icon name="mdi:star" class="h-4 w-4 mr-2" />
                  Mastered!
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { getWordProgress, updateWordProgress } from '~/utils/progressUtils'
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'

const props = defineProps<{ paragraph: string; topicId: string }>()

const vocabularyData = [
  {
    id: 'fahre',
    word: 'fahre',
    meaning: 'drive/travel',
    type: 'verb',
    pronunciation: '/ˈfaːrə/',
    difficulty: 'easy',
    example: 'Ich fahre mit dem Zug.',
    exampleTranslation: 'I travel by train.',
  },
  {
    id: 'haus',
    word: 'Haus',
    meaning: 'house',
    type: 'noun',
    pronunciation: '/haʊs/',
    difficulty: 'medium',
    example: 'Das Haus ist groß.',
    exampleTranslation: 'The house is big.',
  },
  {
    id: 'schnell',
    word: 'schnell',
    meaning: 'fast',
    type: 'adjective',
    pronunciation: '/ʃnɛl/',
    difficulty: 'easy',
    example: 'Der Zug ist schnell.',
    exampleTranslation: 'The train is fast.',
  },
  {
    id: 'lernen',
    word: 'lernen',
    meaning: 'to learn',
    type: 'verb',
    pronunciation: '/ˈlɛrnən/',
    difficulty: 'medium',
    example: 'Ich lerne Deutsch.',
    exampleTranslation: 'I am learning word.',
  },
  {
    id: 'gehen',
    word: 'gehen',
    meaning: 'to go',
    type: 'verb',
    pronunciation: '/ˈɡeːən/',
    difficulty: 'hard',
    example: 'Wir gehen nach Hause.',
    exampleTranslation: 'We are going home.',
  },
]

const wordsProgress = ref<Record<string, any>>({})

const loadProgress = async () => {
  const progress: Record<string, any> = {}
  for (const word of vocabularyData) {
    progress[word.id] = await getWordProgress('user123', word.id)
  }
  wordsProgress.value = progress
}

onMounted(loadProgress)

function handleWordAction(
  wordId: string,
  action: 'add' | 'correct' | 'incorrect' | 'master',
) {
  const current = wordsProgress.value[wordId] || {
    correctCount: 0,
    incorrectCount: 0,
    lastCorrect: false,
    isMastered: false,
    masteryLevel: 0,
    streak: 0,
  }
  const updated = { ...current }

  const now = new Date()
  switch (action) {
    case 'add':
      updated.nextReviewAt = new Date(now.getTime() + 86400000)
      updated.lastReviewedAt = now
      break
    case 'correct':
      updated.correctCount++
      updated.streak++
      updated.masteryLevel = Math.min(5, updated.masteryLevel + 1)
      updated.lastCorrect = true
      updated.nextReviewAt = new Date(
        now.getTime() + 86400000 * 2 ** updated.masteryLevel,
      )
      updated.lastReviewedAt = now
      break
    case 'incorrect':
      updated.incorrectCount++
      updated.streak = 0
      updated.masteryLevel = Math.max(0, updated.masteryLevel - 1)
      updated.lastCorrect = false
      updated.nextReviewAt = new Date(now.getTime() + 3600000)
      updated.lastReviewedAt = now
      break
    case 'master':
      updated.isMastered = true
      updated.masteryLevel = 5
      break
  }

  updateWordProgress('user123', wordId, updated)
  wordsProgress.value[wordId] = updated
}

const {
  playingWord,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()

const isLearning = (wordId: string) => {
  const progress = wordsProgress.value[wordId]
  return progress && (progress.correctCount > 0 || progress.incorrectCount > 0)
}
</script>
