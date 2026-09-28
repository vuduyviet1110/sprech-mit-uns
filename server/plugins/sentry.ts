/**
 * Optional Sentry server init — no-op without SENTRY_DSN / NUXT_PUBLIC_SENTRY_DSN.
 * Scrubs cookies and auth headers from events.
 */
export default defineNitroPlugin(async () => {
  const dsn = process.env.SENTRY_DSN || process.env.NUXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    const Sentry = await import('@sentry/node')
    Sentry.init({
      dsn,
      environment:
        process.env.SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.cookie
          delete event.request.headers.authorization
          delete event.request.headers.Authorization
        }
        return event
      },
    })
  } catch {
    console.warn('[sentry] @sentry/node failed to init — check install and DSN')
  }
})
