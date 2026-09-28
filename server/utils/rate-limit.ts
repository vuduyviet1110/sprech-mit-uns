/**
 * Simple in-memory sliding/fixed window rate limiter for auth & proxy APIs.
 * Suitable for single-instance MVP; replace with Redis for multi-instance.
 */
import { createError } from 'h3'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  return { ok: true }
}

export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = 'Quá nhiều yêu cầu, thử lại sau',
) {
  const result = checkRateLimit(key, limit, windowMs)
  if (!result.ok) {
    throw createError({
      statusCode: 429,
      statusMessage: message,
      data: { retryAfterSec: result.retryAfterSec },
    })
  }
}

/** Test helper */
export function _resetRateLimitBuckets() {
  buckets.clear()
}

export function clientIp(event: { node?: { req?: { socket?: { remoteAddress?: string }; headers?: Record<string, string | string[] | undefined> } } }): string {
  const headers = event.node?.req?.headers || {}
  const xf = headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim()
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim()
  return event.node?.req?.socket?.remoteAddress || 'unknown'
}
