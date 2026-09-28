export default defineNuxtConfig({
  // Devtools only in development
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  extends: '../',
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || '',
    public: {
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      sentryEnvironment:
        process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        'development',
      /** auto | browser | proxy — browser skips server Google TTS */
      ttsMode: process.env.NUXT_PUBLIC_TTS_MODE || 'auto',
      /**
       * Demo button on auth UI. Local/non-prod defaults on.
       * Docker production: set NUXT_PUBLIC_SHOW_DEMO=1 (runtime override).
       * Key name must stay `showDemo` so Nuxt maps that env at runtime.
       */
      showDemo:
        process.env.NUXT_PUBLIC_SHOW_DEMO ||
        (process.env.NODE_ENV === 'production' ? '' : '1'),
    },
  },
})
