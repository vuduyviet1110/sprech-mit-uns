<script lang="ts" setup>
import { useLanguage } from '~/composables/use-language'

const { awesome } = useAppConfig()
const { parseMenuRoute, parseMenuTitle } = useNavbarParser()
const srsStore = useSrsStore()
const route = useRoute()
const { currentLanguage } = useLanguage()

const showDrawer = ref(false)
const menus = computed(
  () =>
    (awesome?.layout?.page?.navbar?.menus ||
      []) as AwesomeLayoutPageNavbarMenu[],
)

onMounted(() => {
  srsStore.fetchDueCount(currentLanguage.value)
})

watch([() => route.path, () => currentLanguage.value], () => {
  srsStore.fetchDueCount(currentLanguage.value)
})
</script>


<template>
  <header
    class="fixed top-0 w-full z-40 h-14 border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur"
  >
    <div class="w-full h-full flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-5 lg:gap-7 min-w-0">
        <NuxtLink to="/" class="shrink-0 text-primary-600 font-bold text-base tracking-tight">
          {{ awesome.name }}
        </NuxtLink>

        <div class="hidden md:flex items-center gap-3 text-sm">
          <LayoutPageNavbarMenuWrapper
            v-for="(item, i) in menus"
            :key="i"
            :menu="item"
          />
        </div>
      </div>

      <div class="hidden md:flex items-center gap-2.5 text-xl shrink-0">
        <LayoutPageNavbarDropdownLanguageSwitcher />
        <LayoutPageNavbarDropdownCursorToggle />
        <LayoutPageNavbarDropdownThemeSwitcher />
        <LayoutPageNavbarDropdownUser />
      </div>

      <div class="flex md:hidden items-center gap-3 text-xl">
        <AwesomeLink
          class="text-gray-600 dark:text-gray-400"
          @click.prevent="showDrawer = !showDrawer"
        >
          <Icon name="lucide:menu" />
        </AwesomeLink>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <AwesomeActionSheet
      v-if="showDrawer"
      class="md:hidden"
      @close="showDrawer = false"
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

    </AwesomeActionSheet>
  </header>
</template>
