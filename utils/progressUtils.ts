// Get api from db

import type { UserWordProgress } from './types'

const PROGRESS_KEY = 'german_learning_progress'

// Get all user progress
const getAllProgress = (): Record<string, UserWordProgress> => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error loading progress:', error)
    return {}
  }
}

// Save all progress to localStorage
const saveAllProgress = (progress: Record<string, UserWordProgress>) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Error saving progress:', error)
  }
}

// Get progress for a specific word
export function getWordProgress(userId: string, wordId: string) {
  const fake = {
    correctCount: Math.floor(Math.random() * 5),
    incorrectCount: Math.floor(Math.random() * 3),
    streak: Math.floor(Math.random() * 4),
    masteryLevel: Math.floor(Math.random() * 6),
    isMastered: Math.random() > 0.8,
    lastCorrect: Math.random() > 0.5,
    nextReviewAt: new Date(),
    lastReviewedAt: new Date(),
  }
  return fake
}

// Update progress for a specific word
export const updateWordProgress = (
  userId: string,
  wordId: string,
  progress: Partial<UserWordProgress>,
): any => {
  const allProgress = getAllProgress()
  const key = `${userId}-${wordId}`

  const existing = allProgress[key] || {
    userId,
    wordId,
    correctCount: 0,
    incorrectCount: 0,
    lastCorrect: false,
    isMastered: false,
    masteryLevel: 0,
    streak: 0,
  }

  allProgress[key] = {
    ...existing,
    ...progress,
    userId,
    wordId,
  }

  saveAllProgress(allProgress)
}

// Get all words that need review
export const getWordsForReview = (userId: string): any => {
  const allProgress = getAllProgress()
  const now = new Date()

  return Object.values(allProgress)
    .filter(
      (progress) =>
        progress.userId === userId &&
        progress.nextReviewAt &&
        new Date(progress.nextReviewAt) <= now &&
        !progress.isMastered,
    )
    .map((progress) => ({
      ...progress,
      nextReviewAt: progress.nextReviewAt
        ? new Date(progress.nextReviewAt)
        : undefined,
      lastReviewedAt: progress.lastReviewedAt
        ? new Date(progress.lastReviewedAt)
        : undefined,
    }))
}

// Get user statistics
export const getUserStats = (userId: string) => {
  const allProgress = getAllProgress()
  const userProgress = Object.values(allProgress).filter(
    (p) => p.userId === userId,
  )

  const totalWords = userProgress.length
  const masteredWords = userProgress.filter((p) => p.isMastered).length
  const wordsInProgress = userProgress.filter(
    (p) => !p.isMastered && (p.correctCount > 0 || p.incorrectCount > 0),
  ).length
  const averageCorrectRate =
    userProgress.length > 0
      ? userProgress.reduce(
          (sum, p) =>
            sum +
            p.correctCount / Math.max(1, p.correctCount + p.incorrectCount),
          0,
        ) / userProgress.length
      : 0

  const longestStreak = Math.max(0, ...userProgress.map((p) => p.streak))

  return {
    totalWords,
    masteredWords,
    wordsInProgress,
    averageCorrectRate: Math.round(averageCorrectRate * 100),
    longestStreak,
  }
}

// Calculate next review date based on spaced repetition
export const calculateNextReview = (
  masteryLevel: number,
  wasCorrect: boolean,
): Date => {
  const baseInterval = wasCorrect ? Math.pow(2, masteryLevel) : 1 // 1, 2, 4, 8, 16, 32 days
  const intervalHours = baseInterval * 24

  return new Date(Date.now() + intervalHours * 60 * 60 * 1000)
}
