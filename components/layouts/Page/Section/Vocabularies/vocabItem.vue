<template>
  <article
    class="group flex h-full flex-col gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400/70 dark:hover:border-primary-600 transition-colors text-left"
  >
    <!-- Word + audio -->
    <div class="min-w-0 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight min-w-0 break-words">
          {{ vocab.word }}
        </h3>
        <button
          type="button"
          :disabled="playingWord === vocab.word"
          class="shrink-0 w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
          aria-label="Phát âm"
          @click="playAudioOrSpeak(vocab)"
        >
          <Icon
            :name="playingWord === vocab.word ? 'lucide:loader-2' : 'lucide:volume-2'"
            :class="['w-4 h-4', playingWord === vocab.word ? 'animate-spin' : '']"
          />
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-if="sourceLabel"
          class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border"
          :class="
            vocab.source === 'dictionary'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800'
              : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200/80 dark:border-primary-800'
          "
        >
          {{ sourceLabel }}
        </span>
        <span
          v-if="vocab.type"
          class="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
        >
          {{ vocab.type }}
        </span>
        <span
          v-if="vocab.level"
          class="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          {{ vocab.level }}
        </span>
      </div>
    </div>

    <!-- Meanings + example + note -->
    <div class="flex-1 min-w-0 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
      <div class="space-y-1">
        <div class="flex items-start gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <Icon name="twemoji:flag-vietnam" class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="line-clamp-2">{{ getViMeaning(vocab.meaning) || '—' }}</span>
        </div>
        <div
          v-if="getEnMeaning(vocab.meaning)"
          class="flex items-start gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
        >
          <Icon name="twemoji:flag-united-kingdom" class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="line-clamp-2">{{ getEnMeaning(vocab.meaning) }}</span>
        </div>
      </div>

      <p
        v-if="vocab.example"
        class="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-2"
      >
        “{{ vocab.example }}”
      </p>

      <p
        v-if="vocab.note"
        class="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg px-2.5 py-1.5 line-clamp-2"
      >
        <span class="font-bold">Ghi chú:</span> {{ vocab.note }}
      </p>

      <code
        v-if="vocab.transcription || vocab.vocabularyWord?.transcription"
        class="inline-block text-xs font-mono text-slate-500 dark:text-slate-400"
      >
        {{ vocab.transcription || vocab.vocabularyWord?.transcription }}
      </code>
    </div>

    <!-- Actions -->
    <div
      v-if="showEditButton || showDeleteButton"
      class="flex gap-2 mt-auto border-t border-slate-100 dark:border-slate-800 pt-3"
    >
      <button
        v-if="showEditButton"
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 transition-colors"
        @click="editVocabulary(vocab)"
      >
        <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
        Sửa
      </button>
      <button
        v-if="showDeleteButton"
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        @click="deleteVocabulary(vocab.id || '')"
      >
        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
        Xóa
      </button>
    </div>

    <p v-if="errorMessage" class="text-xs text-red-500 font-semibold">
      {{ errorMessage }}
    </p>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { UserVocabularyEntry, VocabularyWord } from '~/utils/types'

const props = defineProps<{
  vocab: VocabularyWord | UserVocabularyEntry | any
  playingWord: string | null
  errorMessage: string | null
  showEditButton?: boolean
  showDeleteButton?: boolean
}>()

const emit = defineEmits<{
  (e: 'playAudioOrSpeak', vocab: any): void
  (e: 'editVocabulary', vocab: any): void
  (e: 'deleteVocabulary', id: string): void
}>()

const sourceLabel = computed(() => {
  if (props.vocab?.source === 'dictionary') return 'Từ điển'
  if (props.vocab?.source === 'manual') return 'Tự thêm'
  return ''
})

const playAudioOrSpeak = (vocab: any) => {
  emit('playAudioOrSpeak', {
    ...vocab,
    audioUrl: vocab.audioUrl || vocab.vocabularyWord?.audioUrl,
    pronunciation: vocab.pronunciation || vocab.vocabularyWord?.pronunciation,
  })
}

const editVocabulary = (vocab: any) => {
  emit('editVocabulary', vocab)
}

const deleteVocabulary = (id: string) => {
  emit('deleteVocabulary', id)
}

const getViMeaning = (meaningStr?: string) => {
  if (!meaningStr) return ''
  const part = meaningStr.includes('•') ? meaningStr.split('•')[0] : meaningStr
  return part
    .replace(/VN\s*/i, '')
    .replace(/🇻🇳/g, '')
    .replace(/GB\s*/i, '')
    .replace(/🇬🇧/g, '')
    .replace(/^\|/, '')
    .trim()
}

const getEnMeaning = (meaningStr?: string) => {
  if (!meaningStr || !meaningStr.includes('•')) return ''
  const part = meaningStr.split('•')[1]
  return part
    .replace(/VN\s*/i, '')
    .replace(/🇻🇳/g, '')
    .replace(/GB\s*/i, '')
    .replace(/🇬🇧/g, '')
    .replace(/^\|/, '')
    .trim()
}
</script>
