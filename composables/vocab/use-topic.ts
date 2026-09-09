export function useTopic() {
  const create = (name: string) => {
    return $fetch('/api/dictionary/topic', {
      method: 'POST',
      body: { name },
    })
  }

  return { create }
}
