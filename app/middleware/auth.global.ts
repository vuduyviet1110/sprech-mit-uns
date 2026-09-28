export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/login') || to.path.startsWith('/register')) return

  const protectedRoutes = [
    '/progress',
    '/setting',
    '/lesson',
    '/vocabulary',
    '/today',
    '/review',
    '/dictionary',
    '/practice',
    '/profile',
    '/sub-menu/quizz',
    '/sub-menu/youtube',
    '/sub-menu/news',
  ]

  const needsAuth = protectedRoutes.some((path) => to.path.startsWith(path))
  if (!needsAuth) return

  // Settings allowed without auth (learning prefs + logout)
  if (to.path.startsWith('/setting')) return

  const { userId, hydrated, fetchMe } = useSession()
  if (!hydrated.value) {
    try {
      await fetchMe()
    } catch {
      // treat as logged out
    }
  }

  if (!userId.value) {
    return navigateTo({
      path: '/login',
      query: { auth: 'required', redirect: to.fullPath },
    })
  }
})
