<script lang="ts" setup>
import { useAudioPlayback } from '~/composables/vocab/use-audio-playback'
import { useGamification } from '~/composables/use-gamification'

definePageMeta({ layout: 'page' })

useHead({
  title: 'Ôn tập SRS Thông minh - Sprech Mit Uns',
})

const userId = 'user-demo-id'
const { playAudioOrSpeak } = useAudioPlayback()
const { triggerConfetti, playSound } = useGamification()

const loading = ref(true)
const dueWords = ref<any[]>([])
const totalDueCount = ref(0)
const currentIndex = ref(0)
const isFlipped = ref(false)
const isFinished = ref(false)
const submitting = ref(false)

const currentItem = computed(() => dueWords.value[currentIndex.value] || null)

const fetchDueReviews = async () => {
  try {
    loading.value = true
    const resp = await $fetch<any>(`/api/srs/review?userId=${userId}`)
    dueWords.value = resp.dueWords || []
    totalDueCount.value = resp.totalDueCount || 0
  } catch (err) {
    console.error('Failed to fetch due reviews:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDueReviews()
})

const flipCard = () => {
  isFlipped.value = !isFlipped.value
  if (isFlipped.value && currentItem.value?.word) {
    playAudioOrSpeak({
      word: currentItem.value.word.word,
      audioUrl: currentItem.value.word.audioUrl,
      lang: currentItem.value.word.language === 'cs' ? 'cs-CZ' : 'de-DE',
    })
  }
}

const handleReviewAnswer = async (quality: number) => {
  if (!currentItem.value || submitting.value) return

  try {
    submitting.value = true

    if (quality >= 3) {
      playSound('correct')
    } else {
      playSound('wrong')
    }

    await $fetch('/api/srs/review', {
      method: 'POST',
      body: {
        userId,
        wordId: currentItem.value.wordId,
        quality,
      },
    })

    if (currentIndex.value + 1 < dueWords.value.length) {
      currentIndex.value++
      isFlipped.value = false
    } else {
      isFinished.value = true
      playSound('complete')
      triggerConfetti()
    }
  } catch (err) {
    console.error('Error recording review:', err)
  } finally {
    submitting.value = false
  }
}

const resetSession = () => {
  currentIndex.value = 0
  isFlipped.value = false
  isFinished.value = false
  fetchDueReviews()
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <NuxtLink to="/progress" class="text-sm font-bold text-primary-500 hover:underline flex items-center gap-1">
          <Icon name="uil:arrow-left" class="w-4 h-4" /> Tiến độ học
        </NuxtLink>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="px-3 py-1 text-xs font-extrabold rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
          SUPERMEMO-2 SRS
        </span>
      </div>

      <LayoutPageTitle text="Ôn Tập Từ Vựng Thông Minh" class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white" />
      <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1">
        Hệ thống tự động tính toán thời điểm sắp quên để nhắc bạn ôn tập đúng lúc nhất.
      </p>
    </LayoutPageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-500 font-medium">Đang tìm các từ vựng cần ôn hôm nay...</p>
    </div>

    <!-- Empty State: No Due Reviews -->
    <div v-else-if="!dueWords.length" class="max-w-md mx-auto text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm space-y-6">
      <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <Icon name="uil:check-circle" class="w-10 h-10" />
      </div>
      <div>
        <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">Không có từ nào cần ôn!</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
          Tuyệt vời! Bạn đã hoàn tất tất cả các từ vựng cần ôn hôm nay. Hãy quay lại vào ngày mai nhé!
        </p>
      </div>
      <NuxtLink to="/dictionary" class="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all">
        Học thêm bài học mới
      </NuxtLink>
    </div>

    <!-- Finished Screen -->
    <div v-else-if="isFinished" class="max-w-md mx-auto text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm space-y-6">
      <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <Icon name="uil:trophy" class="w-10 h-10" />
      </div>
      <div>
        <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">Hoàn thành phiên ôn tập!</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Bạn vừa củng cố ghi nhớ thành công {{ dueWords.length }} từ vựng.
        </p>
      </div>
      <div class="flex gap-4">
        <button @click="resetSession" class="flex-1 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl">
          Ôn lại lượt nữa
        </button>
        <NuxtLink to="/progress" class="flex-1 py-3 bg-primary-500 text-white font-bold rounded-xl text-center">
          Về tiến độ
        </NuxtLink>
      </div>
    </div>

    <!-- Active Review Deck -->
    <div v-else class="max-w-2xl mx-auto space-y-6">
      <!-- Progress Bar -->
      <div class="flex items-center justify-between text-sm font-bold text-slate-500">
        <span>Từ {{ currentIndex + 1 }} / {{ dueWords.length }}</span>
        <div class="w-48 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div class="bg-primary-500 h-full transition-all duration-300" :style="{ width: `${((currentIndex + 1) / dueWords.length) * 100}%` }"></div>
        </div>
      </div>

      <!-- Flashcard Interactive -->
      <div
        @click="flipCard"
        class="cursor-pointer min-h-[320px] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary-500/60 rounded-3xl p-8 shadow-lg flex flex-col justify-between items-center text-center transition-all duration-300 select-none group relative overflow-hidden"
      >
        <!-- Front Side: Word -->
        <div v-if="!isFlipped" class="my-auto space-y-4">
          <span class="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
            {{ currentItem.word.level || 'Vocab' }}
          </span>
          <h2 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-wide group-hover:scale-105 transition-transform">
            {{ currentItem.word.word }}
          </h2>
          <p v-if="currentItem.word.transcription" class="text-sm text-slate-400 font-mono">
            [{{ currentItem.word.transcription }}]
          </p>
          <p class="text-xs text-primary-500 font-bold tracking-wider uppercase mt-4 flex items-center justify-center gap-1">
            <Icon name="uil:sync" class="w-4 h-4" /> Bấm vào thẻ để xem nghĩa
          </p>
        </div>

        <!-- Back Side: Meaning & Example -->
        <div v-else class="my-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <h3 class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {{ currentItem.word.meaning }}
          </h3>
          <p v-if="currentItem.word.example" class="text-base text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 max-w-lg">
            "{{ currentItem.word.example }}"
          </p>
        </div>

        <!-- Audio Button -->
        <button
          @click.stop="playAudioOrSpeak({ word: currentItem.word.word, audioUrl: currentItem.word.audioUrl, lang: currentItem.word.language === 'cs' ? 'cs-CZ' : 'de-DE' })"
          class="absolute top-4 right-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 transition-all"
        >
          <Icon name="uil:volume-up" class="w-5 h-5" />
        </button>
      </div>

      <!-- SM-2 Self Evaluation Ratings (Shown after flip) -->
      <div v-if="isFlipped" class="space-y-3 animate-in slide-in-from-bottom-3 duration-300">
        <p class="text-center text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          Bạn nhớ từ này ở mức độ nào?
        </p>
        <div class="grid grid-cols-3 gap-3">
          <button
            @click="handleReviewAnswer(1)"
            :disabled="submitting"
            class="py-3 px-4 rounded-2xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-bold text-sm transition-all active:scale-95 flex flex-col items-center gap-1"
          >
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:x-mark" class="w-4 h-4 text-red-500" /> Không nhớ</span>
            <span class="text-[10px] font-normal text-red-500 mt-0.5">Ôn lại ngay 1 ngày</span>
          </button>

          <button
            @click="handleReviewAnswer(3)"
            :disabled="submitting"
            class="py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-bold text-sm transition-all active:scale-95 flex flex-col items-center gap-1"
          >
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:question-mark-circle" class="w-4 h-4 text-amber-500" /> Nhớ vừa</span>
            <span class="text-[10px] font-normal text-amber-500 mt-0.5">Ôn lại sau 3-6 ngày</span>
          </button>

          <button
            @click="handleReviewAnswer(5)"
            :disabled="submitting"
            class="py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-bold text-sm transition-all active:scale-95 flex flex-col items-center gap-1"
          >
            <span class="inline-flex items-center gap-1"><Icon name="heroicons:bolt" class="w-4 h-4 text-emerald-500" /> Nhớ rất rõ</span>
            <span class="text-[10px] font-normal text-emerald-500 mt-0.5">Tăng khoảng cách ngày</span>
          </button>
        </div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
