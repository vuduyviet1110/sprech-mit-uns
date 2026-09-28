import { createResolver } from '@nuxt/kit'
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  experimental: {
    localLayerAliases: true,
  },

  alias: {
    '~': resolve('./'),
    composables: resolve('./composables'),
    utils: resolve('./utils'),
    stores: resolve('./stores'),
  },

  app: {
    // Avoid hydration insertBefore crashes on first paint (esp. Docker/prod)
    pageTransition: false,
    layoutTransition: false,
  },

  compatibilityDate: '2026-09-08',
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-headlessui',
    'nuxt-icon',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    // Drop the module's built-in plugin — we register MotionPlugin ourselves
    // in plugins/motion.ts for reliable SSR directive resolution.
    (_opts, nuxt) => {
      nuxt.options.plugins = nuxt.options.plugins.filter((plugin) => {
        if (typeof plugin === 'string') return true
        const src = plugin.src || ''
        return !src.includes('@vueuse/motion/dist/nuxt/runtime/templates/motion')
      })
    },
    '@nuxt/content',
    'shadcn-nuxt',
  ],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  css: [
    resolve('./assets/scss/_variables.scss'),
    resolve('./assets/scss/app.scss'),
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('dotlottie-player'),
    },
  },
  components: [
    { path: resolve('./components/layouts'), prefix: 'Layout', global: true },
    { path: resolve('./components/awesome'), prefix: 'Awesome', global: true },
  ],

  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },

  headlessui: {
    prefix: 'Headless',
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'nuxt-color-mode',
  },

  content: {
    markdown: { mdc: true },
    highlight: { theme: 'github-dark' },
  },
})
