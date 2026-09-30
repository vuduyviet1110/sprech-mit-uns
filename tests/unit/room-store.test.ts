import { beforeEach, describe, expect, it } from 'vitest'
import {
  FINISHED_ROOM_TTL_MS,
  ROOM_TTL_MS,
  countStudyRooms,
  createStudyRoom,
  deleteStudyRoom,
  getStudyRoom,
  joinStudyRoom,
  pruneExpiredRooms,
} from '~/server/utils/roomStore'

/** Kho phòng là singleton in-memory — dọn sạch trước mỗi test. */
const clearAll = () => pruneExpiredRooms(Date.now() + ROOM_TTL_MS * 10)

describe('roomStore', () => {
  beforeEach(clearAll)

  it('phòng mới tạo không bị dọn', () => {
    const room = createStudyRoom('host-1')
    expect(pruneExpiredRooms()).toBe(0)
    expect(getStudyRoom(room.pin)).toBeDefined()
  })

  // Trước đây không chỗ nào xoá khỏi Map: mọi phòng từng tạo nằm lại trong RAM
  // đến khi khởi động lại tiến trình.
  it('phòng quá 6 giờ bị dọn khỏi bộ nhớ', () => {
    const room = createStudyRoom('host-1')
    expect(countStudyRooms()).toBe(1)

    const removed = pruneExpiredRooms(Date.now() + ROOM_TTL_MS + 1000)
    expect(removed).toBe(1)
    expect(countStudyRooms()).toBe(0)
    expect(getStudyRoom(room.pin)).toBeUndefined()
  })

  it('phòng đã kết thúc hết hạn sớm hơn phòng đang chơi', () => {
    const finished = createStudyRoom('host-finished')
    const playing = createStudyRoom('host-playing')
    getStudyRoom(finished.pin)!.phase = 'gameover'

    const removed = pruneExpiredRooms(Date.now() + FINISHED_ROOM_TTL_MS + 1000)
    expect(removed).toBe(1)
    expect(getStudyRoom(finished.pin)).toBeUndefined()
    // Phòng đang chơi vẫn còn — người chơi chưa xong ván
    expect(getStudyRoom(playing.pin)).toBeDefined()
  })

  it('tạo phòng mới sẽ dọn luôn phòng quá hạn', () => {
    const old = createStudyRoom('host-old')
    // Lùi thời điểm tạo để phòng này coi như đã quá hạn
    getStudyRoom(old.pin)!.createdAt = Date.now() - ROOM_TTL_MS - 1000

    createStudyRoom('host-new')
    expect(getStudyRoom(old.pin)).toBeUndefined()
    expect(countStudyRooms()).toBe(1)
  })

  it('mã PIN được giải phóng sau khi dọn', () => {
    const room = createStudyRoom('host-1')
    const pin = room.pin
    pruneExpiredRooms(Date.now() + ROOM_TTL_MS + 1000)

    // PIN không còn bị giữ chỗ: tham gia vào đó phải báo không tồn tại
    const res = joinStudyRoom(pin, 'Ai đó')
    expect(res).toHaveProperty('error')
  })

  it('deleteStudyRoom xoá hẳn phòng', () => {
    const room = createStudyRoom('host-1')
    expect(deleteStudyRoom(room.pin)).toBe(true)
    expect(getStudyRoom(room.pin)).toBeUndefined()
    expect(deleteStudyRoom(room.pin)).toBe(false)
  })

  it('mỗi phòng có mã PIN 6 chữ số riêng biệt', () => {
    const pins = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const pin = createStudyRoom(`host-${i}`).pin
      expect(pin).toMatch(/^\d{6}$/)
      pins.add(pin)
    }
    expect(pins.size).toBe(20)
  })

  it('TTL phòng đã kết thúc ngắn hơn TTL phòng đang chơi', () => {
    expect(FINISHED_ROOM_TTL_MS).toBeLessThan(ROOM_TTL_MS)
  })
})
