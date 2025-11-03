<template>
  <div class="loading-overlay">
    <div class="loading-container">
      <!-- Spinner chính -->
      <div class="spinner">
        <div class="spinner-sector spinner-sector-primary"></div>
        <div class="spinner-sector spinner-sector-background"></div>
      </div>

      <!-- Có thể thêm text loading nếu cần -->
      <p class="loading-text">Đang tải...</p>
    </div>
  </div>
</template>

<script setup>
// Có thể thêm props nếu cần
defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  withText: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.loading-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.loading-container {
  @apply flex flex-col items-center justify-center;
}

.spinner {
  @apply relative;
  width: 3.5rem;
  height: 3.5rem;
}

.spinner-sector {
  @apply absolute rounded-full;
  width: 100%;
  height: 100%;
  border: 0.35rem solid transparent;
  mix-blend-mode: overlay;
  animation: rotate 1.5s ease-in-out infinite;
}

.spinner-sector-primary {
  border-top-color: theme('colors.primary.800');
  animation-delay: 0.1s;
}

.spinner-sector-background {
  border-left-color: theme('colors.primary.600');
}

.loading-text {
  @apply mt-4 text-primary-800 font-medium;
  font-size: 1.1rem;
}

/* Animation */
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spinner.small {
  width: 2rem;
  height: 2rem;
  border-width: 0.2rem;
}

.spinner.large {
  width: 5rem;
  height: 5rem;
  border-width: 0.5rem;
}
</style>
