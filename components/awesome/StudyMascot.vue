<script setup lang="ts">
/**
 * Study companion fox.
 * Pointer tracking, sprite cells, and boop timing adapted from page-mascot
 * (MIT © Kamran Ahmed, https://github.com/nilbuild/page-mascot).
 * Study tips / greetings / streak cues are app-specific extensions.
 */
import { MASCOT_REACTIONS } from '~/utils/mascot-tips'

const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const

type Direction = (typeof DIRECTIONS)[number]

const CLOCKWISE: Direction[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
]
const SECTOR = (Math.PI * 2) / CLOCKWISE.length
const HYSTERESIS = 0.12
const DEAD_ZONE = 70
const SQUASH_MS = 420

const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
]

const DIRECTIONS_URL = '/mascots/fox-directions.webp'
const REACTIONS_URL = '/mascots/fox-reactions.webp'

const {
  reaction,
  line,
  collapsed,
  enabled,
  action,
  boop,
  askTip,
  runAction,
  setCollapsed,
  hydrateCollapsed,
  touch,
} = useStudyMascot()

/**
 * Sprite cảm xúc (~190KB) chỉ tải khi sắp cần: lần đầu cáo có phản ứng, hoặc
 * khi chuột vừa rê tới. Phần lớn phiên chỉ đọc bài, không bao giờ chạm tới nó.
 */
const reactionsReady = ref(false)
let reactionsRequested = false

function preloadReactions() {
  if (reactionsRequested || !import.meta.client) return
  reactionsRequested = true
  const img = new Image()
  img.onload = () => {
    reactionsReady.value = true
  }
  img.src = REACTIONS_URL
}

watch(reaction, (value) => {
  if (value) preloadReactions()
})

const buttonRef = ref<HTMLButtonElement | null>(null)
const squashRef = ref<HTMLElement | null>(null)
const direction = ref<Direction>('center')

const directionCell = computed(() => cellStyle(DIRECTIONS.indexOf(direction.value)))
const reactionCell = computed(() => cellStyle(MASCOT_REACTIONS.indexOf(reaction.value ?? 'blink')))
/** Chỉ đổi sang mặt cảm xúc khi ảnh đã sẵn sàng, tránh nháy ô trống. */
const showReaction = computed(() => !!reaction.value && reactionsReady.value)

function cellStyle(index: number) {
  return {
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  }
}

function wrap(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

let sector = -1
let pointer: { x: number; y: number } | null = null
let tracking = false

function aim() {
  const button = buttonRef.value
  if (!button || !pointer || collapsed.value) return

  const box = button.getBoundingClientRect()
  const dx = pointer.x - (box.left + box.width / 2)
  const dy = pointer.y - (box.top + box.height / 2)

  if (Math.hypot(dx, dy) < DEAD_ZONE) {
    sector = -1
    direction.value = 'center'
    return
  }

  const angle = Math.atan2(dy, dx)
  if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) {
    return
  }

  sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length
  direction.value = CLOCKWISE[sector]
}

function onPointerMove(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY }
  aim()
}

function onBoop() {
  touch()
  const squash = boop()
  if (!squash) return
  squashRef.value?.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' })
}

function onAskTip() {
  askTip()
}

onMounted(() => {
  hydrateCollapsed()
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  tracking = true
  buttonRef.value?.addEventListener('pointerenter', preloadReactions, { once: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', aim, { passive: true })
})

onUnmounted(() => {
  if (!tracking) return
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('scroll', aim)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="enabled"
      class="pointer-events-none fixed bottom-4 left-4 z-30 flex items-end gap-2"
      style="bottom: max(1rem, env(safe-area-inset-bottom)); left: max(1rem, env(safe-area-inset-left))"
      data-testid="study-mascot"
    >
      <button
        v-if="collapsed"
        type="button"
        class="pointer-events-auto h-11 w-11 cursor-pointer rounded-full border border-slate-200/80 bg-white shadow-sm transition-all duration-200 active:scale-95 dark:border-slate-800 dark:bg-slate-900"
        :style="{
          backgroundImage: `url(${DIRECTIONS_URL})`,
          backgroundSize: '300% 300%',
          backgroundPosition: '50% 50%',
          backgroundRepeat: 'no-repeat',
        }"
        aria-label="Hiện cáo đồng hành"
        @click="setCollapsed(false)"
      />

      <div v-else class="pointer-events-auto relative flex flex-col items-start gap-2">
        <div
          v-if="line"
          class="absolute bottom-full left-0 z-10 mb-2 w-max max-w-[15rem] rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p
            class="text-sm font-bold leading-snug text-slate-800 dark:text-slate-100"
            data-testid="mascot-line"
            role="status"
          >
            {{ line }}
          </p>
          <button
            v-if="action"
            type="button"
            class="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-extrabold text-white transition-all duration-200 active:scale-95 hover:bg-primary-600"
            data-testid="mascot-action"
            @click="runAction"
          >
            {{ action.label }}
            <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
          </button>
        </div>

        <div class="flex items-end gap-2">
          <button
            ref="buttonRef"
            type="button"
            class="relative block h-24 w-24 shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 select-none sm:h-28 sm:w-28"
            aria-label="Cáo đồng hành. Bấm để nhận mẹo học."
            @click="onBoop"
          >
            <span
              ref="squashRef"
              class="relative block h-full w-full"
              style="transform-origin: 50% 78%"
            >
              <span
                class="absolute inset-0 bg-no-repeat"
                :style="{
                  backgroundImage: `url(${DIRECTIONS_URL})`,
                  backgroundSize: '300% 300%',
                  ...directionCell,
                  opacity: showReaction ? 0 : 1,
                }"
              />
              <span
                class="absolute inset-0 bg-no-repeat"
                :style="{
                  backgroundImage: reactionsReady ? `url(${REACTIONS_URL})` : 'none',
                  backgroundSize: '300% 300%',
                  ...reactionCell,
                  opacity: showReaction ? 1 : 0,
                }"
                aria-hidden="true"
              />
            </span>
          </button>

          <div class="mb-1 flex flex-col gap-1.5">
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200/80 bg-primary-50 px-2.5 py-1.5 text-sm font-extrabold text-primary-700 shadow-sm transition-all duration-200 active:scale-95 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300"
              aria-label="Xin mẹo học từ cáo"
              data-testid="mascot-tip"
              @click="onAskTip"
            >
              <Icon name="lucide:lightbulb" class="h-4 w-4" />
              Mẹo
            </button>
            <button
              type="button"
              class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              aria-label="Thu nhỏ cáo"
              data-testid="mascot-collapse"
              @click="setCollapsed(true)"
            >
              <Icon name="lucide:minus" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
