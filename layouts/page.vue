<template>
  <div class="overflow-x-clip">
    <LayoutPageNavbar class="h-[64px] max-h-[64px]" />
    <LayoutPageContent>
      <slot />
    </LayoutPageContent>
    <LayoutPageFooter />
  </div>
</template>
