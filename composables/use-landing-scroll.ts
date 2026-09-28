/**
 * Landing scroll: progress bar, parallax, and reliable IntersectionObserver reveals.
 */
export function useLandingScroll() {
  const reducedMotion = ref(false)
  const scrollProgress = ref(0)
  const scrollY = ref(0)

  let rafId = 0
  let ticking = false

  const parallax = computed(() => {
    if (reducedMotion.value) {
      return { slow: 0, mid: 0, fast: 0, hero: 0, heroScale: 1, heroOpacity: 1 }
    }
    const y = scrollY.value
    const heroFade = Math.min(y / 420, 1)
    return {
      slow: y * 0.28,
      mid: y * 0.45,
      fast: y * 0.65,
      hero: Math.min(y * 0.18, 90),
      heroScale: 1 - heroFade * 0.06,
      heroOpacity: 1 - heroFade * 0.35,
    }
  })

  function updateScrollMetrics() {
    if (!import.meta.client) return
    const doc = document.documentElement
    const max = Math.max(doc.scrollHeight - window.innerHeight, 1)
    scrollY.value = window.scrollY || doc.scrollTop || 0
    scrollProgress.value = Math.min(1, Math.max(0, scrollY.value / max))
    ticking = false
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    rafId = requestAnimationFrame(updateScrollMetrics)
  }

  onMounted(() => {
    reducedMotion.value = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    updateScrollMetrics()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (rafId) cancelAnimationFrame(rafId)
  })

  return {
    reducedMotion,
    scrollProgress,
    scrollY,
    parallax,
  }
}
