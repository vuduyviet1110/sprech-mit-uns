<script lang="ts" setup>
import { useLanguage, type LearningLanguage } from '~/composables/use-language'

const { currentLanguage, setLanguage } = useLanguage()

const languages: { key: LearningLanguage; label: string; flag: string }[] = [
  { key: 'de', label: 'Tiếng Đức', flag: '🇩🇪' },
  { key: 'cs', label: 'Tiếng Séc', flag: '🇨🇿' },
]
</script>

<template>
  <div class="flex items-center">
    <HeadlessListbox
      :model-value="currentLanguage"
      as="div"
      class="relative flex items-center"
      @update:model-value="(val) => setLanguage(val as LearningLanguage)"
    >
      <HeadlessListboxLabel class="sr-only">Language</HeadlessListboxLabel>
      <HeadlessListboxButton type="template">
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <span>{{ currentLanguage === 'de' ? '🇩🇪 DE' : '🇨🇿 CS' }}</span>
          <Icon name="carbon:chevron-down" class="w-3.5 h-3.5 text-slate-400" />
        </button>
      </HeadlessListboxButton>
      <HeadlessListboxOptions
        class="p-1 absolute z-50 origin-top-right top-full right-0 outline-none bg-white dark:bg-slate-900 rounded-xl ring-1 ring-slate-900/10 shadow-lg overflow-hidden w-36 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        <HeadlessListboxOption
          v-for="lang in languages"
          :key="lang.key"
          :value="lang.key"
          :class="{
            'py-2 px-3 flex items-center gap-2 cursor-pointer rounded-lg': true,
            'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 font-bold':
              currentLanguage === lang.key,
            'hover:bg-slate-50 dark:hover:bg-slate-800':
              currentLanguage !== lang.key,
          }"
        >
          <span>{{ lang.flag }}</span>
          <span>{{ lang.label }}</span>
        </HeadlessListboxOption>
      </HeadlessListboxOptions>
    </HeadlessListbox>
  </div>
</template>
