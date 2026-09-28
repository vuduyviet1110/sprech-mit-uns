<script setup>
import { ref, computed } from 'vue'
import { demoFlashcards, features, levels, topicsData } from '~/mock-data'

const selectedLevel = ref('A1') // Default select A1 for immediate interactivity

function selectLevel(code) {
  selectedLevel.value = selectedLevel.value === code ? null : code
}

const levelTopics = computed(() => {
  if (!selectedLevel.value) return []
  return topicsData[selectedLevel.value] || []
})

const levelTone = {
  A1: {
    card: 'bg-primary-50/70 dark:bg-slate-900/80 border-primary-200/80 dark:border-primary-900/50 hover:border-primary-400 dark:hover:border-primary-500',
    ring: 'ring-4 ring-primary-500/80 dark:ring-primary-400/80 shadow-primary-500/20',
    badge: 'bg-primary-600 text-white',
    accentText: 'text-primary-600 dark:text-primary-400',
  },
  A2: {
    card: 'bg-blue-50/70 dark:bg-slate-900/80 border-blue-200/80 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500',
    ring: 'ring-4 ring-blue-500/80 dark:ring-blue-400/80 shadow-blue-500/20',
    badge: 'bg-blue-600 text-white',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  B1: {
    card: 'bg-amber-50/70 dark:bg-slate-900/80 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-500',
    ring: 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-amber-500/20',
    badge: 'bg-amber-600 text-white',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  B2: {
    card: 'bg-red-50/60 dark:bg-slate-900/80 border-red-200/80 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-500',
    ring: 'ring-4 ring-red-500/80 dark:ring-red-400/80 shadow-red-500/20',
    badge: 'bg-red-600 text-white',
    accentText: 'text-red-600 dark:text-red-400',
  },
}
</script>

<template>
  <div>
    <!-- Section: Choose Your Starting Level (With 3D Domino Flip Motion & Interactive Drawer) -->
    <section class="px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div class="mx-auto max-w-8xl">
        <AwesomeLandingReveal class="text-center mb-10 sm:mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Icon name="lucide:graduation-cap" class="w-4 h-4 text-primary-500" />
            Demo UI · Lộ trình CEFR
          </div>
          <h3 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
            Chọn trình độ bắt đầu
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Nhấp vào từng trình độ bên dưới để xem chi tiết chủ đề học &amp; từ vựng trọng tâm.
          </p>
        </AwesomeLandingReveal>

        <!-- Domino flip level cards — animate when scrolled into view -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" style="perspective: 1200px">
          <AwesomeLandingReveal
            v-for="(level, i) in levels"
            :key="level.code"
            variant="domino"
            :delay="i * 110"
          >
            <div
              data-cursor-text="LEVEL"
              class="group relative h-full cursor-pointer transition-all duration-300 transform rounded-2xl border p-6 flex flex-col justify-between"
              :class="[
                levelTone[level.code]?.card,
                selectedLevel === level.code
                  ? `scale-[1.03] shadow-xl ${levelTone[level.code]?.ring}`
                  : 'hover:-translate-y-1 hover:shadow-md opacity-90 hover:opacity-100',
              ]"
              @click="selectLevel(level.code)"
            >
            <!-- Active Selected Indicator -->
            <div
              v-if="selectedLevel === level.code"
              class="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse"
              :class="levelTone[level.code]?.badge"
            >
              ✓ Đang chọn
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <span
                  class="text-xs px-3 py-1 border rounded-lg font-black uppercase tracking-wider bg-white/90 dark:bg-slate-800/90 shadow-2xs"
                  :class="`${level.textColor} dark:text-slate-200 border-current opacity-90`"
                >
                  Trình độ {{ level.code }}
                </span>
                <Icon
                  name="lucide:chevron-right"
                  class="w-5 h-5 transition-transform duration-300"
                  :class="selectedLevel === level.code ? 'rotate-90 text-primary-500' : 'text-slate-400 group-hover:translate-x-1'"
                />
              </div>

              <h4 class="text-2xl font-black mb-2 text-slate-900 dark:text-slate-100" :class="level.textColor">
                {{ level.title }}
              </h4>
              <p class="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed font-medium">
                {{ level.description }}
              </p>
            </div>

            <ul class="space-y-2 border-t border-slate-200/70 dark:border-slate-800 pt-4 mt-2">
              <li
                v-for="(feature, idx) in level.features"
                :key="idx"
                class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center"
              >
                <Icon name="lucide:check-circle-2" class="w-4 h-4 mr-2 flex-shrink-0 text-primary-500" />
                {{ feature }}
              </li>
            </ul>
          </div>
          </AwesomeLandingReveal>
        </div>

        <!-- Interactive Dynamic Level Overview Drawer (Appears when level clicked) -->
        <Transition name="drawer-slide">
          <div
            v-if="selectedLevel"
            key="selectedLevel"
            class="mt-8 p-6 sm:p-8 rounded-3xl border border-primary-500/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl transition-all"
          >
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-5 mb-6">
              <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-xl bg-primary-500 text-white font-black text-sm uppercase tracking-wide">
                  {{ selectedLevel }}
                </span>
                <div>
                  <h4 class="text-xl font-extrabold text-slate-900 dark:text-white">
                    Các chủ đề trọng tâm {{ selectedLevel }}
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Bấm vào từng bài để luyện nghe, đọc &amp; ôn tập thẻ nhớ
                  </p>
                </div>
              </div>

              <NuxtLink
                :to="`/progress?level=${selectedLevel}`"
                data-cursor-text="START"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-extrabold shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <Icon name="lucide:play-circle" class="w-4 h-4" />
                <span>Bắt Đầu Lộ Trình {{ selectedLevel }}</span>
              </NuxtLink>
            </div>

            <!-- Topic Cards Preview Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="topic in levelTopics.slice(0, 3)"
                :key="topic.id"
                class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-primary-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-300">
                      {{ topic.estimatedTime }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">
                      {{ topic.wordsCount }} từ vựng
                    </span>
                  </div>
                  <h5 class="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    {{ topic.title }}
                  </h5>
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {{ topic.description }}
                  </p>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs font-bold text-primary-600 dark:text-primary-400">
                  <span>Khám phá bài học</span>
                  <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Section: Features — Card Dealing Deck Animation -->
    <section class="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50/60 via-slate-50/80 to-white dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-950 border-y border-primary-100/60 dark:border-slate-800/80 transition-colors duration-300 overflow-hidden">
      <div class="max-w-8xl mx-auto">
        <AwesomeLandingReveal class="text-center mb-10 sm:mb-14">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Icon name="lucide:layers" class="w-4 h-4 text-primary-500 animate-bounce" />
            Bộ Công Cụ Toàn Diện
          </div>
          <h3 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
            Mọi thứ bạn cần để chinh phục tiếng Đức
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Kết hợp phương pháp học ngôn ngữ đã kiểm chứng với công nghệ hiện đại để tăng tốc độ thành thạo.
          </p>
        </AwesomeLandingReveal>

        <!-- Card deck dealing — animate when scrolled into view -->
        <div class="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AwesomeLandingReveal
            v-for="(feature, i) in features"
            :key="feature.title"
            variant="deal"
            :delay="i * 100"
          >
            <div
              class="group relative h-full flex space-x-4 rounded-2xl p-6 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:rotate-1 transition-all duration-300 cursor-pointer"
            >
            <!-- Card Corner Accent Badge -->
            <div class="absolute top-3 right-3 text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 group-hover:text-primary-500 transition-colors">
              #0{{ i + 1 }}
            </div>

            <div
              class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
              :class="feature.color.split(' ').join(' ')"
            >
              <Icon :name="feature.icon" class="h-6 w-6" />
            </div>
            <div>
              <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ feature.title }}
              </h4>
              <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
          </AwesomeLandingReveal>
        </div>

        <AwesomeLandingReveal variant="scale" :delay="120" class="mt-14">
          <div
            class="rounded-2xl p-8 border border-primary-200/70 dark:border-slate-700/70 shadow-sm bg-gradient-to-r from-primary-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
          >
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-primary-100 dark:divide-slate-700/50">
              <div class="px-2">
                <div class="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mb-1">95%</div>
                <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Tỷ lệ ghi nhớ</div>
              </div>
              <div class="px-2">
                <div class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">30 phút</div>
                <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Trung bình mỗi ngày</div>
              </div>
              <div class="px-2">
                <div class="text-3xl font-extrabold text-primary-700 dark:text-primary-300 mb-1">3 tháng</div>
                <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Tiến tới lưu loát</div>
              </div>
              <div class="px-2">
                <div class="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mb-1">∞</div>
                <div class="text-slate-600 dark:text-slate-400 text-sm font-medium">Lịch SRS cá nhân hóa</div>
              </div>
            </div>
          </div>
        </AwesomeLandingReveal>
      </div>
    </section>

    <!-- Section: Flashcards -->
    <LayoutPageSectionFlashCardSection :flashcards="demoFlashcards" demo />
  </div>
</template>

<style scoped>
.drawer-slide-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}
.drawer-slide-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.drawer-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
