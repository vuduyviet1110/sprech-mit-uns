<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useLandingScroll } from '~/composables/use-landing-scroll'

const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
const currentTab = ref<'demo' | 'feature' | undefined>()

const previewSectionRef = ref<HTMLElement | null>(null)
const { scrollProgress, parallax, reducedMotion } = useLandingScroll()

function toggleTab(tab: 'demo' | 'feature') {
  if (currentTab.value === tab) {
    currentTab.value = undefined
  } else {
    currentTab.value = tab
    setTimeout(() => {
      previewSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }
}

useHead({ titleTemplate: '', title: awesome?.name || 'Sprech Mit Uns' })

const { data: catalog } = useFetch<{
  topics: number
  words: number
  byLanguage: { de: { topics: number; words: number }; cs: { topics: number; words: number } }
}>('/api/stats/catalog', { server: false })

const stats = computed(() => [
  {
    value: String(catalog.value?.topics ?? '—'),
    label: 'Chủ đề bài học',
    icon: 'lucide:book-open',
    accent: 'text-primary-600 dark:text-primary-400',
  },
  {
    value: String(catalog.value?.words ?? '—'),
    label: 'Từ vựng trong hệ thống',
    icon: 'lucide:layers',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'A1–B1',
    label: 'Lộ trình DE + CS',
    icon: 'lucide:graduation-cap',
    accent: 'text-primary-700 dark:text-primary-300',
  },
  {
    value: 'SRS',
    label: 'Lặp lại ngắt quãng SM-2',
    icon: 'lucide:repeat',
    accent: 'text-blue-700 dark:text-blue-300',
  },
])

const launchpad = [
  {
    to: '/progress',
    cursor: 'LEARN',
    icon: 'lucide:trending-up',
    badge: 'Lộ trình cốt lõi',
    title: 'Học bài & Theo dõi Tiến độ',
    desc: 'Mục tiêu hàng ngày, lịch sử ôn tập và cấp độ thành thạo theo thời gian thực.',
    tone: 'primary' as const,
  },
  {
    to: '/review',
    cursor: 'REVIEW',
    icon: 'lucide:repeat',
    badge: 'Lặp lại ngắt quãng',
    title: 'Ôn tập Thẻ SRS Thông Minh',
    desc: 'Thuật toán tính thời điểm tối ưu trước khi quên — ghi nhớ dài hạn bền vững.',
    tone: 'emerald' as const,
  },
  {
    to: '/sub-menu/youtube',
    cursor: 'LISTEN',
    icon: 'lucide:youtube',
    badge: 'Luyện nghe chép',
    title: 'YouTube Dictation Phân Đoạn',
    desc: 'Nghe & chép qua video thực tế, phân đoạn phụ đề thông minh và kiểm tra tức thì.',
    tone: 'red' as const,
  },
  {
    to: '/sub-menu/quizz',
    cursor: 'GAME',
    icon: 'lucide:swords',
    badge: 'Quiz solo + demo phòng',
    title: 'Đấu Trường Quiz',
    desc: 'Luyện phản xạ ngữ pháp/từ vựng solo. Phòng nhóm là demo single-server (không production).',
    tone: 'blue' as const,
  },
]

onMounted(() => {
  // Avoid leftover scroll from /progress dimming the hero via parallax.opacity
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
})

const toneClasses = {
  primary: {
    card: 'hover:border-primary-400 dark:hover:border-primary-500',
    icon: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white',
    badge: 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-primary-200/70 dark:border-primary-800',
    title: 'group-hover:text-primary-600 dark:group-hover:text-primary-400',
    footer: 'text-primary-600 dark:text-primary-400',
    wash: 'via-primary-50/40',
  },
  emerald: {
    card: 'hover:border-primary-400 dark:hover:border-primary-500',
    icon: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white',
    badge: 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-primary-200/70 dark:border-primary-800',
    title: 'group-hover:text-primary-600 dark:group-hover:text-primary-400',
    footer: 'text-primary-600 dark:text-primary-400',
    wash: 'via-primary-50/30',
  },
  red: {
    card: 'hover:border-red-400 dark:hover:border-red-500',
    icon: 'bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-500 group-hover:text-white',
    badge: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border-red-200/70 dark:border-red-900',
    title: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    footer: 'text-red-600 dark:text-red-400',
    wash: 'via-red-50/30',
  },
  blue: {
    card: 'hover:border-blue-400 dark:hover:border-blue-500',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
    badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border-blue-200/70 dark:border-blue-900',
    title: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    footer: 'text-blue-600 dark:text-blue-400',
    wash: 'via-blue-50/30',
  },
}
</script>

<template>
  <div class="relative w-full overflow-x-clip pb-20 landing-scroll">
    <!-- Scroll progress — under navbar, below nav dropdowns -->
    <div
      class="fixed top-14 left-0 right-0 z-30 h-1 pointer-events-none bg-slate-200/40 dark:bg-slate-800/40"
      aria-hidden="true"
    >
      <div
        class="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-blue-500 shadow-[0_0_12px_rgba(59,166,118,0.55)] transition-[width] duration-100 ease-out"
        :style="{ width: `${Math.max(scrollProgress * 100, scrollProgress > 0 ? 2 : 0)}%` }"
      />
    </div>

    <!-- Full-bleed background glow field (parallax layers) -->
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        class="absolute -top-24 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary-400/20 blur-3xl dark:bg-primary-600/15 will-change-transform"
        :style="{ transform: `translate3d(0, ${parallax.slow}px, 0)` }"
      />
      <div
        class="absolute top-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10 will-change-transform"
        :style="{ transform: `translate3d(0, ${parallax.mid}px, 0)` }"
      />
      <div
        class="absolute top-[36rem] left-1/3 h-72 w-72 rounded-full bg-primary-300/15 blur-3xl dark:bg-primary-700/10 will-change-transform"
        :style="{ transform: `translate3d(0, ${parallax.fast}px, 0)` }"
      />
      <div
        class="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 28px 28px;"
      />
    </div>

    <!-- 1. HERO SECTION -->
    <section class="relative w-full pt-6 sm:pt-8">
      <div class="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <AwesomeWelcome />

        <div
          class="relative mt-8 sm:mt-10 will-change-transform"
          :style="
            reducedMotion
              ? undefined
              : {
                  transform: `translate3d(0, ${parallax.hero}px, 0) scale(${parallax.heroScale})`,
                  opacity: parallax.heroOpacity,
                }
          "
        >
          <div
            class="landing-enter relative"
            style="--landing-enter-y: 40px; animation-delay: 80ms"
          >
          <!-- Soft brand wash behind panel -->
          <div class="absolute -inset-x-4 -inset-y-6 sm:-inset-x-8 bg-gradient-to-b from-primary-500/[0.07] via-transparent to-transparent rounded-[2rem] pointer-events-none" />

          <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-900/10 dark:border-primary-400/10 bg-gradient-to-br from-slate-900 via-slate-900 to-primary-950 text-left text-white shadow-xl shadow-primary-900/10">
            <!-- Decorative graphic mesh -->
            <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <div class="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl" />
              <div class="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
              <svg class="absolute right-0 top-0 h-full w-1/2 opacity-[0.07]" viewBox="0 0 400 400" fill="none">
                <circle cx="320" cy="80" r="120" stroke="currentColor" stroke-width="1" />
                <circle cx="320" cy="80" r="80" stroke="currentColor" stroke-width="1" />
                <circle cx="320" cy="80" r="40" stroke="currentColor" stroke-width="1" />
                <path d="M0 280 C120 220, 200 340, 400 260" stroke="currentColor" stroke-width="1" />
              </svg>
            </div>

            <div class="relative flex flex-col lg:flex-row items-stretch lg:items-center gap-10 lg:gap-14 p-6 sm:p-10 lg:p-12 xl:p-14">
              <!-- Left Copy & Main Action CTAs -->
              <div class="lg:w-[52%] space-y-6">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/15 border border-primary-400/25 text-primary-200 text-xs font-bold uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-primary-400 animate-pulse-soft" />
                  Nền Tảng Học Tiếng Đức & Tiếng Séc Chủ Động
                </div>

                <h2 class="text-3xl sm:text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight text-white">
                  Học từ vựng chủ động &amp;<br class="hidden sm:block" />
                  Luyện phản xạ đỉnh cao
                </h2>

                <p class="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
                  SRS (SM-2), flashcard, shadowing, lộ trình Today, và nghe chép YouTube — tập trung ghi nhớ lâu dài.
                </p>

                <!-- Hero Primary Actions & Demo Toggles -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <NuxtLink
                    to="/progress"
                    data-cursor-text="START"
                    class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold text-sm border border-primary-400 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-primary-900/30"
                  >
                    <Icon name="lucide:play-circle" class="w-5 h-5" />
                    Bắt Đầu Học Ngay
                  </NuxtLink>

                  <button
                    data-cursor-text="DEMO"
                    class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm font-bold cursor-pointer"
                    :class="
                      currentTab === 'demo'
                        ? 'bg-primary-500 text-white border-primary-400 shadow-md'
                        : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/20'
                    "
                    @click="toggleTab('demo')"
                  >
                    <Icon name="lucide:play" class="w-4 h-4 text-primary-300" />
                    {{ currentTab === 'demo' ? 'Ẩn Bài Học Demo' : 'Thử Bài Học Demo' }}
                  </button>

                  <button
                    data-cursor-text="QUIZ"
                    class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm font-bold cursor-pointer"
                    :class="
                      currentTab === 'feature'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/20'
                    "
                    @click="toggleTab('feature')"
                  >
                    <Icon name="lucide:sparkles" class="w-4 h-4 text-blue-300" />
                    {{ currentTab === 'feature' ? 'Ẩn Bài Tập Điền Từ' : 'Thử Bài Tập Điền Từ' }}
                  </button>
                </div>
              </div>

              <!-- Right Product Visual Showcase Card -->
              <div class="lg:w-[48%] w-full relative flex justify-center items-center min-h-[280px]">
                <div class="absolute -z-0 inset-8 rounded-full bg-primary-500/20 blur-2xl" />

                <div
                  class="relative w-full max-w-md will-change-transform"
                  :style="
                    reducedMotion
                      ? undefined
                      : { transform: `translate3d(0, ${-parallax.mid * 0.4}px, 0)` }
                  "
                >
                  <div
                    class="landing-enter relative w-full bg-slate-800/80 border border-white/10 rounded-2xl p-6 pt-9 shadow-2xl backdrop-blur-sm transform lg:rotate-2 hover:rotate-0 transition-transform duration-500"
                    style="--landing-enter-y: 24px; animation-delay: 160ms"
                  >
                  <!-- Floating Streak Badge -->
                  <div class="absolute -top-5 -left-3 sm:-left-5 animate-float-y bg-slate-950/95 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 z-20 shadow-lg">
                    <AwesomeHomeLottieWidget />
                    <div>
                      <div class="text-xs text-amber-400 font-extrabold uppercase tracking-wide">Streak 12 Ngày</div>
                      <div class="text-sm text-slate-400 font-medium">Mục tiêu hôm nay ✓</div>
                    </div>
                  </div>

                  <!-- Floating Mastery Badge -->
                  <div class="absolute -bottom-4 -right-3 sm:-right-5 animate-float-y-delay bg-slate-950/95 border border-primary-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 z-20 shadow-lg">
                    <div class="w-8 h-8 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center font-black text-xs border border-primary-500/30">
                      95%
                    </div>
                    <div>
                      <div class="text-xs text-primary-300 font-bold">Thành Thạo SRS</div>
                      <div class="text-sm text-slate-400">Bộ nhớ dài hạn</div>
                    </div>
                  </div>

                  <!-- Flashcard Mock -->
                  <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xs px-2.5 py-1 rounded-md bg-primary-500/20 text-primary-200 font-extrabold border border-primary-400/25">A2 German</span>
                        <span class="text-xs text-slate-400 font-medium">Guten Tag!</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-primary-300 text-xs font-semibold">
                        <Icon name="lucide:volume-2" class="w-4 h-4 animate-pulse-soft" />
                        <span>Phát âm chuẩn</span>
                      </div>
                    </div>

                    <div class="p-5 sm:p-6 rounded-xl bg-slate-950/80 border border-white/8 text-center space-y-2">
                      <div class="text-3xl font-black text-white tracking-tight">das Haus</div>
                      <div class="text-xs text-slate-400">Ngôi nhà • /daas haos/</div>
                      <div class="pt-1">
                        <span class="inline-block px-3 py-1 rounded-md bg-primary-500/20 text-primary-200 text-xs font-semibold border border-primary-500/30">
                          ✓ Thuộc bài Lv.5 (Mastered)
                        </span>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center text-xs">
                      <div class="p-2.5 rounded-lg bg-slate-950/50 border border-white/8">
                        <div class="font-black text-primary-300 text-sm">{{ catalog?.words ?? '—' }}</div>
                        <div class="text-sm text-slate-400">Từ vựng</div>
                      </div>
                      <div class="p-2.5 rounded-lg bg-slate-950/50 border border-white/8">
                        <div class="font-black text-blue-300 text-sm">SRS</div>
                        <div class="text-sm text-slate-400">Ôn đúng lúc</div>
                      </div>
                      <div class="p-2.5 rounded-lg bg-slate-950/50 border border-white/8">
                        <div class="font-black text-red-300 text-sm">YouTube</div>
                        <div class="text-sm text-slate-400">Dictation</div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. INTERACTIVE DEMO PREVIEW (Seamless Glassmorphic Container) -->
    <div ref="previewSectionRef" class="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <Transition name="tab-fade" mode="out-in">
        <section v-if="currentTab === 'demo'" key="demo" class="py-2 w-full">
          <div class="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4 mb-6">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Trải Nghiệm Thử Bài Học DEMO
                </h3>
              </div>
              <button
                class="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                @click="currentTab = undefined"
              >
                <span>Đóng lại</span>
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
            <LayoutPageSectionLessonPreview text="Demo Lesson" />
          </div>
        </section>

        <section v-else-if="currentTab === 'feature'" key="feature" class="py-2 w-full">
          <div class="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4 mb-6">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Thử Thách Bài Tập Điền Từ (Fill In The Blank)
                </h3>
              </div>
              <button
                class="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                @click="currentTab = undefined"
              >
                <span>Đóng lại</span>
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
            <LayoutPageSectionFillInTheBlank />
          </div>
        </section>
      </Transition>
    </div>

    <!-- 3. STATS STRIP (Proof & Platform Metrics) -->
    <section class="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <AwesomeLandingReveal>
        <div
          class="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-800 shadow-sm"
        >
          <AwesomeLandingReveal
            v-for="(stat, i) in stats"
            :key="stat.label"
            variant="scale"
            :delay="i * 100"
          >
            <div
              class="flex flex-col items-center justify-center gap-1 px-4 py-7 sm:py-8 bg-white/90 dark:bg-slate-900/90 hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors h-full"
            >
              <Icon :name="stat.icon" class="w-5 h-5 mb-1 opacity-70" :class="stat.accent" />
              <div class="text-3xl md:text-4xl font-black tracking-tight" :class="stat.accent">
                {{ stat.value }}
              </div>
              <div class="text-slate-600 dark:text-slate-400 text-sm font-semibold text-center">
                {{ stat.label }}
              </div>
            </div>
          </AwesomeLandingReveal>
        </div>
      </AwesomeLandingReveal>
    </section>

    <!-- 4. CORE FEATURE LAUNCHPAD (4 Primary Feature Portals) -->
    <section class="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <AwesomeLandingReveal class="text-center mb-8">
        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Lối vào luyện tập cốt lõi
        </h3>
        <p class="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base">
          Lựa chọn phương pháp học phù hợp với mục tiêu của bạn hôm nay.
        </p>
      </AwesomeLandingReveal>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        <AwesomeLandingReveal
          v-for="(item, i) in launchpad"
          :key="item.to"
          class="h-full"
          variant="up"
          :delay="i * 110"
        >
          <NuxtLink
            :to="item.to"
            :data-cursor-text="item.cursor"
            class="group h-full p-7 sm:p-8 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            :class="[toneClasses[item.tone].card, `bg-gradient-to-br from-white ${toneClasses[item.tone].wash} to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-slate-200/90 dark:border-slate-800`]"
          >
            <div>
              <div class="flex items-center justify-between mb-5">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-inner"
                  :class="toneClasses[item.tone].icon"
                >
                  <Icon :name="item.icon" class="w-6 h-6" />
                </div>
                <span
                  class="text-xs font-extrabold px-2.5 py-1 rounded-md border"
                  :class="toneClasses[item.tone].badge"
                >
                  {{ item.badge }}
                </span>
              </div>
              <h4
                class="font-black text-slate-900 dark:text-white text-xl mb-2 transition-colors"
                :class="toneClasses[item.tone].title"
              >
                {{ item.title }}
              </h4>
              <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold"
              :class="toneClasses[item.tone].footer"
            >
              <span>Khám phá ngay</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </NuxtLink>
        </AwesomeLandingReveal>
      </div>
    </section>

    <!-- 5. CURRICULUM & LEVEL SELECTION (FeatureShowCase) -->
    <section class="py-10 w-full">
      <AwesomeLandingReveal variant="up">
        <LayoutPageSectionFeatureShowCase />
      </AwesomeLandingReveal>
    </section>
  </div>
</template>

<style scoped>
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
}
.tab-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.tab-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.98);
}
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
