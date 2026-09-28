import { defineEventHandler, getQuery } from 'h3'
import { getStudyRoom, listRoomPlayers } from '~/server/utils/roomStore'
import { assertRoomsEnabled } from '~/server/utils/rooms-guard'

export default defineEventHandler(async (event) => {
  assertRoomsEnabled()
  const query = getQuery(event)
  const pin = query.pin as string

  if (!pin) {
    return { success: false, error: 'Thiếu mã PIN' }
  }

  const room = getStudyRoom(pin)
  if (!room) {
    return { success: false, error: 'Phòng không tồn tại hoặc đã hết hạn' }
  }

  return {
    success: true,
    pin: room.pin,
    phase: room.phase,
    gameMode: room.gameMode,
    language: room.language,
    players: listRoomPlayers(pin),
    questions: room.phase === 'playing' ? room.questions : [],
    currentIdx: room.currentIdx,
    startTime: room.startTime,
  }
})
