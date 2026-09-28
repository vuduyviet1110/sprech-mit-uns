import bcrypt from 'bcrypt'
import { prisma } from '~/server/ultis/prisma'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { DEMO_EMAIL, isDemoAllowed } from '~/server/utils/demo'
import { setSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  assertRateLimit(`auth:login:${clientIp(event)}`, 20, 15 * 60 * 1000)

  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email và mật khẩu bắt buộc',
    })
  }

  if (email === DEMO_EMAIL && !isDemoAllowed('login')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tài khoản demo đã tắt trên production',
    })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email hoặc mật khẩu không đúng',
    })
  }

  let ok = false
  try {
    ok = await bcrypt.compare(password, user.passwordHash)
  } catch {
    ok = false
  }

  if (!ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email hoặc mật khẩu không đúng',
    })
  }

  await setSessionUserId(event, user.id)

  return {
    success: true,
    userId: user.id,
    email: user.email,
  }
})
