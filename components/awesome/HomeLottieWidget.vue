<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
</script>

<template>
  <ClientOnly>
    <div class="relative w-9 h-9 flex items-center justify-center shrink-0">
      <!-- DotLottie Player -->
      <DotLottieVue
        style="width: 36px; height: 36px;"
        src="https://lottie.host/a262fafe-9ecc-4867-a088-d8df62a6e667/dSkBdI0SVK.lottie"
        autoplay
        loop
      />
    </div>
  </ClientOnly>
</template>
