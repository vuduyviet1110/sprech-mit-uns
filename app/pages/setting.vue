<script lang="ts" setup>
import { useDailyPath } from '~/composables/use-daily-path'
import { useDailyQuests } from '~/composables/use-daily-quests'
import { useSession } from '~/composables/use-session'

definePageMeta({ layout: 'page' })
useHead({ title: 'Cài Đặt Ứng Dụng - Sprech Mit Uns' })

const colorMode = useColorMode()
const { settings, saveLearningSettings, loadSettings } = useDailyPath()
const { syncSrsQuestTotal } = useDailyQuests()
const { clearSession, fetchMe, isAuthenticated } = useSession()

const primaryLang = ref('de')
const speechRate = ref(0.85)
const dailyReminder = ref(true)
const autoPlayAudio = ref(true)
const srsTargetPerDay = ref(20)
const savedFlash = ref(false)
const authMsg = ref('')
const meEmail = ref<string | null>(null)

onMounted(async () => {
  await loadSettings()
  primaryLang.value = settings.value.primaryLang
  speechRate.value = settings.value.speechRate
  dailyReminder.value = settings.value.dailyReminder
  autoPlayAudio.value = settings.value.autoPlayAudio
  srsTargetPerDay.value = settings.value.dailyReviewTarget
  try {
    const me = await fetchMe()
    meEmail.value = me.email
  } catch {
    // ignore
  }
})

const saveSettings = () => {
  saveLearningSettings({
    primaryLang: primaryLang.value,
    speechRate: speechRate.value,
    dailyReminder: dailyReminder.value,
    autoPlayAudio: autoPlayAudio.value,
    dailyReviewTarget: srsTargetPerDay.value,
  })
  syncSrsQuestTotal(srsTargetPerDay.value)
  savedFlash.value = true
  setTimeout(() => {
    savedFlash.value = false
  }, 2500)
}

const logout = async () => {
  await clearSession()
  meEmail.value = null
  authMsg.value = 'Đã đăng xuất.'
  await navigateTo('/login')
}
</script>

<template>
  <LayoutPageWrapper class="min-h-screen">
    <LayoutPageSection>
      <div class="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
        <div class="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div class="space-y-2">
            <span class="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 uppercase tracking-wider">
              Application Settings
            </span>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cài Đặt Hệ Thống
            </h1>
            <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              Tùy chỉnh ngôn ngữ ưu tiên, tốc độ phát âm và giao diện.
            </p>
          </div>
        </div>

        <div class="max-w-4xl space-y-8">
          <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:user-round" class="w-5 h-5 text-primary-500" />
              <span>Phiên học viên</span>
            </h3>
            <p class="text-xs text-slate-500">
              Hiện tại:
              <span class="font-extrabold text-slate-800 dark:text-slate-200">
                {{ meEmail || 'Chưa đăng nhập' }}
              </span>
            </p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-if="!isAuthenticated"
                to="/login"
                class="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-extrabold"
              >
                Đăng nhập
              </NuxtLink>
              <NuxtLink
                v-if="!isAuthenticated"
                to="/register"
                class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Đăng ký
              </NuxtLink>
              <button
                v-if="isAuthenticated"
                type="button"
                class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                @click="logout"
              >
                Đăng xuất
              </button>
            </div>
            <p v-if="authMsg" class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ authMsg }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:languages" class="w-5 h-5 text-primary-500" />
              <span>Tùy Chỉnh Học Tập</span>
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">NGÔN NGỮ ƯU TIÊN BAN ĐẦU</label>
                <select
                  v-model="primaryLang"
                  class="w-full md:w-72 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-primary-500"
                >
                  <option value="de">🇩🇪 Tiếng Đức (Deutsch)</option>
                  <option value="cs">🇨🇿 Tiếng Séc (Čeština)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">TỐC ĐỘ PHÁT ÂM (TTS RATE: {{ speechRate }}x)</label>
                <input
                  v-model.number="speechRate"
                  type="range"
                  min="0.5"
                  max="1.2"
                  step="0.05"
                  class="w-full md:w-72 accent-primary-500 cursor-pointer"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">CHỈ TIÊU ÔN SRS / NGÀY</label>
                <input
                  v-model.number="srsTargetPerDay"
                  type="number"
                  min="1"
                  max="200"
                  class="w-full md:w-36 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:volume-2" class="w-5 h-5 text-primary-500" />
              <span>Âm Thanh & Thông Báo</span>
            </h3>

            <div class="space-y-3">
              <label class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Tự động phát âm thanh khi lật thẻ flashcard</span>
                <input v-model="autoPlayAudio" type="checkbox" class="w-4 h-4 accent-primary-500 cursor-pointer" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Bật nhắc nhở học tập hàng ngày</span>
                <input v-model="dailyReminder" type="checkbox" class="w-4 h-4 accent-primary-500 cursor-pointer" />
              </label>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lucide:sun-moon" class="w-5 h-5 text-primary-500" />
              <span>Giao Diện Ứng Dụng</span>
            </h3>

            <div class="flex items-center gap-3">
              <button
                class="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                :class="colorMode.preference === 'light' ? 'bg-primary-500 text-white border-primary-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
                @click="colorMode.preference = 'light'"
              >
                <Icon name="lucide:sun" class="w-4 h-4" />
                <span>Giao Diện Sáng (Light)</span>
              </button>

              <button
                class="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer"
                :class="colorMode.preference === 'dark' ? 'bg-primary-500 text-white border-primary-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
                @click="colorMode.preference = 'dark'"
              >
                <Icon name="lucide:moon" class="w-4 h-4" />
                <span>Giao Diện Tối (Dark)</span>
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              class="px-6 py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              @click="saveSettings"
            >
              <Icon name="lucide:check" class="w-5 h-5" />
              <span>Lưu Cấu Hình</span>
            </button>
            <p v-if="savedFlash" class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Đã lưu.
            </p>
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
