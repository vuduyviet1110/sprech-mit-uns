import { defineEventHandler, readBody } from 'h3'
import { updatePlayerScore, listRoomPlayers } from '~/server/utils/roomStore'
import { assertRoomsEnabled } from '~/server/utils/rooms-guard'

export default defineEventHandler(async (event) => {
  assertRoomsEnabled()
  const body = await readBody(event).catch(() => ({}))
  const { pin, playerId, points } = body

  if (!pin || !playerId || typeof points !== 'number') {
    return { success: false, error: 'Thông tin không hợp lệ' }
  }

  const ok = updatePlayerScore(pin, playerId, points)
  if (!ok) {
    return { success: false, error: 'Không thể cập nhật điểm' }
  }

  return {
    success: true,
    players: listRoomPlayers(pin),
  }
})
