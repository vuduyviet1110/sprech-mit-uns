<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import ArenaQuestionPanel from '~/components/awesome/quiz/ArenaQuestionPanel.vue'

const emit = defineEmits(['back'])
const route = useRoute()

const activeTab = ref<'create' | 'join'>('create')
const createdPin = ref<string | null>(null)
const nicknameInput = ref('')
const pinInput = ref('')
const joinedPin = ref<string | null>(null)
const joinedPlayer = ref<any | null>(null)
const playersList = ref<any[]>([])
const errorMessage = ref('')
const isSubmitting = ref(false)
const pollTimer = ref<any>(null)
const copied = ref(false)

// Realtime Game States
const roomPhase = ref<'lobby' | 'playing' | 'gameover'>('lobby')
const questions = ref<any[]>([])
const currentIdx = ref(0)
const hasAnswered = ref(false)
const panelKey = ref(0)

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)

onMounted(() => {
  if (route.query.pin) {
    activeTab.value = 'join'
    pinInput.value = (route.query.pin as string).trim()
  }
})

const roomErrorMessage = (err: any, fallback: string) =>
  err?.data?.message || err?.data?.statusMessage || err?.statusMessage || err?.message || fallback

const copyInviteLink = () => {
  const pin = createdPin.value || joinedPin.value || pinInput.value
  if (!pin) return
  const url = `${window.location.origin}${window.location.pathname}?pin=${pin}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const handleCreateRoom = async () => {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    const resp = await $fetch<any>('/api/room/create', {
      method: 'POST',
      body: { gameMode: 'speed_60s', language: 'de' },
    })

    if (resp && resp.success) {
      createdPin.value = resp.pin
      if (resp.hostPlayer) {
        joinedPlayer.value = resp.hostPlayer
      }
      playersList.value = resp.players || []
      startPolling(resp.pin)
    } else {
      errorMessage.value = 'Không thể tạo phòng lúc này'
    }
  } catch (err: any) {
    errorMessage.value = roomErrorMessage(err, 'Lỗi hệ thống')
  } finally {
    isSubmitting.value = false
  }
}

const handleJoinRoom = async () => {
  if (!pinInput.value || !nicknameInput.value) {
    errorMessage.value = 'Vui lòng nhập đủ Mã PIN và Biệt danh'
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    const resp = await $fetch<any>('/api/room/join', {
      method: 'POST',
      body: {
        pin: pinInput.value.trim(),
        nickname: nicknameInput.value.trim(),
      },
    })

    if (resp && resp.success) {
      joinedPin.value = resp.pin
      joinedPlayer.value = resp.player
      playersList.value = resp.players || []
      startPolling(resp.pin)
    } else {
      errorMessage.value = resp.error || 'Tham gia thất bại'
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Lỗi kết nối'
  } finally {
    isSubmitting.value = false
  }
}

const handleStartGame = async () => {
  const pin = createdPin.value || joinedPin.value
  if (!pin) return

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    const resp = await $fetch<any>('/api/room/start', {
      method: 'POST',
      body: { pin },
    })

    if (resp && resp.success) {
      roomPhase.value = 'playing'
      questions.value = resp.questions || []
      currentIdx.value = 0
      hasAnswered.value = false
      panelKey.value++
    } else {
      errorMessage.value = resp.error || 'Không thể bắt đầu phòng'
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Lỗi hệ thống'
  } finally {
    isSubmitting.value = false
  }
}

const onAnswered = async (payload: { isCorrect: boolean }) => {
  if (hasAnswered.value || !currentQuestion.value) return
  hasAnswered.value = true

  const points = payload.isCorrect ? 100 : 0
  const pin = createdPin.value || joinedPin.value
  const playerId = joinedPlayer.value?.id

  if (pin && playerId && points > 0) {
    try {
      await $fetch('/api/room/score', {
        method: 'POST',
        body: { pin, playerId, points },
      })
    } catch (e) {
      console.error(e)
    }
  }
}

const nextQuestion = async () => {
  if (currentIdx.value < questions.value.length - 1) {
    currentIdx.value++
    hasAnswered.value = false
    panelKey.value++
  } else {
    const pin = createdPin.value || joinedPin.value
    if (pin) {
      try {
        await $fetch('/api/room/end', {
          method: 'POST',
          body: { pin },
        })
      } catch (e) {
        console.error(e)
      }
    }
    roomPhase.value = 'gameover'
  }
}

const startPolling = (pin: string) => {
  if (pollTimer.value) clearInterval(pollTimer.value)
  pollTimer.value = setInterval(async () => {
    try {
      const resp = await $fetch<any>(`/api/room/status?pin=${pin}`)
      if (resp && resp.success) {
        playersList.value = resp.players || []
        if (resp.phase && resp.phase !== roomPhase.value) {
          roomPhase.value = resp.phase
          if (resp.phase === 'playing' && resp.questions && resp.questions.length) {
            questions.value = resp.questions
            currentIdx.value = 0
            hasAnswered.value = false
            panelKey.value++
          }
        }
      }
    } catch {
      // ignore
    }
  }, 2000)
}

onUnmounted(() => {
  if (pollTimer.value) clearInterval(pollTimer.value)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span>Trở về danh mục</span>
      </button>

      <span class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-primary-500 font-extrabold text-xs rounded-lg flex items-center gap-1.5">
        <Icon name="lucide:users" class="w-4 h-4" />
        <span>Phòng Học Nhóm Realtime</span>
      </span>
    </div>

    <!-- 1. LOBBY STATE (Host or Joined Player waiting in Lobby) -->
    <div v-if="(createdPin || joinedPin) && roomPhase === 'lobby'" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 max-w-xl mx-auto text-center">
      <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider">
        {{ createdPin ? 'Phòng Của Bạn (Host)' : 'Đã Tham Gia Phòng' }}
      </span>

      <!-- PIN Code Display Box -->
      <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Mã PIN Tham Gia</span>
        <div class="text-4xl md:text-5xl font-mono font-black text-primary-500 tracking-widest">
          {{ createdPin || joinedPin }}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">Gửi mã 6 số này hoặc link tham gia cho bạn bè/học viên!</p>

        <div class="pt-2">
          <button
            @click="copyInviteLink"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
          >
            <Icon :name="copied ? 'lucide:check' : 'lucide:link-2'" class="w-4 h-4" />
            <span>{{ copied ? 'Đã sao chép link mời!' : '📋 Sao Chép Link Tham Gia Phòng' }}</span>
          </button>
        </div>
      </div>

      <!-- Host Action: START GAME BUTTON -->
      <div v-if="createdPin" class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          @click="handleStartGame"
          :disabled="isSubmitting"
          class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-base rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <Icon name="lucide:play-circle" class="w-6 h-6" />
          <span>🚀 BẮT ĐẦU TRẬN ĐẤU NGAY</span>
        </button>
        <p class="text-xs text-slate-400 font-medium">Bấm bắt đầu khi tất cả người chơi đã vào phòng!</p>
      </div>

      <div v-else class="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
        <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
        <span>Đang chờ Host nhấn Bắt đầu trận đấu...</span>
      </div>

      <!-- Player Roster List -->
      <div class="space-y-3 text-left">
        <div class="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
          <span>Danh Sách Người Chơi Trong Phòng</span>
          <span class="text-primary-500 font-extrabold">{{ playersList.length }} Người</span>
        </div>

        <div v-if="playersList.length" class="space-y-2">
          <div
            v-for="(p, i) in playersList"
            :key="p.id"
            class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold text-sm"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 text-center text-xs font-bold text-slate-400">#{{ i + 1 }}</span>
              <span class="text-slate-900 dark:text-white">{{ p.nickname }}</span>
              <span v-if="joinedPlayer && joinedPlayer.id === p.id" class="px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-950 text-[10px] font-bold rounded">
                BẠN
              </span>
            </div>
            <span class="text-xs font-extrabold text-amber-500">{{ p.score }} Pts</span>
          </div>
        </div>

        <div v-else class="text-center py-6 text-slate-400 text-xs font-semibold italic">
          Đang chờ người chơi khác nhập PIN để tham gia...
        </div>
      </div>
    </div>

    <!-- 2. PLAYING STATE (Interactive Multiplayer Quiz) -->
    <div v-else-if="(createdPin || joinedPin) && roomPhase === 'playing'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
      <!-- Main Question Panel (8 Cols) -->
      <div class="lg:col-span-8 space-y-6">
        <div v-if="currentQuestion" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-950 text-xs font-extrabold rounded-lg">
              Câu {{ currentIdx + 1 }} / {{ questions.length }}
            </span>
            <span class="text-xs font-bold text-slate-400">PIN: {{ createdPin || joinedPin }}</span>
          </div>

          <ArenaQuestionPanel
            :key="`${currentQuestion.id}-${panelKey}`"
            :question="currentQuestion"
            auto-submit-mc
            @answered="onAnswered"
          />

          <div class="pt-4 flex justify-end">
            <button
              @click="nextQuestion"
              :disabled="!hasAnswered"
              class="px-6 py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{{ currentIdx < questions.length - 1 ? 'Câu Tiếp Theo' : 'Xem Kết Quả Trận Đấu' }}</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Live Roster & Scores (4 Cols) -->
      <div class="lg:col-span-4 space-y-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Icon name="lucide:trophy" class="w-4 h-4 text-amber-500" />
              <span>Bảng Xếp Hạng Live</span>
            </h4>
          </div>

          <div class="space-y-2">
            <div
              v-for="(p, i) in playersList"
              :key="p.id"
              class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-bold"
            >
              <div class="flex items-center gap-2">
                <span class="w-4 text-center font-black" :class="i === 0 ? 'text-amber-500' : 'text-slate-400'">#{{ i + 1 }}</span>
                <span class="text-slate-900 dark:text-white">{{ p.nickname }}</span>
              </div>
              <span class="font-extrabold text-amber-500">{{ p.score }} Pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. GAMEOVER STATE (Final Results & Trophy Screen) -->
    <div v-else-if="(createdPin || joinedPin) && roomPhase === 'gameover'" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 max-w-xl mx-auto text-center">
      <div class="w-20 h-20 bg-amber-50 dark:bg-amber-950/80 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <Icon name="lucide:trophy" class="w-10 h-10" />
      </div>

      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">KẾT THÚC TRẬN ĐẤU!</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Chúc mừng tất cả người chơi đã hoàn thành xuất sắc bài thi nhóm.</p>
      </div>

      <div class="space-y-3 text-left">
        <h4 class="text-xs font-black uppercase text-slate-400 tracking-wider text-center">Vinh Danh Nhà Vô Địch</h4>
        <div
          v-for="(p, i) in playersList"
          :key="p.id"
          class="flex items-center justify-between p-4 rounded-xl font-bold text-sm"
          :class="[
            i === 0 ? 'bg-amber-500/10 border-2 border-amber-500/50 text-amber-700 dark:text-amber-300' : 'bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800'
          ]"
        >
          <div class="flex items-center gap-3">
            <span class="text-lg">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}` }}</span>
            <span class="text-slate-900 dark:text-white font-extrabold">{{ p.nickname }}</span>
          </div>
          <span class="font-black text-amber-500">{{ p.score }} Pts</span>
        </div>
      </div>

      <div class="pt-4">
        <button
          @click="emit('back')"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          Trở Về Danh Mục Game
        </button>
      </div>
    </div>

    <!-- 4. MODE SELECTOR TABS (Create vs Join when not in room) -->
    <div v-else class="max-w-md mx-auto space-y-6">
      <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          @click="activeTab = 'create'"
          class="flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer"
          :class="activeTab === 'create' ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-xs' : 'text-slate-500'"
        >
          ➕ Tạo Phòng Mới
        </button>
        <button
          @click="activeTab = 'join'"
          class="flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer"
          :class="activeTab === 'join' ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-xs' : 'text-slate-500'"
        >
          🔑 Nhập PIN Tham Gia
        </button>
      </div>

      <!-- Tab 1: Create Room -->
      <div v-if="activeTab === 'create'" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-5">
        <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 text-primary-500 rounded-xl flex items-center justify-center mx-auto">
          <Icon name="lucide:plus-circle" class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Mở Phòng Đấu Từ Vựng</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tạo phòng học nhóm công khai, nhận mã PIN 6 số để trình chiếu lên màn hình lớp học.
          </p>
        </div>

        <p v-if="errorMessage" class="text-sm font-bold text-red-500">
          {{ errorMessage }}
        </p>

        <button
          @click="handleCreateRoom"
          :disabled="isSubmitting"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
        >
          {{ isSubmitting ? 'Đang tạo phòng...' : 'Tạo Phòng Nhận PIN' }}
        </button>
      </div>

      <!-- Tab 2: Join Room -->
      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div class="text-center space-y-1">
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Nhập Mã PIN Học Nhóm</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Nhập mã PIN 6 số do Host cung cấp cùng biệt danh để vào phòng chơi.
          </p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">MÃ PIN 6 SỐ</label>
            <input
              v-model="pinInput"
              type="text"
              maxlength="6"
              placeholder="VD: 839120"
              class="w-full text-center font-mono font-black text-2xl tracking-widest p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">BIỆT DANH HỌC VIÊN</label>
            <input
              v-model="nicknameInput"
              type="text"
              placeholder="VD: Minhmam"
              class="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <p v-if="errorMessage" class="text-xs font-bold text-red-500 text-center">
            {{ errorMessage }}
          </p>

          <button
            @click="handleJoinRoom"
            :disabled="isSubmitting"
            class="w-full py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            Vào Phòng Ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
