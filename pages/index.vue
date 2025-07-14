<script lang="ts" setup>
import { ref } from 'vue'
const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
const currentTab = ref<'demo' | 'feature'>()
useHead({ titleTemplate: '', title: awesome?.name || 'Nuxt 3 Awesome Starter' })
</script>

<template>
  <div class="flex flex-col mx-auto text-center">
    <AwesomeWelcome :with-alert="true" />
    <div>
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Button
          size="lg"
          class="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4"
          @click="currentTab = 'demo'"
        >
          <Icon name="mdi:play" class="h-5 w-5 inline-block" />
          Try Demo Lesson
        </Button>
        <Button
          size="lg"
          variant="outline"
          class="border-blue-600 text-blue-600 border border-opacity-50 text-lg px-8 py-4"
          @click="currentTab = 'feature'"
        >
          <Icon
            name="fluent-emoji-high-contrast:hand-with-index-finger-and-thumb-crossed"
            class="h-5 w-5 inline-block"
          />
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
    <Transition name="tab-fade" mode="out-in">
      <section v-if="currentTab === 'demo'" key="demo" class="py-16 px-4">
        <LayoutPageSectionLessonPreview text="Demo Lesson" />
      </section>

      <section
        v-else-if="currentTab === 'feature'"
        key="feature"
        class="py-16 px-4"
      >
        <LayoutPageSectionFillInTheBlank />
      </section>
    </Transition>
    <section class="py-16 px-4">
      <LayoutPageSectionFeatureShowCase />
    </section>
  </div>
</template>

<style scoped>
.tab-fade-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.95) scaleY(0.95);
}
.tab-fade-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1) scaleY(1);
}
.tab-fade-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1) scaleY(1);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateX(-100px) scale(0.95);
}
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.5s ease-in-out;
}
</style>
