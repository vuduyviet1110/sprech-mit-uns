export function useTopic() {
  const create = (name: string) => {
    return useFetch('/api/dictionary/topic', {
      method: 'POST',
      body: { name },
      immediate: false,
    })
  }

  return { create }
}
