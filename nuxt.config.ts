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
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  modules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/tailwindcss',
    'nuxt-headlessui',
    'nuxt-icon',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/content',
    'shadcn-nuxt',
  ],
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
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
  },

  content: {
    markdown: { mdc: true },
    highlight: { theme: 'github-dark' },
  },
})
