import { prisma } from '~/server/ultis/prisma'
import { isAdminEmail } from '~/server/utils/admin'
import { resolveUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  const userId = await resolveUserId(event)

  if (!userId) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      isDemo: false,
      isAdmin: false,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  })

  if (!user) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      isDemo: false,
      isAdmin: false,
    }
  }

  const isSeededDemo = user.email === 'demo@sprech.local'

  return {
    authenticated: true,
    userId: user.id,
    email: user.email,
    isDemo: isSeededDemo,
    isAdmin: isAdminEmail(user.email),
    createdAt: user.createdAt,
  }
})
