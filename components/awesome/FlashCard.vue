<script setup lang="ts">
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { MASTER_MIN_REPETITIONS } from '~/utils/srs-mastery'

const props = defineProps<{
  word: string
  meaning?: string
  example?: string
  language?: string
  type?: string
  isFlipped: boolean
  stageLabel?: string
  recallChain?: number
  intervalDays?: number
}>()

const emit = defineEmits<{
  (e: 'flip'): void
}>()

const { playAudioOrSpeak } = useAudioPlayback()

const playAudio = () => {
  if (props.word) {
    playAudioOrSpeak({
      word: props.word,
      lang: props.language || 'de',
    })
  }
}
</script>

<template>
  <div
    class="perspective group w-full max-w-3xl mx-auto h-[min(22rem,52vh)] sm:h-[24rem] cursor-pointer"
    role="button"
    tabindex="0"
    aria-label="Lật thẻ từ vựng"
    @click="emit('flip')"
    @keydown.enter.prevent="emit('flip')"
  >
    <div
      class="w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] preserve-3d relative"
      :class="{ 'rotate-y-180': isFlipped }"
    >
      <!-- FRONT -->
      <div
        class="absolute inset-0 backface-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-900/5 dark:shadow-black/20 p-6 sm:p-8 flex flex-col justify-between items-center text-center transition-colors group-hover:border-primary-400/70"
      >
        <div class="flex items-center justify-between w-full gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
              {{ language === 'cs' ? '🇨🇿 Tiếng Séc' : '🇩🇪 Tiếng Đức' }}{{ type ? ` · ${type}` : '' }}
            </span>
            <span
              v-if="stageLabel"
              class="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-500/20"
            >
              {{ stageLabel }}
            </span>
          </div>
          <button
            type="button"
            class="p-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-white transition-colors active:scale-95"
            title="Phát âm"
            @click.stop="playAudio"
          >
            <Icon name="lucide:volume-2" class="w-4 h-4" />
          </button>
        </div>

        <div class="my-auto px-2">
          <h2 class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight break-words">
            {{ word }}
          </h2>
          <p
            v-if="recallChain !== undefined"
            class="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400"
          >
            Chuỗi nhớ {{ recallChain }}/{{ MASTER_MIN_REPETITIONS }}
            <span v-if="intervalDays !== undefined"> · {{ intervalDays }} ngày</span>
          </p>
        </div>

        <div class="text-xs font-bold text-slate-400 group-hover:text-primary-500 flex items-center gap-2 transition-colors">
          <Icon name="lucide:rotate-cw" class="w-3.5 h-3.5" />
          <span>Bấm hoặc Space để xem nghĩa</span>
        </div>
      </div>

      <!-- BACK -->
      <div
        class="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-primary-400/60 dark:border-primary-600 bg-gradient-to-br from-primary-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/40 shadow-lg p-6 sm:p-8 flex flex-col justify-between items-center text-center"
      >
        <div class="flex items-center justify-between w-full gap-2">
          <span class="px-2.5 py-1 bg-primary-500/15 text-primary-700 dark:text-primary-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-primary-500/25">
            Đáp án
          </span>
          <button
            type="button"
            class="p-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-white transition-colors active:scale-95"
            title="Phát âm"
            @click.stop="playAudio"
          >
            <Icon name="lucide:volume-2" class="w-4 h-4" />
          </button>
        </div>

        <div class="my-auto w-full space-y-3 px-1">
          <p class="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 leading-snug">
            {{ meaning || 'Chưa có nghĩa' }}
          </p>
          <p
            v-if="example"
            class="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed bg-white/70 dark:bg-slate-950/50 px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800"
          >
            “{{ example }}”
          </p>
        </div>

        <div class="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
          <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
          Chọn mức nhớ bên dưới
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1200px;
}
.preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
