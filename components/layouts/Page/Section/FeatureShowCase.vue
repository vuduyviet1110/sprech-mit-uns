<script setup>
import { ref } from 'vue'

const selectedLevel = ref(null)
const features = [
  {
    icon: 'ph:book-open',
    title: 'Bilingual Lessons',
    description:
      'Structured lessons with English ↔ German content, audio pronunciation, and visual aids.',
    color: 'text-blue-600 bg-blue-50/50',
  },
  {
    icon: 'mdi:brain',
    title: 'Spaced Repetition',
    description:
      'Smart flashcard system that adapts to your learning pace for optimal retention.',
    color: 'text-purple-600 bg-purple-50/50',
  },
  {
    icon: 'lucide:message-square',
    title: 'Interactive Dialogues',
    description:
      'Practice real conversations with branching dialogue trees and feedback.',
    color: 'text-green-600 bg-green-50/50',
  },
  {
    icon: 'mdi:dictionary',
    title: 'Built-in Dictionary',
    description:
      'Comprehensive EN ↔ DE dictionary with IPA, examples, and personal bookmarks.',
    color: 'text-orange-600 bg-orange-50/50',
  },
  {
    icon: 'mdi:progress-check',
    title: 'Level-Based Learning',
    description:
      'Structured progression from A1 to B2 with clear milestones and assessments.',
    color: 'text-red-600 bg-red-50/50',
  },
  {
    icon: 'mdi:trophy',
    title: 'Gamification',
    description:
      'Earn points, unlock achievements, and compete with friends on leaderboards.',
    color: 'text-yellow-600 bg-yellow-50/50',
  },
  {
    icon: 'mdi:note',
    title: 'Personal Notes',
    description:
      'Highlight difficult words, add personal notes, and create custom study sets.',
    color: 'text-indigo-600 bg-indigo-50/50',
  },
  {
    icon: 'mdi:lightbulb',
    title: 'Smart Roadmap',
    description:
      'AI-powered daily suggestions and personalized learning path recommendations.',
    color: 'text-pink-600 bg-pink-50/50',
  },
  {
    icon: 'mdi:globe',
    title: 'Topic-Based Learning',
    description:
      'Learn German for specific contexts: travel, business, interviews, and more.',
    color: 'text-teal-600 bg-teal-50/50',
  },
]
const levels = [
  {
    code: 'A1',
    title: 'Beginner',
    description: 'Basic phrases and everyday expressions',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    textColor: 'text-green-700',
    features: [
      'Greetings & introductions',
      'Numbers & time',
      'Basic vocabulary',
    ],
  },
  {
    code: 'A2',
    title: 'Elementary',
    description: 'Simple conversations and familiar topics',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    textColor: 'text-blue-700',
    features: ['Past tense basics', 'Shopping & dining', 'Family & hobbies'],
  },
  {
    code: 'B1',
    title: 'Intermediate',
    description: 'Clear standard language on familiar matters',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    textColor: 'text-purple-700',
    features: ['Work & studies', 'Travel situations', 'Express opinions'],
  },
  {
    code: 'B2',
    title: 'Upper Intermediate',
    description: 'Complex texts and abstract topics',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    textColor: 'text-orange-700',
    features: ['Professional German', 'Complex grammar', 'Fluent discussions'],
  },
]

function selectLevel(code) {
  selectedLevel.value = code
}

// Flashcard demo data
const flashcards = [
  {
    english: 'Hello',
    german: 'Hallo',
    pronunciation: '/ˈhalo/',
    difficulty: 'Easy',
    topic: 'Greetings',
  },
  {
    english: 'I am tired',
    german: 'Ich bin müde',
    pronunciation: '/ɪç bɪn ˈmyːdə/',
    difficulty: 'Medium',
    topic: 'Feelings',
  },
]
const currentCard = ref(0)
const isFlipped = ref(false)
const score = ref({ correct: 0, incorrect: 0 })

const card = ref(flashcards[currentCard.value])

function handleAnswer(isCorrect) {
  if (isCorrect) {
    score.value.correct++
  } else {
    score.value.incorrect++
  }

  if (currentCard.value < flashcards.length - 1) {
    currentCard.value++
    card.value = flashcards[currentCard.value]
  }
  isFlipped.value = false
}

