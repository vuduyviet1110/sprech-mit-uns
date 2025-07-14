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
      style="height: 500px; width: 500px"
      autoplay
      src="https://lottie.host/bbd79297-5c21-45b6-945e-38ef4aa8f0a8/xnrmv4xfPk.lottie"
    />
  </div>
</template>
