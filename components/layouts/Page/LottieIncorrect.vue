<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
const props = defineProps<{ show: boolean }>()
</script>

<template>
  <Transition name="lottie-pop">
    <div
      v-if="show"
      class="fixed inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs z-50 transition-all duration-300"
    >
      <div class="transform transition-transform duration-300">
        <DotLottieVue
          style="height: 420px; width: 420px"
          autoplay
          src="https://lottie.host/bbd79297-5c21-45b6-945e-38ef4aa8f0a8/xnrmv4xfPk.lottie"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.lottie-pop-enter-active,
.lottie-pop-leave-active {
  transition: opacity 0.3s cubic-bezier(0.2, 0, 0, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lottie-pop-enter-from,
.lottie-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.lottie-pop-enter-to,
.lottie-pop-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