function playPronunciation() {
  // TODO: implement audio playback
  console.log('Playing pronunciation:', card.value.pronunciation)
}

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'Hard':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <section class="py-16 px-4">
    <div class="container mx-auto">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-bold text-blue-900 dark:text-white mb-4">
          Choose Your Starting Level
        </h3>
        <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select your current German proficiency level to get personalized
          lesson recommendations.
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="level in levels"
          :key="level.code"
          :class="`
            cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg
            ${level.color} rounded-lg border
            ${selectedLevel === level.code ? 'ring-2 ring-blue-400 shadow-lg' : ''}
          `"
          @click="selectLevel(level.code)"
        >
          <div class="text-center pb-4 p-4">
            <div class="flex items-center justify-between mb-2">
              <span
                class="text-sm px-2 py-1 border rounded"
                :class="`${level.textColor} ${selectedLevel === level.code ? 'font-bold' : ' font-medium'}`"
                >{{ level.code }}</span
              >
            </div>
            <h4 class="text-xl font-semibold" :class="level.textColor">
              {{ level.title }}
            </h4>
          </div>
          <div class="px-4 pb-4">
            <p class="text-gray-600 text-sm mb-4">{{ level.description }}</p>
            <ul class="space-y-1">
              <li
                v-for="(feature, idx) in level.features"
                :key="idx"
                class="text-xs text-gray-500 flex items-center"
              >
                <div class="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="py-16 px-4 bg-white">
    <div class="container mx-auto">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-bold text-blue-900 mb-4">
          Everything You Need to Master German
        </h3>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Our comprehensive platform combines proven language learning methods
          with modern technology to accelerate your German proficiency.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex space-x-4 shadow-sm rounded-lg p-6 bg-white hover:shadow-md hover:scale-105 transition-all duration-200"
        >
          <div
            class="w-12 h-12 flex items-center justify-center rounded-sm shadow-sm p-2"
            :class="feature.color.split(' ').join(' ')"
          >
            <Icon :name="feature.icon" class="h-6 w-6" />
          </div>
          <div>
            <h4 class="text-lg font-semibold text-blue-900">
              {{ feature.title }}
            </h4>
            <p class="text-gray-600 mt-2">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8"
      >
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="text-3xl font-bold text-blue-600 mb-2">95%</div>
            <div class="text-gray-600">Success Rate</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-indigo-600 mb-2">30 min</div>
            <div class="text-gray-600">Daily Average</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-purple-600 mb-2">3 months</div>
            <div class="text-gray-600">To Fluency</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-green-600 mb-2">50k+</div>
            <div class="text-gray-600">Happy Learners</div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="py-16 px-4 bg-gradient-to-r from-indigo-50 to-purple-50">
    <div class="container mx-auto">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-bold text-blue-900 mb-4">
          Smart Flashcard System
        </h3>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Practice vocabulary with our spaced repetition system that adapts to
          your learning pace.
        </p>
      </div>
      <div class="max-w-md mx-auto">
        <!-- Score Display -->
        <div class="flex justify-center gap-4 mb-6">
          <div class="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <Icon name="mdi:check-circle" class="h-5 w-5 text-green-600" />
            <span class="font-medium text-green-700">{{ score.correct }}</span>
          </div>
          <div class="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Icon name="mdi:close-circle" class="h-5 w-5 text-red-600" />
            <span class="font-medium text-red-700">{{ score.incorrect }}</span>
          </div>
        </div>

        <!-- Flashcard -->
        <div class="relative perspective-1000">
          <div
            class="w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d"
            :class="{ 'rotate-y-180': isFlipped }"
            @click="isFlipped = !isFlipped"
          >
            <!-- Front Side -->
            <div
              class="absolute inset-0 backface-hidden"
              :class="{ invisible: isFlipped }"
            >
              <div
                class="h-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg"
              >
                <div class="flex gap-2 mb-4">
                  <div
                    class="border px-2 py-1 rounded text-xs"
                    :class="getDifficultyColor(card.difficulty)"
                  >
                    {{ card.difficulty }}
                  </div>
                  <div
                    class="border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
                  >
                    {{ card.topic }}
                  </div>
                </div>
                <div class="text-3xl font-bold text-blue-900 mb-4 text-center">
                  {{ card.english }}
                </div>
                <div class="text-gray-600 text-center">
                  What's the German translation?
                </div>
                <div class="mt-6 text-sm text-gray-500">Tap to reveal</div>
              </div>
            </div>

            <!-- Back Side -->
            <div
              class="absolute inset-0 backface-hidden rotate-y-180"
              :class="{ visible: isFlipped, invisible: !isFlipped }"
            >
              <div
                class="h-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg"
              >
                <div class="text-4xl font-bold text-green-900 mb-4 text-center">
                  {{ card.german }}
                </div>
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-gray-600">{{ card.pronunciation }}</span>
                  <button
                    @click.stop="playPronunciation"
                    class="border border-green-200 hover:bg-green-50 rounded px-2 py-1"
                  >
                    🔊
                  </button>
                </div>
                <div class="text-gray-600 text-center mb-6">
                  "{{ card.english }}"
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="isFlipped" class="flex justify-center gap-4 mt-6">
          <button
            @click="handleAnswer(false)"
            class="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded"
          >
            ❌ Hard
          </button>
          <button
            @click="handleAnswer(true)"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            ✅ Easy
          </button>
        </div>

        <!-- Reset Button -->
        <div class="text-center mt-6">
          <button
            @click="
              () => {
                currentCard = 0
                isFlipped = false
                score = { correct: 0, incorrect: 0 }
              }
            "
            class="text-gray-500 hover:text-gray-700"
          >
            🔁 Reset Demo
          </button>
        </div>

        <!-- Progress Indicator -->
        <div class="flex justify-center gap-2 mt-4">
          <div
            v-for="(item, index) in flashcards"
            :key="index"
            class="w-2 h-2 rounded-full transition-colors"
            :class="index === currentCard ? 'bg-blue-600' : 'bg-gray-300'"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>
