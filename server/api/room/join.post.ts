import { defineEventHandler, readBody } from 'h3'
import { joinStudyRoom, listRoomPlayers } from '~/server/utils/roomStore'
import { assertRoomsEnabled } from '~/server/utils/rooms-guard'

export default defineEventHandler(async (event) => {
  assertRoomsEnabled()
  const body = await readBody(event).catch(() => ({}))
  const pin = body.pin
  const nickname = body.nickname

  if (!pin) {
    return { success: false, error: 'Vui lòng nhập mã PIN 6 số' }
  }

  const result = joinStudyRoom(pin, nickname)
  if ('error' in result) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    pin: result.room.pin,
    player: result.player,
    players: listRoomPlayers(result.room.pin),
  }
})
