import { defineEventHandler, readBody } from 'h3'
import { getStudyRoom, startStudyRoom } from '~/server/utils/roomStore'
import { assertRoomsEnabled } from '~/server/utils/rooms-guard'

export default defineEventHandler(async (event) => {
  assertRoomsEnabled()
  const body = await readBody(event).catch(() => ({}))
  const { pin } = body

  if (!pin) {
    return { success: false, error: 'Thiếu mã PIN' }
  }

  const room = getStudyRoom(pin)
  if (!room) {
    return { success: false, error: 'Phòng không tồn tại' }
  }

  // Mix of MC + dictation + sentence builder for group rooms
  const questions = await $fetch<any[]>(
    '/api/quiz/random?types=multiple_choice,dictation,sentence_builder&limit=20',
  ).catch(() => [])

  const updatedRoom = startStudyRoom(pin, questions)
  if (!updatedRoom) {
    return { success: false, error: 'Không thể bắt đầu phòng' }
  }

  return {
    success: true,
    phase: updatedRoom.phase,
    questions: updatedRoom.questions,
  }
})
