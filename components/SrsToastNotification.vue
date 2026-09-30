<script setup lang="ts">
import { useSrsStore } from '~/stores/useSrsStore'

const srsStore = useSrsStore()
</script>

<template>
  <div
    v-if="srsStore.toastMessage"
    class="fixed bottom-32 sm:bottom-8 right-8 z-[999999] flex items-center gap-3.5 px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500/50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white font-bold text-sm transition-all"
    style="box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.4);"
  >
    <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
      <Icon name="carbon:checkmark-outline" class="w-6 h-6 text-white" />
    </div>
    <div class="flex flex-col pr-3">
      <span class="text-base text-emerald-400 font-extrabold">{{ srsStore.toastMessage }}</span>
      <span class="text-xs font-semibold text-slate-300">Đã cập nhật danh sách ôn tập SRS</span>
    </div>
    <button
      @click="srsStore.clearToast()"
      class="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
    >
      <Icon name="carbon:close" class="w-5 h-5" />
    </button>
  </div>
</template>

