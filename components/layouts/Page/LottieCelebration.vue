<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
const props = defineProps<{ show: boolean }>()
</script>

<template>
  <div
    v-show="show"
    class="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
  >
    <DotLottieVue
      autoplay
      loop
      style="width: 300px; height: 300px"
      src="https://lottie.host/a262fafe-9ecc-4867-a088-d8df62a6e667/dSkBdI0SVK.lottie"
    />
  </div>
</template>
