<script lang="ts" setup>
const user = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'game-icons:balaclava',
}

const menuItems = [
  {
    type: 'link',
    title: 'Profile',
    to: '/profile',
    icon: 'mdi:account',
  },
  {
    type: 'link',
    title: 'Settings',
    to: '/setting',
    icon: 'mdi:cog',
  },
  {
    type: 'divider',
  },
  {
    type: 'link',
    title: 'Sign out',
    to: '/logout',
    icon: 'mdi:logout',
  },
]
</script>

<template>
  <div class="flex items-center">
    <HeadlessPopover v-slot="{ open }" class="relative">
      <HeadlessPopoverButton
        class="flex items-center space-x-2 focus:outline-none"
      >
        <div class="flex items-center">
          <Icon
            :name="user.avatar"
            class="h-8 w-8 text-gray-600 dark:text-gray-400 rounded-full"
          />
          <span
            class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline"
          >
            {{ user.name }}
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
              {{ user.name }}
            </p>
            <p class="truncate text-sm text-gray-500 dark:text-gray-400">
              {{ user.email }}
            </p>
          </div>

          <div class="py-1">
            <template v-for="(item, index) in menuItems" :key="index">
              <div
                v-if="item.type === 'divider'"
                class="border-t border-gray-200 dark:border-gray-700 my-1"
              />

              <NuxtLink
                v-else-if="item.type === 'link'"
                :to="item.to"
                class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Icon
                  :name="item.icon || 'mdi:account'"
                  class="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300"
                />
                {{ item.title }}
              </NuxtLink>
            </template>
          </div>
        </HeadlessPopoverPanel>
      </Transition>
    </HeadlessPopover>
  </div>
</template>
