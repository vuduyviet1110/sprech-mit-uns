import { defineEventHandler, readBody } from 'h3'
import { createStudyRoom, joinStudyRoom, listRoomPlayers } from '~/server/utils/roomStore'
import { assertRoomsEnabled } from '~/server/utils/rooms-guard'

export default defineEventHandler(async (event) => {
  assertRoomsEnabled()
  const body = await readBody(event).catch(() => ({}))
  const hostId = body.hostId || `host-${Date.now()}`
  const gameMode = body.gameMode || 'speed_60s'
  const language = body.language || 'de'

  const room = createStudyRoom(hostId, gameMode, language)
  const hostPlayerResult = joinStudyRoom(room.pin, 'Chủ Phòng (Host)')

  return {
    success: true,
    pin: room.pin,
    gameMode: room.gameMode,
    language: room.language,
    hostPlayer: 'error' in hostPlayerResult ? null : hostPlayerResult.player,
    players: listRoomPlayers(room.pin),
  }
})
