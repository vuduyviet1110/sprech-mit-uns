<script lang="ts" setup>
/**
 * Scroll-triggered reveal (IntersectionObserver).
 * Safer than v-motion visibleOnce on SPA back-navigation.
 */
withDefaults(
  defineProps<{
    delay?: number
    variant?: 'up' | 'left' | 'right' | 'scale' | 'domino' | 'deal'
  }>(),
  {
    delay: 0,
    variant: 'up',
  },
)

const root = ref<HTMLElement | null>(null)
const visible = ref(false)

let io: IntersectionObserver | null = null
let nearTimer: ReturnType<typeof setTimeout> | undefined
let safetyTimer: ReturnType<typeof setTimeout> | undefined

function markVisible() {
  if (visible.value) return
  visible.value = true
  io?.disconnect()
  io = null
  if (nearTimer) clearTimeout(nearTimer)
  if (safetyTimer) clearTimeout(safetyTimer)
}

function isNearViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight * 0.95 && rect.bottom > 0
}

onMounted(() => {
  const el = root.value
  if (!el) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    markVisible()
    return
  }

  io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) markVisible()
    },
    {
      threshold: 0.12,
      // Start a bit before fully in view so the motion is seen while scrolling
      rootMargin: '0px 0px -10% 0px',
    },
  )
  io.observe(el)

  // Already on-screen after SPA remount / short pages
  requestAnimationFrame(() => {
    if (isNearViewport(el)) markVisible()
  })

  nearTimer = setTimeout(() => {
    if (el && isNearViewport(el)) markVisible()
  }, 350)

  // Absolute safety — only if still stuck (never leave blank forever)
  safetyTimer = setTimeout(() => markVisible(), 6000)
})

onUnmounted(() => {
  io?.disconnect()
  if (nearTimer) clearTimeout(nearTimer)
  if (safetyTimer) clearTimeout(safetyTimer)
})
</script>

<template>
  <div
    ref="root"
    class="landing-reveal"
    :class="[`landing-reveal--${variant}`, { 'is-visible': visible }]"
    :style="{ transitionDelay: `${delay}ms` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.landing-reveal {
  opacity: 0;
  will-change: transform, opacity;
  transition:
    opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
  transform-style: preserve-3d;
}

.landing-reveal--up {
  transform: translate3d(0, 56px, 0);
}
.landing-reveal--left {
  transform: translate3d(-48px, 20px, 0);
}
.landing-reveal--right {
  transform: translate3d(48px, 20px, 0);
}
.landing-reveal--scale {
  transform: translate3d(0, 36px, 0) scale(0.94);
}
.landing-reveal--domino {
  transform: perspective(900px) rotateX(-55deg) translate3d(0, 40px, 0) scale(0.9);
  transform-origin: 50% 100%;
}
.landing-reveal--deal {
  transform: translate3d(0, 64px, 0) scale(0.82) rotate(-4deg);
  transform-origin: 50% 80%;
}

.landing-reveal.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1) rotate(0) rotateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .landing-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
