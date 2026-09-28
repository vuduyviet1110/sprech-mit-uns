import type { Ref } from 'vue'

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function canHoverFine() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
}

/** 3D card tilt toward cursor (ported from ecommerce-angular tiltCard). */
export function useTiltCard(
  el: Ref<HTMLElement | null>,
  opts?: { maxAngle?: number },
) {
  const maxAngle = opts?.maxAngle ?? 8
  let frame = 0
  let pendingX = 0
  let pendingY = 0
  let currentX = 0
  let currentY = 0
  let enabled = false

  const apply = () => {
    const node = el.value
    if (!node) return
    node.style.transform = `perspective(1000px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`
  }

  const tick = () => {
    currentX += (pendingX - currentX) * 0.18
    currentY += (pendingY - currentY) * 0.18
    const closeEnough =
      Math.abs(pendingX - currentX) < 0.05 && Math.abs(pendingY - currentY) < 0.05
    apply()
    if (closeEnough && pendingX === 0 && pendingY === 0) {
      frame = 0
      return
    }
    frame = requestAnimationFrame(tick)
  }

  const onMove = (e: MouseEvent) => {
    if (!enabled || reducedMotion()) return
    const node = el.value
    if (!node) return
    const r = node.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    pendingX = -ny * 2 * maxAngle
    pendingY = nx * 2 * maxAngle
    if (!frame) frame = requestAnimationFrame(tick)
  }

  const onLeave = () => {
    pendingX = 0
    pendingY = 0
    if (!frame) frame = requestAnimationFrame(tick)
  }

  const refreshEnabled = () => {
    enabled = canHoverFine() && !reducedMotion()
    if (!enabled) {
      pendingX = 0
      pendingY = 0
      currentX = 0
      currentY = 0
      apply()
    }
  }

  onMounted(() => {
    refreshEnabled()
    const node = el.value
    if (!node) return
    node.style.willChange = 'transform'
    node.style.transformStyle = 'preserve-3d'
    node.addEventListener('mousemove', onMove, { passive: true })
    node.addEventListener('mouseleave', onLeave)
    window.matchMedia('(hover: hover) and (pointer: fine)').addEventListener('change', refreshEnabled)
  })

  onUnmounted(() => {
    if (frame) cancelAnimationFrame(frame)
    const node = el.value
    if (!node) return
    node.removeEventListener('mousemove', onMove)
    node.removeEventListener('mouseleave', onLeave)
  })
}
