<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: 'Blank Page' })
</script>
<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="Settings" class="capitalize" />
    </LayoutPageHeader>
    <LayoutPageSection>
      <LayoutPageSectionTitle text="Language Settings" />
      <div class="mb-6">
        <label
          for="language"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Select Language</label
        >
        <select
          id="language"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </div>
    </LayoutPageSection>
    <LayoutPageSection>
      <LayoutPageSectionTitle text="Account Settings" />
      <div class="mb-6">
        <label
          for="username"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Username</label
        >
        <input
          id="username"
          type="text"
          class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 rounded-md"
        />
      </div>
      <div class="mb-6">
        <label
          for="email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Email Address</label
        >
        <input
          id="email"
          type="email"
          class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 rounded-md"
        />
      </div>
    </LayoutPageSection>
    <LayoutPageSection>
      <LayoutPageSectionTitle text="Privacy Settings" />
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input
            id="enableSpamProtection"
            type="checkbox"
            class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded"
          />
        </div>
        <div class="ml-3 text-sm">
          <label
            for="enableSpamProtection"
            class="font-medium text-gray-700 dark:text-gray-300"
            >Enable Spam Protection</label
          >
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
