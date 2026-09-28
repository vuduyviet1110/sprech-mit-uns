import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 4173)
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec nuxt preview ./app --host 127.0.0.1 --port ${PORT}`,
        url: `${baseURL}/api/auth/me`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          HOST: '127.0.0.1',
          PORT: String(PORT),
          NODE_ENV: 'production',
          NUXT_PUBLIC_TTS_MODE: 'browser',
          SMU_TTS_PROVIDER: 'off',
          NUXT_TELEMETRY_DISABLED: '1',
          SMU_ALLOW_DEMO: '1',
          NUXT_PUBLIC_SHOW_DEMO: '1',
        },
      },
})
