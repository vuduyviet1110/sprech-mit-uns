<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  language?: string
}>()

const emit = defineEmits(['back', 'complete'])

const { playSound, triggerConfetti } = useGamification()
const { recordStoryScenarioComplete } = useDailyQuests()

const scenarios = ref<any[]>([])
const selectedScenario = ref<any | null>(null)
const currentStepId = ref<string>('step-1')
const userScore = ref(0)
const maxPossibleScore = ref(0)
const conversationHistory = ref<any[]>([])
const isFinished = ref(false)
const isLoading = ref(true)
const showTranslation = ref(true)

const fetchScenarios = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<any[]>('/api/scenarios')
    if (data && data.length) {
      scenarios.value = data
    }
  } catch (err) {
    console.error('Error fetching scenarios:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchScenarios()
})

const startScenario = (scenario: any) => {
  selectedScenario.value = scenario
  currentStepId.value = 'step-1'
  userScore.value = 0
  maxPossibleScore.value = 0
  conversationHistory.value = []
  isFinished.value = false

  const firstNode = scenario.nodes.find((n: any) => n.id === 'step-1')
  if (firstNode) {
    speakNpc(firstNode.npcSpeech, scenario.language)
  }
}

const currentNode = computed(() => {
  if (!selectedScenario.value) return null
  return selectedScenario.value.nodes.find((n: any) => n.id === currentStepId.value) || null
})

const selectChoice = (choice: any) => {
  if (!currentNode.value || isFinished.value) return

  playSound('correct')
  userScore.value += choice.score
  maxPossibleScore.value += 100

  // Record history
  conversationHistory.value.push({
    npcName: currentNode.value.npcName,
    npcAvatar: currentNode.value.npcAvatar,
    npcSpeech: currentNode.value.npcSpeech,
    npcSpeechVi: currentNode.value.npcSpeechVi,
    userSpeech: choice.text,
    userTranslation: choice.translation,
    score: choice.score,
    npcResponse: choice.npcResponse,
  })

  const nextId = choice.nextStepId

  if (nextId === 'finish' || nextId === 'end-early') {
    isFinished.value = true
    playSound('complete')
    triggerConfetti()
    recordStoryScenarioComplete()
    emit('complete', {
      scenarioId: selectedScenario.value?.id,
      score: userScore.value,
    })
  } else {
    currentStepId.value = nextId
    const nextNode = selectedScenario.value.nodes.find((n: any) => n.id === nextId)
    if (nextNode) {
      speakNpc(nextNode.npcSpeech, selectedScenario.value.language)
    }
  }
}

const speakNpc = (text: string, lang: string = 'de') => {
  speakText(text, lang)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <button
        @click="selectedScenario ? (selectedScenario = null) : emit('back')"
        class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span>{{ selectedScenario ? 'Đổi tình huống' : 'Trở về' }}</span>
      </button>

      <div v-if="selectedScenario" class="flex items-center gap-2">
        <button
          @click="showTranslation = !showTranslation"
          class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          :class="showTranslation ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
        >
          <Icon name="lucide:languages" class="w-4 h-4" />
          <span>{{ showTranslation ? 'Dịch Tiếng Việt: BẬT' : 'Dịch Tiếng Việt: TẮT' }}</span>
        </button>
      </div>
    </div>

    <!-- Scenario Selection Grid -->
    <div v-if="!selectedScenario" class="space-y-6">
      <div class="space-y-1">
        <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">🎭 Phiêu Lưu Kịch Bản Giao Tiếp</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Chọn một ngữ cảnh giao tiếp thực tế ở Đức hoặc Séc để nhập vai xử lý tình huống.
        </p>
      </div>

      <div v-if="isLoading" class="flex justify-center py-10">
        <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="item in scenarios"
          :key="item.id"
          @click="startScenario(item)"
          class="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
        >
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {{ item.language === 'cs' ? '🇨🇿 Tiếng Séc' : '🇩🇪 Tiếng Đức' }} • {{ item.level }}
            </span>
          </div>

          <div>
            <h4 class="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
              {{ item.title }}
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {{ item.description }}
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-primary-500 font-bold text-xs">
            <span>Bắt đầu nhập vai</span>
            <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>

    <!-- Active Scenario Stage -->
    <div v-else class="space-y-6 max-w-2xl mx-auto">
      <div v-if="!isFinished && currentNode" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <!-- NPC Dialogue Box -->
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
            {{ currentNode.npcAvatar }}
          </div>
          <div class="space-y-2 flex-1">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {{ currentNode.npcName }}
              </span>
              <button
                @click="speakNpc(currentNode.npcSpeech, selectedScenario.language)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Nghe phát âm"
              >
                <Icon name="lucide:volume-2" class="w-4 h-4" />
              </button>
            </div>

            <div class="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <p class="text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
                "{{ currentNode.npcSpeech }}"
              </p>
              <p v-if="showTranslation" class="text-xs text-slate-500 dark:text-slate-400 italic">
                ({{ currentNode.npcSpeechVi }})
              </p>
            </div>
          </div>
        </div>

        <!-- Choices -->
        <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hãy chọn phản hồi phù hợp nhất của bạn:
          </p>

          <button
            v-for="(choice, idx) in currentNode.choices"
            :key="idx"
            @click="selectChoice(choice)"
            class="w-full text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-950/30 transition-all duration-200 cursor-pointer space-y-1 group active:scale-98"
          >
            <p class="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {{ choice.text }}
            </p>
            <p v-if="showTranslation" class="text-xs text-slate-500 dark:text-slate-400 italic">
              {{ choice.translation }}
            </p>
          </button>
        </div>
      </div>

      <!-- Finished Scenario Screen -->
      <div v-else-if="isFinished" class="text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
        <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <Icon name="lucide:award" class="w-8 h-8" />
        </div>

        <div class="space-y-1">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">HOÀN THÀNH TÌNH HUỐNG!</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Bạn đã xử lý giao tiếp thành công trong ngữ cảnh {{ selectedScenario?.title }}.
          </p>
        </div>

        <div class="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-5 py-2.5 rounded-xl">
          <Icon name="lucide:sparkles" class="w-5 h-5 text-emerald-500" />
          <span class="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">Điểm Lịch Sự: {{ userScore }} / {{ maxPossibleScore }} PTS</span>
        </div>

        <div>
          <button
            @click="selectedScenario = null"
            class="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
          >
            <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
            <span>Chọn Tình Huống Khác</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
