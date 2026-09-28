/**
 * Lightweight Docker/startup helper: ensure demo login exists.
 * Avoids full prisma/seed.ts (needs server/utils not shipped in the runner image).
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const DEMO_EMAIL = 'demo@sprech.local'

async function main() {
  if (process.env.SMU_SEED_DEMO !== '1' && process.env.SMU_ALLOW_DEMO !== '1') {
    console.log('⏭ Skip demo user (set SMU_SEED_DEMO=1 or SMU_ALLOW_DEMO=1)')
    return
  }

  const prisma = new PrismaClient()
  try {
    const passwordHash = await bcrypt.hash('demo123', 10)
    await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { passwordHash },
      create: { email: DEMO_EMAIL, passwordHash },
    })
    console.log(`✅ Demo user: ${DEMO_EMAIL} / demo123`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
