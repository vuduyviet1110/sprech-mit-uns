import type { NuxtApp } from 'nuxt/schema'
import type { RouteLocationRaw } from '#vue-router'

export interface AwesomeLayoutPageNavbarMenuDropdownItem {
  type?: 'link'
  title?: string | ((nuxt: NuxtApp) => string)
  to?: RouteLocationRaw | ((nuxt: NuxtApp) => RouteLocationRaw)
}

export interface AwesomeLayoutPageNavbarMenu {
  type?: 'link' | 'button' | 'dropdown'
  title?: string | ((nuxt: NuxtApp) => string)
  to?: RouteLocationRaw | ((nuxt: NuxtApp) => RouteLocationRaw)
  children?: AwesomeLayoutPageNavbarMenuDropdownItem[]
}

export interface Vocabulary {
  id: string | null
  word: string
  meaning: string
  example?: string
  level: 'A1' | 'A2' | 'B1'
  audioUrl?: string
  imageUrl?: string
  transcription?: string
  type?: string
}
