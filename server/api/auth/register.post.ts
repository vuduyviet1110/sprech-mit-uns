import bcrypt from 'bcrypt'
import { prisma } from '../../ultis/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email và mật khẩu bắt buộc',
    })
  }

  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist) {
    throw createError({ statusCode: 400, statusMessage: 'Email đã tồn tại' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { email, passwordHash },
  })

  return { success: true, message: 'Đăng ký thành công' }
})
