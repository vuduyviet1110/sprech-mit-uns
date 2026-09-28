import type { H3Event } from 'h3'
import { createError, deleteCookie, useSession } from 'h3'

export const SESSION_COOKIE_NAME = 'smu_session'
export const LEGACY_USER_COOKIE = 'user'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

export type AppSessionData = {
  userId?: string
}

/** Password for sealed session cookie (min 32 chars). */
export function getSessionPassword(): string {
  const pw =
    process.env.NUXT_SESSION_PASSWORD ||
    process.env.SESSION_PASSWORD ||
    ''
  if (pw.length >= 32) return pw
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_SESSION_PASSWORD (≥32 chars) is required in production',
    })
  }
  // Dev-only fallback so local work without .env; never use in production.
  return 'dev-only-smu-session-password-32c!'
}

export async function getAppSession(event: H3Event) {
  return useSession<AppSessionData>(event, {
    name: SESSION_COOKIE_NAME,
    password: getSessionPassword(),
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  })
}

export async function setSessionUserId(event: H3Event, userId: string) {
  const session = await getAppSession(event)
  await session.update({ userId })
  // Clear legacy readable cookie if present
  deleteCookie(event, LEGACY_USER_COOKIE, { path: '/' })
}

export async function clearSessionUser(event: H3Event) {
  const session = await getAppSession(event)
  await session.clear()
  deleteCookie(event, LEGACY_USER_COOKIE, { path: '/' })
}

export async function getSessionUserId(event: H3Event): Promise<string | null> {
  const session = await getAppSession(event)
  return normalizeUserId(session.data?.userId)
}

/** Pure helper — session is the only trusted source. */
export function normalizeUserId(raw: unknown): string | null {
  if (raw == null) return null
  const id = String(raw).trim()
  if (!id || id === 'user-demo-id') return null
  return id
}
