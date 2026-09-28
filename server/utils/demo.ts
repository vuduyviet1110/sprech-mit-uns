export const DEMO_EMAIL = 'demo@sprech.local'

/** Demo login/seed allowed in non-production, or when SMU_ALLOW_DEMO=1 / SMU_SEED_DEMO=1. */
export function isDemoAllowed(kind: 'login' | 'seed' = 'login'): boolean {
  if (kind === 'seed' && process.env.SMU_SEED_DEMO === '1') return true
  if (process.env.SMU_ALLOW_DEMO === '1') return true
  return process.env.NODE_ENV !== 'production'
}

export function normalizeAnswerText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡…„“"«»']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
