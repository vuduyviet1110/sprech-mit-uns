import type { H3Event } from 'h3'
import { createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { requireUserId } from '~/server/utils/user'

export function adminEmails(): string[] {
  return (process.env.SMU_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

/** Dictionary catalog creates: only emails listed in SMU_ADMIN_EMAILS. */
export async function requireAdmin(event: H3Event): Promise<string> {
  const userId = await requireUserId(event)
  const allowed = adminEmails()
  if (!allowed.length) {
    throw createError({
      statusCode: 403,
      message: 'Chưa cấu hình admin (SMU_ADMIN_EMAILS)',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user || !allowed.includes(user.email.toLowerCase())) {
    throw createError({
      statusCode: 403,
      message: 'Chỉ admin mới thêm được từ vào từ điển',
    })
  }
  return userId
}
