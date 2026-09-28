<script setup lang="ts">
/**
 * Multi-curve spring trail (Mage/Cursify style):
 * - Many thin lines with slightly different springs
 * - quadraticCurveTo + lighter blend = smooth glow ribbons
 * - Keeps ring / hover tip for UX
 * - Can be toggled via useCustomCursor()
 */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const { isEnabled } = useCustomCursor()

const TRAILS = 18
const NODES = 28
const FRICTION = 0.5
const DAMPEN = 0.025
const TENSION = 0.98
const HOVER_MS = 50

type Node = { x: number; y: number; vx: number; vy: number }
type Line = { spring: number; friction: number; nodes: Node[] }

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ringRef = ref<HTMLElement | null>(null)
const coreRef = ref<HTMLElement | null>(null)
const tipRef = ref<HTMLElement | null>(null)

let rafId: number | null = null
let ctx: CanvasRenderingContext2D | null = null
let mouseX = -100
let mouseY = -100
let active = false
let isHovered = false
let isClicked = false
let hoverText = ''
let lastHoverCheck = 0
let reduced = false
let lines: Line[] = []
let huePhase = Math.random() * Math.PI * 2
let listenersBound = false

function makeLine(spring: number): Line {
  const nodes: Node[] = Array.from({ length: NODES }, () => ({
    x: mouseX,
    y: mouseY,
    vx: 0,
    vy: 0,
  }))
  return { spring, friction: FRICTION, nodes }
}

function initLines() {
  lines = []
  for (let i = 0; i < TRAILS; i++) {
    lines.push(makeLine(0.42 + (i / TRAILS) * 0.035))
  }
}

function sizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  const tw = Math.floor(w * dpr)
  const th = Math.floor(h * dpr)
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw
    canvas.height = th
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx = canvas.getContext('2d', { alpha: true })
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  } else if (!ctx) {
    ctx = canvas.getContext('2d', { alpha: true })
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
}

function checkHover(e: MouseEvent) {
  const now = performance.now()
  if (now - lastHoverCheck < HOVER_MS) return
  lastHoverCheck = now

  const el = (e.target as HTMLElement | null)?.closest(
    'a, button, [role="button"], input, textarea, select, .cursor-pointer, [data-cursor-text]',
  ) as HTMLElement | null

  if (el) {
    isHovered = true
    hoverText = el.getAttribute('data-cursor-text') || ''
  } else {
    isHovered = false
    hoverText = ''
  }
}

function onMove(e: MouseEvent) {
  if (!isEnabled.value) return
  mouseX = e.clientX
  mouseY = e.clientY
  if (!active) {
    active = true
    for (const line of lines) {
      for (const n of line.nodes) {
        n.x = mouseX
        n.y = mouseY
        n.vx = 0
        n.vy = 0
      }
    }
  }
  checkHover(e)
}

function onDown() {
  if (!isEnabled.value) return
  isClicked = true
}
function onUp() {
  isClicked = false
}
function onLeave() {
  active = false
}

function onVisibility() {
  reduced = document.hidden
  if (!document.hidden && isEnabled.value && !rafId) {
    rafId = requestAnimationFrame(paint)
  }
}

function updateLine(line: Line) {
  let spring = line.spring
  let t = line.nodes[0]
  t.vx += (mouseX - t.x) * spring
  t.vy += (mouseY - t.y) * spring

  for (let i = 0; i < line.nodes.length; i++) {
    t = line.nodes[i]
    if (i > 0) {
      const n = line.nodes[i - 1]
      t.vx += (n.x - t.x) * spring
      t.vy += (n.y - t.y) * spring
      t.vx += n.vx * DAMPEN
      t.vy += n.vy * DAMPEN
    }
    t.vx *= line.friction
    t.vy *= line.friction
    t.vx *= TENSION
    t.vy *= TENSION
    t.x += t.vx
    t.y += t.vy
    spring *= 0.98
  }
}

function drawLine(line: Line, alpha: number) {
  if (!ctx) return
  const nodes = line.nodes
  ctx.beginPath()
  ctx.moveTo(nodes[0].x, nodes[0].y)
  for (let i = 1; i < nodes.length - 1; i++) {
    const e = nodes[i]
    const n = nodes[i + 1]
    const cx = 0.5 * (e.x + n.x)
    const cy = 0.5 * (e.y + n.y)
    ctx.quadraticCurveTo(e.x, e.y, cx, cy)
  }
  const last = nodes[nodes.length - 1]
  const prev = nodes[nodes.length - 2]
  ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y)
  const hue = 145 + Math.sin(huePhase) * 8
  ctx.strokeStyle = `hsla(${hue}, 55%, 48%, ${alpha})`
  ctx.stroke()
}

function hideOverlay() {
  if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  if (ringRef.value) ringRef.value.style.opacity = '0'
  if (coreRef.value) coreRef.value.style.opacity = '0'
  if (tipRef.value) tipRef.value.style.opacity = '0'
}

