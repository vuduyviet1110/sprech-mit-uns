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
      <div class="transform transition-transform duration-300 animate-pop-in">
        <DotLottieVue
          autoplay
          loop
          style="width: 320px; height: 320px"
          src="https://lottie.host/a262fafe-9ecc-4867-a088-d8df62a6e667/dSkBdI0SVK.lottie"
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
