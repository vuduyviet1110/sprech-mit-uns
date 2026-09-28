import type { H3Event } from 'h3'
import { createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

/**
 * Catalog/quiz bank mutations: require session.
 * In production, also require SMU_ALLOW_CATALOG_WRITES=1 or email in SMU_ADMIN_EMAILS.
 */
export async function requireCatalogWriter(event: H3Event): Promise<string> {
  const userId = await requireUserId(event)

  const allowFlag = process.env.SMU_ALLOW_CATALOG_WRITES === '1'
  const adminEmails = (process.env.SMU_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (process.env.NODE_ENV !== 'production') {
    return userId
  }

  if (allowFlag) {
    return userId
  }

  if (adminEmails.length) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (user && adminEmails.includes(user.email.toLowerCase())) {
      return userId
    }
  }

  throw createError({
    statusCode: 403,
    message: 'Ghi catalog/quiz bị tắt trên production',
  })
}
