<script setup>
import { ref } from 'vue'
import { demoFlashcards, features, levels } from '~/mock-data'

const selectedLevel = ref(null)

function selectLevel(code) {
  selectedLevel.value = code
}
</script>

<template>
  <section class="px-4">
    <div class="mx-auto">
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
            cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg rounded-lg border
            ${level.code === 'A1' ? 'bg-blue-50' : level.code === 'A2' ? 'bg-yellow-50' : level.code === 'B1' ? 'bg-red-50' : 'bg-white'} 
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
  <LayoutPageSectionFlashCardSection :flashcards="demoFlashcards" />
</template>
