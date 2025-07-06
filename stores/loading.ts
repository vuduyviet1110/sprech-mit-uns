import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', () => {
  const visible = ref(false)
  let counter = 0

  function start() {
    counter++
    visible.value = true
  }

  function stop() {
    counter--
    if (counter <= 0) {
      counter = 0
      visible.value = false
    }
  }

  function reset() {
    counter = 0
    visible.value = false
  }

  return {
    visible,
    start,
    stop,
    reset,
  }
})
