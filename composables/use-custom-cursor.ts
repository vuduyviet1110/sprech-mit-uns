import { ref, computed } from 'vue'

const STORAGE_KEY = 'custom_cursor_enabled'
const enabled = ref(true)
let hydrated = false

function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === '0' || saved === 'false') enabled.value = false
  else if (saved === '1' || saved === 'true') enabled.value = true
}

export function useCustomCursor() {
  hydrate()

  const isEnabled = computed(() => enabled.value)

  const setEnabled = (value: boolean) => {
    enabled.value = value
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    }
  }

  const toggle = () => setEnabled(!enabled.value)

  return {
    isEnabled,
    setEnabled,
    toggle,
  }
}
