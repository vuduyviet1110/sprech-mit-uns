<script lang="ts" setup>
import { useSrsStore } from '~/stores/useSrsStore'

const nuxtApp = useNuxtApp()
const { parseMenuRoute, parseMenuTitle } = useNavbarParser()

const srsStore = useSrsStore()

const props = defineProps({
  menu: {
    type: Object as () =>
      | AwesomeLayoutPageNavbarMenu
      | AwesomeLayoutPageNavbarMenuDropdownItem,
    required: true,
  },
  isDropdown: {
    type: Boolean,
    default: true,
  },
})

const isReviewLink = computed(() => {
  const routeStr = parseMenuRoute(props.menu?.to)
  return routeStr === '/review'
})
</script>

<template>
  <template v-if="menu?.type === 'link' && isDropdown">
    <NuxtLink :to="parseMenuRoute(menu?.to)" #="{ isActive }">
      <div
        :class="[
          'transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-lg w-full flex items-center justify-between',
          isActive
            ? 'text-gray-900 dark:text-gray-100 font-bold'
            : 'text-gray-700 dark:text-gray-300',
        ]"
      >
        <span>{{ parseMenuTitle(menu?.title) }}</span>
        <span
          v-if="isReviewLink && Number(srsStore.dueCount) > 0"
          class="ml-2 px-2 py-0.5 text-xs font-black text-white bg-red-500 rounded-full animate-pulse shadow-sm"
        >
          {{ srsStore.dueCount }}
        </span>
      </div>
    </NuxtLink>
  </template>
  <template v-else-if="menu?.type === 'link'">
    <NuxtLink :to="parseMenuRoute(menu?.to)" #="{ isActive }">
      <span
        :class="{
          'text-gray-900 dark:text-gray-100 font-bold': isActive,
          'text-gray-700 dark:text-gray-300': !isActive,
        }"
        class="inline-flex items-center gap-1.5"
      >
        <span>{{ parseMenuTitle(menu?.title) }}</span>
        <span
          v-if="isReviewLink && Number(srsStore.dueCount) > 0"
          class="px-2 py-0.5 text-xs font-black text-white bg-red-500 rounded-full animate-pulse shadow-xs"
        >
          {{ srsStore.dueCount }}
        </span>
      </span>
    </NuxtLink>
  </template>
</template>



