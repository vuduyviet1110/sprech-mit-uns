<script lang="ts" setup>
import { useSession } from '~/composables/use-session'

definePageMeta({
  layout: false,
  pageTransition: false,
  layoutTransition: false,
})
useHead({ title: 'Đăng ký - Sprech Mit Uns' })

const { register, isAuthenticated } = useSession()
const route = useRoute()
const email = ref('')
const password = ref('')
const confirm = ref('')
const busy = ref(false)
const errorMsg = ref('')
const shake = ref(false)

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo((route.query.redirect as string) || '/today')
  }
})

const submit = async () => {
  errorMsg.value = ''
  if (password.value.length < 6) {
    errorMsg.value = 'Mật khẩu tối thiểu 6 ký tự'
    shake.value = true
    setTimeout(() => {
      shake.value = false
    }, 500)
    return
  }
  if (password.value !== confirm.value) {
    errorMsg.value = 'Mật khẩu xác nhận không khớp'
    shake.value = true
    setTimeout(() => {
      shake.value = false
    }, 500)
    return
  }
  busy.value = true
  try {
    await register(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/today'
    await navigateTo(redirect)
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.message || 'Đăng ký thất bại'
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
      mode="register"
      title="Tạo tài khoản học viên"
      subtitle="Bắt đầu lộ trình A1–B1 tiếng Đức & tiếng Séc"
    >
      <form
        class="space-y-4"
        :class="{ 'auth-form-shake': shake }"
        @submit.prevent="submit"
      >
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold uppercase tracking-wider text-slate-500">
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
            placeholder="ban@email.com"
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold uppercase tracking-wider text-slate-500">
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
            autocomplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Xác nhận mật khẩu
        </label>
        <div class="relative">
          <Icon
            name="lucide:shield-check"
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="confirm"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Nhập lại mật khẩu"
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      <p v-if="errorMsg" class="text-xs font-bold text-red-500">{{ errorMsg }}</p>

      <button
        type="submit"
        class="btn-sheen w-full rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 disabled:opacity-50"
        data-cursor-text="JOIN"
        :disabled="busy || !email || !password || !confirm"
      >
        {{ busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản' }}
      </button>

      <p class="pt-2 text-center text-xs text-slate-500">
        Đã có tài khoản?
        <NuxtLink
          :to="{ path: '/login', query: route.query }"
          class="font-extrabold text-primary-600 hover:underline dark:text-primary-400"
          data-cursor-text="LOGIN"
        >
          Đăng nhập
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
