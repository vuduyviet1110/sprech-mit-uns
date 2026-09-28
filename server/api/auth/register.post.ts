import bcrypt from 'bcrypt'
import { prisma } from '../../ultis/prisma'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { setSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  assertRateLimit(`auth:register:${clientIp(event)}`, 10, 15 * 60 * 1000)

  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email và mật khẩu bắt buộc',
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mật khẩu tối thiểu 6 ký tự',
    })
  }

  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist) {
    throw createError({ statusCode: 400, statusMessage: 'Email đã tồn tại' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, passwordHash },
  })

  await setSessionUserId(event, user.id)

  return { success: true, message: 'Đăng ký thành công', userId: user.id }
})
