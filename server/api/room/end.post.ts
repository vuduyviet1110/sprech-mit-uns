import { defineEventHandler, readBody } from 'h3'
import { getStudyRoom } from '~/server/utils/roomStore'
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

  room.phase = 'gameover'

  return {
    success: true,
    phase: room.phase,
  }
})
