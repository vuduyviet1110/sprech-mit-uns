<script setup lang="ts">
const cardRef = ref<HTMLElement | null>(null)
useTiltCard(cardRef, { maxAngle: 4 })

defineProps<{
  mode: 'login' | 'register'
  title: string
  subtitle: string
}>()

const emit = defineEmits<{
  (e: 'use-demo'): void
}>()

const showDemoCredentials = computed(() => {
  const v = useRuntimeConfig().public.showDemo
  return v === '1' || v === 1 || v === true
})
const demoReady = ref(false)
onMounted(() => {
  demoReady.value = true
})

const highlights = computed(() => {
  const base: Array<{ icon: string; text: string; action?: string }> = [
    { icon: 'lucide:brain', text: 'Ôn SRS theo nhịp học của bạn' },
    { icon: 'lucide:headphones', text: 'Shadowing & phát âm thực tế' },
    { icon: 'lucide:route', text: 'Lộ trình A1–B1 Đức & Séc' },
  ]
  if (demoReady.value && showDemoCredentials.value) {
    base.push({ icon: 'lucide:key-round', text: 'Demo: demo@sprech.local / demo123', action: 'use-demo' })
  }
  return base
})

const onHighlightClick = (action?: string) => {
  if (action === 'use-demo') {
    emit('use-demo')
  }
}
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden">
    <!-- Full-bleed photo background -->
    <div class="absolute inset-0" aria-hidden="true">
      <img
        src="/images/auth-bg.jpg"
        alt=""
        class="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div
        class="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/55 to-primary-950/70 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-primary-950/80"
      />
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(59,166,118,0.28),transparent_55%)]"
      />
    </div>

    <div
      class="auth-entrance relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-10"
    >
      <div class="mb-6 flex items-center gap-2">
        <NuxtLink
          to="/"
          class="text-xl font-extrabold tracking-tight text-white transition-colors hover:text-primary-300"
          data-cursor-text="HOME"
        >
          Sprech <span class="text-primary-400">Mit Uns</span>
        </NuxtLink>
        <span class="h-1.5 w-1.5 rounded-full bg-primary-400" />
        <span class="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
          Học Đức &amp; Séc
        </span>
      </div>

      <div
        ref="cardRef"
        class="tilt-card grid min-h-[min(640px,calc(100vh-8rem))] grid-cols-1 overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-2xl shadow-slate-950/25 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 md:grid-cols-12"
      >
        <!-- Visual / brand column -->
        <div
          class="relative hidden overflow-hidden md:col-span-5 md:flex md:flex-col"
        >
          <img
            src="/images/auth-bg.jpg"
            alt=""
            class="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-primary-950/55 to-primary-900/30"
          />

          <div class="relative z-10 flex h-full flex-col gap-6 p-8 lg:p-10">
            <span
              class="inline-flex w-fit rounded-lg bg-white/15 px-3 py-1 text-sm font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur-sm"
            >
              {{ mode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu hành trình' }}
            </span>

            <div class="mt-auto space-y-5">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-900/40"
              >
                <Icon
                  :name="mode === 'login' ? 'lucide:book-open' : 'lucide:sparkles'"
                  class="h-6 w-6"
                />
              </div>
              <h2 class="max-w-sm text-3xl font-black leading-tight tracking-tight text-white">
                Học ngôn ngữ theo ngữ cảnh thật
              </h2>
              <p class="max-w-sm text-base leading-relaxed text-white/85">
                Flashcard, SRS, shadowing và dictation — một lộ trình rõ ràng mỗi ngày.
              </p>

              <ul class="space-y-3 pt-1">
                <li
                  v-for="item in highlights"
                  :key="item.text"
                >
                  <button
                    v-if="item.action === 'use-demo'"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-lg text-left text-sm font-bold text-white/90 transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-pointer"
                    data-cursor-text="DEMO"
                    @click="onHighlightClick(item.action)"
                  >
                    <span
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white shadow-md shadow-primary-900/40"
                    >
                      <Icon :name="item.icon" class="h-4 w-4" />
                    </span>
                    {{ item.text }}
                  </button>
                  <div
                    v-else
                    class="flex items-center gap-3 text-sm font-bold text-white/90"
                  >
                    <span
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-primary-300 backdrop-blur-sm"
                    >
                      <Icon :name="item.icon" class="h-4 w-4" />
                    </span>
                    {{ item.text }}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Form column -->
        <div
          class="relative col-span-1 flex flex-col justify-center bg-white p-7 dark:bg-slate-900 sm:p-9 md:col-span-7 lg:p-11"
        >
          <!-- Mobile-only compact intro -->
          <div
            class="mb-6 rounded-xl border border-primary-200/80 bg-primary-50/80 p-4 dark:border-primary-900/50 dark:bg-primary-950/40 md:hidden"
          >
            <p class="text-sm font-extrabold text-primary-700 dark:text-primary-300">
              {{ mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới' }}
            </p>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Lộ trình A1–B1 tiếng Đức &amp; tiếng Séc trong một chỗ.
            </p>
          </div>

          <div class="mb-7 space-y-2">
            <div
              class="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400"
            >
              <Icon
                :name="mode === 'login' ? 'lucide:log-in' : 'lucide:user-plus'"
                class="h-5 w-5"
              />
            </div>
            <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {{ title }}
            </h1>
            <p class="text-base text-slate-500 dark:text-slate-400">
              {{ subtitle }}
            </p>
          </div>

          <div class="w-full max-w-md">
            <slot />
          </div>

          <p class="mt-8 text-sm text-slate-400 dark:text-slate-500">
            Sprech Mit Uns · Học vui, học đều
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-entrance {
  animation: auth-card-in 480ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes auth-card-in {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.tilt-card {
  transform-style: preserve-3d;
}

@media (prefers-reduced-motion: reduce) {
  .auth-entrance {
    animation: none !important;
    opacity: 1 !important;
  }
}
</style>
