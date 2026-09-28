<script lang="ts" setup>
import { useSession } from '~/composables/use-session'

definePageMeta({
  layout: false,
  pageTransition: false,
  layoutTransition: false,
})
useHead({ title: 'Đăng nhập - Sprech Mit Uns' })

const { login, isAuthenticated } = useSession()
const route = useRoute()
const email = ref('')
const password = ref('')
const busy = ref(false)
const errorMsg = ref('')
const shake = ref(false)

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo((route.query.redirect as string) || '/today')
  }
  if (route.query.auth === 'required') {
    errorMsg.value = 'Vui lòng đăng nhập để tiếp tục học.'
  }
})

const showDemoCredentials = computed(() => {
  const v = useRuntimeConfig().public.showDemo
  return v === '1' || v === 1 || v === true
})

const fillDemoAccount = () => {
  email.value = 'demo@sprech.local'
  password.value = 'demo123'
}

const submit = async () => {
  errorMsg.value = ''
  busy.value = true
  try {
    await login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/today'
    await navigateTo(redirect)
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.message || 'Đăng nhập thất bại'
    shake.value = true
    setTimeout(() => {
      shake.value = false
    }, 500)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-layout relative min-h-screen overflow-x-clip">
    <AwesomeAuthShell
      mode="login"
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục lộ trình học của bạn"
      @use-demo="fillDemoAccount"
    >
      <form
        class="space-y-4"
        :class="{ 'auth-form-shake': shake }"
        @submit.prevent="submit"
      >
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Email
        </label>
        <div class="relative">
          <Icon
            name="lucide:mail"
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            data-testid="login-email"
            placeholder="ban@email.com"
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Mật khẩu
        </label>
        <div class="relative">
          <Icon
            name="lucide:lock"
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            data-testid="login-password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      <p v-if="errorMsg" class="text-xs font-bold text-red-500">{{ errorMsg }}</p>

      <button
        type="submit"
        class="btn-sheen w-full rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 disabled:opacity-50 active:scale-95 cursor-pointer"
        data-testid="login-submit"
        data-cursor-text="LOGIN"
        :disabled="busy || !email || !password"
      >
        {{ busy ? 'Đang đăng nhập…' : 'Đăng nhập' }}
      </button>

      <template v-if="showDemoCredentials">
        <div class="relative flex items-center gap-3 py-1">
          <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span class="text-sm font-bold uppercase tracking-wider text-slate-400">hoặc</span>
          <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-extrabold text-slate-700 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 active:scale-95 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
          data-testid="login-demo"
          data-cursor-text="DEMO"
          :disabled="busy"
          @click="fillDemoAccount"
        >
          <Icon name="lucide:key-round" class="h-4 w-4" />
          Dùng tài khoản demo
        </button>
      </template>

      <p class="pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?
        <NuxtLink
          :to="{ path: '/register', query: route.query }"
          class="font-extrabold text-primary-600 hover:underline dark:text-primary-400"
          data-cursor-text="SIGN UP"
        >
          Đăng ký ngay
        </NuxtLink>
      </p>
      </form>
    </AwesomeAuthShell>
  </div>
</template>

<style scoped>
.auth-form-shake {
  animation: form-shake 0.45s ease;
}
@keyframes form-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}
.btn-sheen {
  position: relative;
  overflow: hidden;
}
.btn-sheen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 60%
  );
  transform: translateX(-120%) skewX(-12deg);
  transition: transform 0.55s ease;
}
.btn-sheen:hover::after {
  transform: translateX(120%) skewX(-12deg);
}
</style>
