<script setup>
import { ref } from 'vue'
import { demoFlashcards, features, levels } from '~/mock-data'

const selectedLevel = ref(null)

function selectLevel(code) {
  selectedLevel.value = code
}
</script>

<template>
  <div>
    <!-- Section: Choose Your Starting Level -->
    <section class="px-4 py-8">
      <div class="mx-auto max-w-6xl">
        <div class="text-center mb-12">
          <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            Choose Your Starting Level
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Select your current German proficiency level to get personalized
            lesson recommendations.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="level in levels"
            :key="level.code"
            :class="`
              cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl rounded-xl border p-5 flex flex-col justify-between
              ${level.code === 'A1'
                ? 'bg-blue-50/70 dark:bg-slate-900/80 border-blue-200/80 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500'
                : level.code === 'A2'
                ? 'bg-amber-50/70 dark:bg-slate-900/80 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-500'
                : level.code === 'B1'
                ? 'bg-purple-50/70 dark:bg-slate-900/80 border-purple-200/80 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-500'
                : 'bg-rose-50/70 dark:bg-slate-900/80 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-500'}
              ${selectedLevel === level.code ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' : ''}
            `"
            @click="selectLevel(level.code)"
          >
            <div>
              <div class="flex items-center justify-between mb-3">
                <span
                  class="text-xs px-2.5 py-1 border rounded-md font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-800/80"
                  :class="`${level.textColor} dark:text-slate-200 border-current opacity-90`"
                >
                  {{ level.code }}
                </span>
              </div>
              <h4 class="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100" :class="level.textColor">
                {{ level.title }}
              </h4>
              <p class="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                {{ level.description }}
              </p>
            </div>
            <div>
              <ul class="space-y-1.5 border-t border-slate-200/60 dark:border-slate-800 pt-3 mt-2">
                <li
                  v-for="(feature, idx) in level.features"
                  :key="idx"
                  class="text-xs text-slate-600 dark:text-slate-400 flex items-center"
                >
                  <div class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mr-2 flex-shrink-0"></div>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Everything You Need to Master German -->
    <section class="py-16 px-4 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            Everything You Need to Master German
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Our comprehensive platform combines proven language learning methods
            with modern technology to accelerate your German proficiency.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="flex space-x-4 rounded-xl p-6 bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg shadow-xs"
              :class="feature.color.split(' ').join(' ')"
            >
              <Icon :name="feature.icon" class="h-6 w-6" />
            </div>
            <div>
              <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                {{ feature.title }}
              </h4>
              <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/60 rounded-2xl p-8 border border-blue-100/80 dark:border-slate-700/70 shadow-sm"
        >
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-slate-200/60 dark:divide-slate-700/50">
            <div class="px-2">
              <div class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">95%</div>
              <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Success Rate</div>
            </div>
            <div class="px-2">
              <div class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">30 min</div>
              <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Daily Average</div>
            </div>
            <div class="px-2">
              <div class="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">3 months</div>
              <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">To Fluency</div>
            </div>
            <div class="px-2">
              <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">50k+</div>
              <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Happy Learners</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Flashcards -->
    <LayoutPageSectionFlashCardSection :flashcards="demoFlashcards" />
  </div>
</template>
