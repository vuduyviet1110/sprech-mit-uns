<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="flex flex-col items-center">
        <Icon
          name="svg-spinners:180-ring-with-bg"
          class="h-12 w-12 text-white"
        />
        <p class="text-white mt-2">Đang tải...</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '~/stores/loading'

const { visible } = useLoadingStore()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
