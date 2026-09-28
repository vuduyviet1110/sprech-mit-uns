export default defineNuxtPlugin(async () => {
  const { fetchMe, hydrated } = useSession()
  if (hydrated.value) return
  try {
    await fetchMe()
  } catch {
    // Offline / API down — leave unauthenticated
  }
})