function paint() {
  rafId = null
  if (!isEnabled.value || reduced) return

  huePhase += 0.012

  if (ctx && active) {
    const w = window.innerWidth
    const h = window.innerHeight
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 0; i < lines.length; i++) {
      updateLine(lines[i])
      drawLine(lines[i], isHovered ? 0.14 : 0.2)
    }

    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
    ctx.arc(lines[0]?.nodes[0]?.x || mouseX, lines[0]?.nodes[0]?.y || mouseY, isHovered ? 3 : 4.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(59, 166, 118, 0.85)'
    ctx.fill()
  } else if (ctx) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }

  const leadX = lines[0]?.nodes[0]?.x ?? mouseX
  const leadY = lines[0]?.nodes[0]?.y ?? mouseY

  const ring = ringRef.value
  if (ring) {
    const r = isHovered ? 20 : 14
    ring.style.transform = `translate3d(${leadX - r}px, ${leadY - r}px, 0) scale(${
      isClicked ? 0.85 : 1
    })`
    ring.style.width = `${r * 2}px`
    ring.style.height = `${r * 2}px`
    ring.style.opacity = active ? '1' : '0'
    ring.dataset.hover = isHovered ? '1' : '0'
  }

  const core = coreRef.value
  if (core) {
    core.style.opacity = active && !isHovered ? '1' : '0'
    core.style.transform = `translate3d(${mouseX - 3.5}px, ${mouseY - 3.5}px, 0) scale(${
      isClicked ? 1.35 : 1
    })`
  }

  const tip = tipRef.value
  if (tip) {
    if (active && isHovered && hoverText) {
      tip.style.opacity = '1'
      tip.style.transform = `translate3d(${leadX + 16}px, ${leadY - 36}px, 0)`
      if (tip.textContent !== hoverText) tip.textContent = hoverText
    } else {
      tip.style.opacity = '0'
    }
  }

  rafId = requestAnimationFrame(paint)
}

function bindListeners() {
  if (listenersBound) return
  listenersBound = true
  window.addEventListener('resize', sizeCanvas, { passive: true })
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('mousedown', onDown)
  window.addEventListener('mouseup', onUp)
  document.addEventListener('mouseleave', onLeave)
  document.addEventListener('visibilitychange', onVisibility)
}

function unbindListeners() {
  if (!listenersBound) return
  listenersBound = false
  window.removeEventListener('resize', sizeCanvas)
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mousedown', onDown)
  window.removeEventListener('mouseup', onUp)
  document.removeEventListener('mouseleave', onLeave)
  document.removeEventListener('visibilitychange', onVisibility)
}

async function enableCursor() {
  document.documentElement.classList.add('has-custom-cursor')
  initLines()
  await nextTick()
  sizeCanvas()
  bindListeners()
  active = false
  if (!rafId) rafId = requestAnimationFrame(paint)
}

function disableCursor() {
  document.documentElement.classList.remove('has-custom-cursor')
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  active = false
  isHovered = false
  isClicked = false
  hoverText = ''
  hideOverlay()
  unbindListeners()
}

watch(
  isEnabled,
  (on) => {
    if (on) enableCursor()
    else disableCursor()
  },
)

onMounted(() => {
  if (isEnabled.value) enableCursor()
})

onUnmounted(() => {
  disableCursor()
  ctx = null
  lines = []
})
</script>

<template>
  <ClientOnly>
    <div
      v-show="isEnabled"
      class="pointer-events-none fixed inset-0 z-[99999] overflow-hidden hidden md:block"
      aria-hidden="true"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />

      <div
        ref="ringRef"
        class="cursor-ring absolute top-0 left-0 rounded-full border-2 will-change-transform"
        style="opacity: 0; width: 28px; height: 28px"
      />

      <div
        ref="tipRef"
        class="absolute top-0 left-0 px-2.5 py-1 rounded-md bg-slate-900 text-[9px] font-black uppercase tracking-wider text-primary-300 border border-primary-500/40 shadow-lg will-change-transform"
        style="opacity: 0"
      />

      <div
        ref="coreRef"
        class="absolute top-0 left-0 h-[7px] w-[7px] rounded-full bg-primary-600 dark:bg-primary-400 will-change-transform"
        style="opacity: 0; box-shadow: 0 0 10px rgba(59, 166, 118, 0.55)"
      />
    </div>
  </ClientOnly>
</template>

<style>
@media (min-width: 768px) {
  html.has-custom-cursor,
  html.has-custom-cursor body {
    cursor: none !important;
  }
  html.has-custom-cursor a,
  html.has-custom-cursor button,
  html.has-custom-cursor [role='button'],
  html.has-custom-cursor input,
  html.has-custom-cursor textarea,
  html.has-custom-cursor select,
  html.has-custom-cursor label,
  html.has-custom-cursor .cursor-pointer {
    cursor: none !important;
  }
}
</style>

<style scoped>
.cursor-ring {
  border-color: rgba(59, 166, 118, 0.7);
  background: rgba(59, 166, 118, 0.06);
  transition:
    width 0.15s ease,
    height 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.cursor-ring[data-hover='1'] {
  border-color: rgb(59, 166, 118);
  background: rgba(59, 166, 118, 0.16);
}
html.dark .cursor-ring {
  border-color: rgba(105, 202, 158, 0.75);
}
html.dark .cursor-ring[data-hover='1'] {
  border-color: rgb(105, 202, 158);
  background: rgba(105, 202, 158, 0.2);
}
</style>
