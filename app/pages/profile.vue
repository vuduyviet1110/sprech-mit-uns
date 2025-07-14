<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: 'Profile' })
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="Profile" class="capitalize" />
    </LayoutPageHeader>
    <LayoutPageSection>
      <LayoutPageSectionTitle text="Section Title" />
      <div>My Profile</div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
