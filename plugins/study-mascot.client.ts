/**
 * Route greetings for the study fox companion.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const route = useRoute()
  const { greetForPath, hydrateCollapsed } = useStudyMascot()

  hydrateCollapsed()

  watch(
    () => route.path,
    (path) => {
      greetForPath(path)
    },
    { immediate: true },
  )
})
