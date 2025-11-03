import type { NuxtApp } from 'nuxt/schema'
import type { RouteLocationRaw } from '#vue-router'

export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: Date
}

export interface VocabularyWord {
  id: string
  word: string
  meaning: string
  example?: string
  pronunciation?: string
  type?: string
  paragraph?: string
  transcription?: string
  imageUrl?: string
  audioUrl?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string
  synonyms: string[]
  antonyms: string[]
  level?: string
  createdAt?: Date
  topics: any[]
}

export interface Topic {
  id: string
  name: string
}

export interface WordTopic {
  id: string
  wordId: string
  topicId: string
}
export interface QuizQuestion {
  question: string
  answers: string[]
  correctAnswerIndex: number
}

export interface UserWordProgress {
  id?: string
  userId: string
  wordId: string
  nextReviewAt?: Date
  correctCount: number
  incorrectCount: number
  lastReviewedAt?: Date
  lastCorrect: boolean
  isMastered: boolean
  masteryLevel: number
  streak: number
}

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
