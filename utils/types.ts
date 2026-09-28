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
  language?: string
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
export interface QuizChoice {
  id?: string
  index: number
  text: string
  isCorrect: boolean
}

export type QuizQuestionType =
  | 'multiple_choice'
  | 'sentence_builder'
  | 'dictation'
  | 'typed_recall'
  | 'cloze'

export interface QuizQuestion {
  id?: string
  text: string
  type: QuizQuestionType | string
  level?: string | null
  audioUrl?: string | null
  targetSentence?: string | null
  solution?: string | null
  scrambleWords?: string[]
  choices?: QuizChoice[]
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

/** Personal notebook entry (not the shared dictionary catalog) */
export interface UserVocabularyEntry {
  id: string
  userId: string
  wordId?: string | null
  word: string
  meaning: string
  note?: string | null
  language: string
  level?: string | null
  type?: string | null
  example?: string | null
  source: 'dictionary' | 'manual' | string
  createdAt?: Date | string
  updatedAt?: Date | string
  vocabularyWord?: {
    id: string
    pronunciation?: string | null
    audioUrl?: string | null
    transcription?: string | null
  } | null
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
