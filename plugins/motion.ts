import { MotionPlugin } from '@vueuse/motion'

/**
 * Explicit Motion registration for SSR.
 * The @vueuse/motion/nuxt module plugin can fail to resolve the directive
 * during SSR in this layer setup, causing getSSRProps errors.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  nuxtApp.vueApp.use(MotionPlugin, config.public.motion)
})
