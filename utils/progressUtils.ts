import type { UserWordProgress } from './types'
import { qualityFromBinaryClient } from './srs-quality'

const PROGRESS_KEY = 'german_learning_progress'

const getAllProgress = (): Record<string, UserWordProgress> => {
  try {
    if (typeof localStorage === 'undefined') return {}
    const stored = localStorage.getItem(PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error loading progress:', error)
    return {}
  }
}

const saveAllProgress = (progress: Record<string, UserWordProgress>) => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Error saving progress:', error)
  }
}

export function getWordProgress(userId: string, wordId: string): UserWordProgress | null {
  const allProgress = getAllProgress()
  const key = `${userId}-${wordId}`
  return allProgress[key] || null
}

/** Sync progress via SM-2 API (session cookie); localStorage is optimistic cache only. */
export const updateWordProgress = (
  userId: string,
  wordId: string,
  progress: Partial<UserWordProgress> & { quality?: number },
): void => {
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

  if (typeof window !== 'undefined') {
    const quality =
      progress.quality !== undefined
        ? progress.quality
        : qualityFromBinaryClient(progress.lastCorrect ?? false)

    $fetch('/api/progress/word', {
      method: 'POST',
      body: {
        wordId,
        quality,
        isCorrect: progress.lastCorrect ?? false,
      },
    }).catch((err) => {
      console.warn('Could not sync progress to DB:', err)
    })
  }
}

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
