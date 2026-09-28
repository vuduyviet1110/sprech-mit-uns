<script lang="ts" setup>
import { useSession } from '~/composables/use-session'

const { isAuthenticated, fetchMe, clearSession } = useSession()
const meEmail = ref<string | null>(null)
const displayName = computed(() => {
  if (!meEmail.value) return 'Khách'
  return meEmail.value.split('@')[0] || 'Học viên'
})

onMounted(async () => {
  try {
    const me = await fetchMe()
    meEmail.value = me.email
  } catch {
    meEmail.value = null
  }
})

const menuItems = computed(() => {
  if (!isAuthenticated.value) {
    return [
      { type: 'link' as const, title: 'Đăng nhập', to: '/login', icon: 'lucide:log-in' },
      { type: 'link' as const, title: 'Đăng ký', to: '/register', icon: 'lucide:user-plus' },
    ]
  }
  return [
    { type: 'link' as const, title: 'Hồ sơ', to: '/profile', icon: 'lucide:user' },
    { type: 'link' as const, title: 'Cài đặt', to: '/setting', icon: 'lucide:settings' },
    { type: 'divider' as const },
    { type: 'action' as const, title: 'Đăng xuất', icon: 'lucide:log-out' },
  ]
})

const signOut = async () => {
  await clearSession()
  meEmail.value = null
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex items-center">
    <HeadlessPopover v-slot="{ open }" class="relative">
      <HeadlessPopoverButton class="flex items-center space-x-2 focus:outline-none">
        <div class="flex items-center">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15 text-xs font-black text-primary-600 dark:text-primary-400"
          >
            {{ displayName.slice(0, 1).toUpperCase() }}
          </div>
          <span class="ml-2 hidden text-sm font-medium text-gray-700 dark:text-gray-300 md:inline">
            {{ displayName }}
          </span>
          <Icon
            name="carbon:chevron-down"
            class="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400"
            :class="[open ? 'transform rotate-180' : '']"
          />
        </div>
      </HeadlessPopoverButton>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <HeadlessPopoverPanel
          class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
        >
          <div class="px-4 py-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ displayName }}
            </p>
            <p class="truncate text-sm text-gray-500 dark:text-gray-400">
              {{ meEmail || 'Chưa đăng nhập' }}
            </p>
          </div>

          <div class="py-1">
            <template v-for="(item, index) in menuItems" :key="index">
              <div
                v-if="item.type === 'divider'"
                class="my-1 border-t border-gray-200 dark:border-gray-700"
              />

              <NuxtLink
                v-else-if="item.type === 'link'"
                :to="item.to"
                class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Icon
                  :name="item.icon || 'lucide:user'"
                  class="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300"
                />
                {{ item.title }}
              </NuxtLink>

              <button
                v-else-if="item.type === 'action'"
                type="button"
                class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="signOut"
              >
                <Icon
                  :name="item.icon || 'lucide:log-out'"
                  class="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300"
                />
                {{ item.title }}
              </button>
            </template>
          </div>
        </HeadlessPopoverPanel>
      </Transition>
    </HeadlessPopover>
  </div>
</template>
