<template>
  <Card class="bg-white/90 backdrop-blur-sm">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-2xl text-blue-900">Reading Passage</CardTitle>
        <div class="flex gap-4">
          <Button
            variant="outline"
            class="border-blue-200 flex items-center gap-1"
            size="sm"
            @click="toggleTranslation"
            aria-label="Toggle translation"
          >
            <Icon
              :name="showTranslation ? 'lucide:eye-off' : 'lucide:eye'"
              class="h-4 w-4 inline-block"
            />
            <span>{{ showTranslation ? 'Hide' : 'Show' }} Translation</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="flex items-center gap-1 border-blue-200"
            aria-label="Listen to audio"
            :disabled="playingWord === topic.paragraph"
            @click="playAudioOrSpeak(topic)"
          >
            <Icon name="mdi:volume-high" class="h-4 w-4" />
            <span>Listen</span>
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-6">
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100"
      >
        <h3 class="text-lg font-semibold text-blue-900 mb-4">German Text</h3>
        <p class="text-lg leading-relaxed text-gray-800 font-medium">
          {{ topic.paragraph }}
        </p>
      </div>

      <div
        v-if="showTranslation"
        class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100"
      >
        <h3 class="text-lg font-semibold text-green-900 mb-4">
          English Translation
        </h3>
        <p class="text-lg leading-relaxed text-gray-700">
          {{ topic.englishTranslation }}
        </p>
      </div>

      <div
        class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-100"
      >
        <h3 class="text-lg font-semibold text-orange-900 mb-4">Reading Tips</h3>
        <ul class="space-y-2 text-gray-700">
          <li>
            • Read the German text first without looking at the translation
          </li>
          <li>• Try to identify words you already know</li>
          <li>• Use context clues to guess unfamiliar words</li>
          <li>• Listen to the audio to improve pronunciation</li>
        </ul>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import type { VocabularyWord } from '~/utils/types'

const props = defineProps<{
  topic: {
    id: string
    title: string
    paragraph: string
    englishTranslation: string
  } & VocabularyWord
  showTranslation: boolean
}>()
const {
  playingWord,
  errorMessage: errorMessageAudio,
  playAudioOrSpeak,
} = useAudioPlayback()
const emit = defineEmits<{
  (event: 'update:showTranslation', value: boolean): void
}>()

const toggleTranslation = () => {
  emit('update:showTranslation', !props.showTranslation)
}
</script>
