export default defineNuxtRouteMiddleware((to) => {
  // Demo Check Auth Token / User Cookie
  const user = useCookie('user')

  const protectedRoutes = ['/progress', '/setting', '/lesson']

  if (protectedRoutes.some((path) => to.path.startsWith(path)) && !user.value) {
    // If not authenticated, redirect to login page (or dictionary for demo)
    return navigateTo('/dictionary')
  }
})
