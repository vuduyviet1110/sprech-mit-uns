<script lang="ts" setup>
const { awesome } = useAppConfig()

defineProps({
  withAlert: {
    type: Boolean,
    default: true,
  },
})

const titlesText = computed<string[]>(() =>
  (awesome?.layout?.welcome?.title || awesome?.name || 'Sprech Mit Uns')
    .replaceAll('&nbsp;', ' ')
    .split(' '),
)

/** Brand-aligned gradients: primary green + accent blue (project tokens) */
const leadingsText = computed(() => [
  {
    text: titlesText.value[0],
    startColor: '#3BA676',
    endColor: '#0096FF',
    delay: 0,
  },
  {
    text: titlesText.value[1],
    startColor: '#2C7D59',
    endColor: '#69CA9E',
    delay: 2,
  },
  {
    text: titlesText.value[2],
    startColor: '#0096FF',
    endColor: '#3BA676',
    delay: 4,
  },
])
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <h1
      class="landing-enter text-center flex flex-row items-center justify-center flex-wrap gap-2 sm:gap-5"
      style="--landing-enter-y: 32px"
    >
      <span
        v-for="(item, i) in leadingsText"
        :key="i"
        :style="`--content: '${item.text}'; --start-color: ${
          item.startColor
        }; --end-color: ${item.endColor}; --animation-name: anim-fg-${
          i + 1
        }`"
        class="animated-text-bg text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight"
      >
        <span class="animated-text-fg">{{ item.text }}</span>
      </span>
    </h1>
    <p
      class="landing-enter mt-5 text-center max-w-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-base md:text-lg"
      style="--landing-enter-y: 16px; animation-delay: 120ms"
    >
      {{
        awesome?.description ||
        'Nền tảng học tiếng Đức & tiếng Séc chủ động với flashcard, SRS và luyện phản xạ.'
      }}
    </p>
  </div>
</template>

<style lang="scss">
:root {
  --padding: 0.05em;
}

@keyframes anim-fg-1 {
  0%,
  16.667%,
  100% {
    opacity: 1;
  }
  33.333%,
  83.333% {
    opacity: 0;
  }
}
@keyframes anim-fg-2 {
  0%,
  16.667%,
  66.667%,
  100% {
    opacity: 0;
  }
  33.333%,
  50% {
    opacity: 1;
  }
}
@keyframes anim-fg-3 {
  0%,
  50%,
  100% {
    opacity: 0;
  }
  66.667%,
  83.333% {
    opacity: 1;
  }
}
.animated-text-bg {
  position: relative;
  display: inline-block;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  content: var(--content);
  color: theme('colors.slate.800');
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  padding-left: var(--padding);
  padding-right: var(--padding);
  &:before {
    content: var(--content);
    position: absolute;
    display: inline-block;
    width: 100%;
    color: theme('colors.slate.800');
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 0;
    padding-left: var(--padding);
    padding-right: var(--padding);
  }
}
.animated-text-fg {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding-left: var(--padding);
  padding-right: var(--padding);
  background-image: linear-gradient(
    90deg,
    var(--start-color),
    var(--end-color)
  );
  position: relative;
  opacity: 0;
  z-index: 1;
  animation: var(--animation-name) 8s infinite;
}
html.dark {
  .animated-text-bg {
    color: theme('colors.gray.100');
    &:before {
      color: theme('colors.gray.100');
    }
  }
}
</style>
