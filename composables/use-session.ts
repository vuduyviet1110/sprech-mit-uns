import { computed } from 'vue'

type MeResponse = {
  authenticated: boolean
  userId: string | null
  email: string | null
  isDemo: boolean
  isAdmin?: boolean
  createdAt?: string
}

/**
 * Soft client session mirror. Real identity lives in httpOnly sealed cookie;
 * this state is hydrated from /api/auth/me after login or on app load.
 */
export function useSession() {
  const userId = useState<string | null>('session-user-id', () => null)
  const email = useState<string | null>('session-email', () => null)
  const hydrated = useState('session-hydrated', () => false)
  const isAdmin = useState('session-is-admin', () => false)

  const isAuthenticated = computed(() => !!userId.value)
  const isDemo = computed(() => false)

  const applyMe = (res: MeResponse) => {
    userId.value = res.authenticated ? res.userId : null
    email.value = res.authenticated ? res.email : null
    isAdmin.value = !!(res.authenticated && res.isAdmin)
    hydrated.value = true
  }

  const fetchMe = async () => {
    const res = await $fetch<MeResponse>('/api/auth/me')
    applyMe(res)
    return res
  }

  const login = async (emailInput: string, password: string) => {
    const res = await $fetch<{ success: boolean; userId: string; email: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email: emailInput, password } },
    )
    userId.value = res.userId
    email.value = res.email
    hydrated.value = true
    await fetchMe()
    return res
  }

  const register = async (emailInput: string, password: string) => {
    const res = await $fetch<{ success: boolean; userId: string }>(
      '/api/auth/register',
      { method: 'POST', body: { email: emailInput, password } },
    )
    userId.value = res.userId
    email.value = emailInput
    hydrated.value = true
    return res
  }

  const clearSession = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      userId.value = null
      email.value = null
      isAdmin.value = false
      hydrated.value = true
    }
  }

  /** @deprecated Identity is server-session only; prefer login/fetchMe. */
  const setUserId = (id: string) => {
    userId.value = id
  }

  return {
    userId,
    email,
    hydrated,
    isAuthenticated,
    isAdmin,
    isDemo,
    setUserId,
    clearSession,
    login,
    register,
    fetchMe,
  }
}
