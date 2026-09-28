<script lang="ts" setup>
const { awesome } = useAppConfig()
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="border-t border-slate-200 bg-white px-4 py-12 text-slate-800 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
  >
    <div class="smu-page w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <div class="mb-4 flex items-center space-x-2">
            <Icon
              name="lucide:book-open"
              class="h-6 w-6 text-primary-600 dark:text-primary-400"
            />
            <span class="text-xl font-bold text-slate-900 dark:text-white">{{
              awesome?.name
            }}</span>
          </div>
          <p class="text-base text-slate-600 dark:text-slate-400">
            {{ awesome?.description || 'Học tiếng Đức & tiếng Séc với lộ trình hàng ngày.' }}
          </p>
        </div>

        <div>
          <h4 class="mb-4 font-semibold text-slate-800 dark:text-white">
            Học tập
          </h4>
          <ul class="space-y-2 text-base text-slate-600 dark:text-slate-400">
            <li>
              <NuxtLink to="/today" class="hover:text-primary-600 transition-colors">Hôm nay</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/dictionary" class="hover:text-primary-600 transition-colors">Từ điển</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/review" class="hover:text-primary-600 transition-colors">Ôn SRS</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/about" class="hover:text-primary-600 transition-colors">Giới thiệu</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-4 font-semibold text-slate-800 dark:text-white">
            Công cụ
          </h4>
          <ul class="space-y-2 text-base text-slate-600 dark:text-slate-400">
            <li>
              <NuxtLink to="/lesson" class="hover:text-primary-600 transition-colors">Bài học</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/vocabulary" class="hover:text-primary-600 transition-colors">Sổ từ</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/progress" class="hover:text-primary-600 transition-colors">Tiến độ</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/setting" class="hover:text-primary-600 transition-colors">Cài đặt</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-4 font-semibold text-slate-800 dark:text-white">
            Pháp lý
          </h4>
          <ul class="space-y-2 text-base text-slate-600 dark:text-slate-400">
            <li>
              <NuxtLink to="/privacy" class="hover:text-primary-600 transition-colors">
                Quyền riêng tư
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/terms" class="hover:text-primary-600 transition-colors">
                Điều khoản
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"
      >
        <p>&copy; {{ year }} {{ awesome?.name }}. Học vui, học đều.</p>
      </div>
    </div>
  </footer>
</template>
