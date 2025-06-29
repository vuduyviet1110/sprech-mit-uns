<script lang="ts" setup>
const { awesome } = useAppConfig()
const { parseMenuRoute, parseMenuTitle } = useNavbarParser()

const showDrawer = ref(false)
const menus = computed(
  () =>
    (awesome?.layout?.page?.navbar?.menus ||
      []) as AwesomeLayoutPageNavbarMenu[],
)
</script>

<template>
  <header
    class="fixed top-0 w-full z-40 border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur"
  >
    <div
      class="max-w-screen-2xl mx-auto flex items-center justify-between px-4 py-4"
    >
      <NuxtLink to="/" class="text-primary-600 font-bold text-lg capitalize">
        {{ awesome.name }}
      </NuxtLink>

      <div class="hidden md:flex items-center gap-6">
        <div class="flex items-center gap-4 text-sm">
          <LayoutPageNavbarMenuWrapper
            v-for="(item, i) in menus"
            :key="i"
            :menu="item"
          />
        </div>

        <div class="flex items-center gap-3 text-xl pl-4">
          <AwesomeLink class="text-gray-500 hover:text-gray-800">
            <Icon name="la:language" />
          </AwesomeLink>
          <LayoutPageNavbarDropdownThemeSwitcher />
          <AwesomeLink
            v-if="awesome?.project?.links?.github"
            class="text-gray-600 dark:text-gray-400"
            :href="awesome.project.links.github"
          >
            <Icon name="mdi:github-face" />
          </AwesomeLink>
        </div>
      </div>

      <div class="flex md:hidden items-center gap-3 text-xl">
        <AwesomeLink
          class="text-gray-600 dark:text-gray-400"
          @click.prevent="showDrawer = !showDrawer"
        >
          <Icon name="heroicons:bars-3-bottom-right-20-solid" />
        </AwesomeLink>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <AwesomeActionSheet
      v-if="showDrawer"
      @close="showDrawer = false"
      class="md:hidden"
    >
      <AwesomeActionSheetGroup>
        <AwesomeActionSheetHeader>
          <AwesomeActionSheetHeaderTitle text="Menu" />
        </AwesomeActionSheetHeader>
        <AwesomeActionSheetItem>
          <div
            class="flex flex-col text-center text-sm divide-y divide-gray-300 dark:divide-gray-700"
          >
            <template v-for="(item, i) in menus" :key="i">
              <template v-if="item?.type === 'link'">
                <NuxtLink
                  :to="parseMenuRoute(item.to)"
                  class="py-2 w-full block"
                >
                  <span class="text-gray-800 dark:text-gray-100">
                    {{ parseMenuTitle(item.title) }}
                  </span>
                </NuxtLink>
              </template>

              <template v-if="item?.type === 'button'">
                <AwesomeButton
                  :text="parseMenuTitle(item.title)"
                  size="sm"
                  class="w-full"
                />
              </template>

              <template v-if="item?.type === 'dropdown'">
                <HeadlessDisclosure>
                  <template #default="{ open }">
                    <HeadlessDisclosureButton
                      class="w-full py-2 flex justify-center items-center"
                    >
                      {{ parseMenuTitle(item.title) }}
                      <Icon
                        name="carbon:chevron-right"
                        class="ml-1"
                        :class="{ 'rotate-90': open }"
                      />
                    </HeadlessDisclosureButton>
                    <HeadlessDisclosurePanel>
                      <NuxtLink
                        v-for="(child, j) in item.children"
                        :key="j"
                        :to="parseMenuRoute(child.to)"
                        class="py-2 block"
                      >
                        <span class="text-gray-600 dark:text-gray-300">
                          {{ parseMenuTitle(child.title) }}
                        </span>
                      </NuxtLink>
                    </HeadlessDisclosurePanel>
                  </template>
                </HeadlessDisclosure>
              </template>
            </template>
          </div>
        </AwesomeActionSheetItem>

        <AwesomeActionSheetItem>
          <div class="text-sm font-semibold my-2">Change Theme</div>
          <LayoutPageNavbarDropdownThemeSwitcher type="select-box" />
        </AwesomeActionSheetItem>
      </AwesomeActionSheetGroup>

      <AwesomeActionSheetGroup>
        <AwesomeActionSheetItemButton
          class="flex justify-center items-center gap-2 text-sm"
        >
          <Icon name="mdi:github-face" />
          <span>Github</span>
        </AwesomeActionSheetItemButton>
      </AwesomeActionSheetGroup>
    </AwesomeActionSheet>
  </header>
</template>
