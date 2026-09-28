/**
 * Optional Sentry client — no-op without NUXT_PUBLIC_SENTRY_DSN.
 * Scrubs obvious PII; captures Vue errors when initialized.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn as string
  if (!dsn || !import.meta.client) return

  try {
    const Sentry = await import('@sentry/browser')
    const scrub = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return value
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
          .replace(/(password|passwd|pwd|token|authorization)["']?\s*[:=]\s*["']?[^"'&\s]+/gi, '$1=[redacted]')
      }
      return value
    }

    Sentry.init({
      dsn,
      environment:
        (config.public.sentryEnvironment as string) ||
        process.env.NODE_ENV ||
        'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.cookie
          delete event.request.headers.authorization
          delete event.request.headers.Authorization
        }
        if (event.request?.data && typeof event.request.data === 'object') {
          const data = event.request.data as Record<string, unknown>
          for (const key of Object.keys(data)) {
            if (/pass|token|secret|email/i.test(key)) data[key] = '[redacted]'
          }
        }
        if (event.message) event.message = String(scrub(event.message))
        return event
      },
      ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error promise rejection captured',
        'AbortError',
      ],
    })

    nuxtApp.vueApp.config.errorHandler = (err, _instance, info) => {
      Sentry.captureException(err, { extra: { info } })
      if (import.meta.dev) console.error('[vue]', err, info)
    }

    nuxtApp.hook('app:error', (err) => {
      Sentry.captureException(err)
    })
  } catch {
    if (import.meta.dev) {
      console.info('[sentry] client init skipped')
    }
  }
})
