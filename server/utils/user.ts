import type { H3Event } from 'h3'
import { createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { getSessionUserId, normalizeUserId } from '~/server/utils/session'

/**
 * Resolve authenticated user id from sealed httpOnly session only.
 * Client-supplied body/query/header userId is intentionally ignored.
 */
export async function resolveUserId(event: H3Event): Promise<string | null> {
  return getSessionUserId(event)
}

/** Require an authenticated user id or throw 401. */
export async function requireUserId(event: H3Event): Promise<string> {
  const userId = await resolveUserId(event)
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Bạn cần đăng nhập để tiếp tục',
    })
  }
  return userId
}

/** Load user row; do not auto-create anonymous/demo users. */
export async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Phiên đăng nhập không hợp lệ',
    })
  }
  return user
}

export { normalizeUserId }
