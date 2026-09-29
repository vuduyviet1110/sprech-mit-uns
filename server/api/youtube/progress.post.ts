import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/ultis/prisma'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'

const YOUTUBE_ID = /^[\w-]{11}$/
const MAX_CLIP_IDX = 500

interface ClipState {
  done: boolean
  score: number
  attempts: number
}

export default defineEventHandler(async (event) => {
  try {
    const userId = await requireUserId(event)
    assertRateLimit(`youtube:progress:${clientIp(event)}`, 240, 60 * 60 * 1000)

    const body = await readBody(event)
    const youtubeId = String(body?.youtubeId || '')
    const language = body?.language === 'cs' ? 'cs' : 'de'
    const clipIdx = Number(body?.clipIdx)
    const score = Math.min(Math.max(Number(body?.score) || 0, 0), 100)
    const done = !!body?.done

    if (!YOUTUBE_ID.test(youtubeId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'youtubeId không hợp lệ',
      })
    }
    if (!Number.isInteger(clipIdx) || clipIdx < 0 || clipIdx > MAX_CLIP_IDX) {
      throw createError({
        statusCode: 400,
        statusMessage: 'clipIdx không hợp lệ',
      })
    }

    const existing = await prisma.userLessonProgress.findFirst({
      where: { userId, youtubeId },
    })

    const states: Record<string, ClipState> = {
      ...((existing?.clipStates as Record<string, ClipState> | null) || {}),
    }
    const key = String(clipIdx)
    const prev = states[key] || { done: false, score: 0, attempts: 0 }
    const wasAlreadyDone = prev.done

    states[key] = {
      done: prev.done || done,
      score: Math.max(prev.score || 0, score),
      attempts: (prev.attempts || 0) + 1,
    }

    // Suy ra từ clipStates trên server — client không thể tự mở khoá.
    const clipsDone = Object.values(states).filter((s) => s.done).length
    const maxUnlockedIdx = Math.max(
      existing?.maxUnlockedIdx ?? 0,
      done ? clipIdx + 1 : clipIdx,
    )
    const totalClips = Number.isInteger(Number(body?.totalClips))
      ? Number(body.totalClips)
      : (existing?.totalClips ?? 0)
    const bestScore = Math.max(existing?.bestScore ?? 0, score)

    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_youtubeId: { userId, youtubeId } },
      create: {
        userId,
        youtubeId,
        language,
        clipStates: states,
        clipsDone,
        maxUnlockedIdx,
        lastClipIdx: clipIdx,
        totalClips,
        bestScore,
      },
      update: {
        language,
        clipStates: states,
        clipsDone,
        maxUnlockedIdx,
        lastClipIdx: clipIdx,
        totalClips,
        bestScore,
      },
    })

    return {
      success: true,
      progress,
      // Cho client biết đây là lần đầu hoàn thành đoạn này (dùng để cộng XP một lần).
      firstCompletion: done && !wasAlreadyDone,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Lỗi khi lưu tiến độ dictation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Không thể lưu tiến độ luyện nghe vào Database',
    })
  }
})
