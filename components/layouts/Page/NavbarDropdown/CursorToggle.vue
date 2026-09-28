<script lang="ts" setup>
const { isEnabled, toggle } = useCustomCursor()
</script>

<template>
  <button
    type="button"
    class="hidden md:inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
    :aria-pressed="isEnabled"
    :aria-label="isEnabled ? 'Tắt cursor trail' : 'Bật cursor trail'"
    :title="isEnabled ? 'Tắt cursor trail' : 'Bật cursor trail'"
    @click="toggle"
  >
    <Icon
      :name="isEnabled ? 'lucide:sparkles' : 'lucide:mouse-pointer-2'"
      class="w-5 h-5"
      :class="isEnabled ? 'text-primary-500' : ''"
    />
  </button>
</template>
