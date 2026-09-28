<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => Number(props.error?.statusCode) || 500)

const title = computed(() => {
  switch (statusCode.value) {
    case 404:
      return 'Không tìm thấy trang'
    case 401:
      return 'Cần đăng nhập'
    case 403:
      return 'Không có quyền truy cập'
    default:
      return 'Có lỗi xảy ra'
  }
})

const description = computed(() => {
  switch (statusCode.value) {
    case 404:
      return 'Đường dẫn này không tồn tại hoặc đã được đổi. Quay về lộ trình học hoặc trang chủ nhé.'
    case 401:
      return 'Bạn cần đăng nhập để tiếp tục học.'
    case 403:
      return 'Tài khoản của bạn không được phép mở trang này.'
    default:
      return (
        props.error?.statusMessage ||
        props.error?.message ||
        'Thử tải lại hoặc quay về trang chủ.'
      )
  }
})

useHead({
  title: `${statusCode.value} · ${title.value}`,
})

const goHome = () => clearError({ redirect: '/' })
const goToday = () => clearError({ redirect: '/today' })
const goLogin = () => clearError({ redirect: '/login' })
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,166,118,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(59,166,118,0.08),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(59,166,118,0.16),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(31,107,74,0.2),_transparent_45%)]"
      aria-hidden="true"
    />

    <div class="smu-page relative z-10 w-full max-w-2xl">
      <NuxtLink
        to="/"
        class="mb-6 inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 transition-colors hover:text-primary-600 dark:text-white"
        @click.prevent="goHome"
      >
        Sprech <span class="text-primary-500">Mit Uns</span>
      </NuxtLink>

      <div class="smu-surface p-8 sm:p-10">
        <div
          class="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400"
        >
          <Icon
            :name="statusCode === 404 ? 'lucide:map-pin-off' : 'lucide:circle-alert'"
            class="h-6 w-6"
          />
        </div>

        <p
          class="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400"
        >
          Lỗi {{ statusCode }}
        </p>
        <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {{ title }}
        </h1>
        <p class="mt-3 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {{ description }}
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <button type="button" class="smu-btn" @click="goHome">
            <Icon name="lucide:home" class="h-5 w-5" />
            Về trang chủ
          </button>
          <button
            v-if="statusCode === 401"
            type="button"
            class="smu-btn"
            @click="goLogin"
          >
            <Icon name="lucide:log-in" class="h-5 w-5" />
            Đăng nhập
          </button>
          <button
            v-else
            type="button"
            class="smu-btn-ghost"
            @click="goToday"
          >
            <Icon name="lucide:calendar-check" class="h-5 w-5" />
            Lộ trình hôm nay
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
