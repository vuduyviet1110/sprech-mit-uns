<script lang="ts" setup>
import { ref } from 'vue'
const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
const showDemo = ref(false)
useHead({ titleTemplate: '', title: awesome?.name || 'Nuxt 3 Awesome Starter' })
</script>

<!-- Đây sẽ là trang chính -->
<template>
  <div class="flex flex-col mx-auto text-center">
    <AwesomeWelcome :with-alert="true" />
    <div>
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Button
          size="lg"
          class="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
          @click="showDemo = !showDemo"
        >
          <Play class="mr-2 h-5 w-5" />
          Try Demo Lesson
        </Button>
        <Button
          size="lg"
          variant="outline"
          class="border-blue-600 text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
        >
          View Features
        </Button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">500+</div>
          <div class="text-gray-600">Lessons</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-indigo-600">2000+</div>
          <div class="text-gray-600">Vocabulary</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600">4</div>
          <div class="text-gray-600">Levels</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">∞</div>
          <div class="text-gray-600">Practice</div>
        </div>
      </div>
    </div>
    <section v-if="showDemo" class="py-16 px-4">
      <LayoutPageSectionLessonPreview text="Demo Lesson" />
    </section>
    <section class="py-16 px-4">
      <LayoutPageSectionFeatureShowCase />
    </section>
  </div>
</template>
