export interface Player {
  id: string
  nickname: string
  score: number
  streak: number
  connected: boolean
  joinedAt: number
}

export interface StudyRoom {
  pin: string
  hostId: string
  gameMode: string
  language: string
  phase: 'lobby' | 'playing' | 'gameover'
  players: Map<string, Player>
  questions: any[]
  currentIdx: number
  startTime?: number
  createdAt: number
}

const rooms = new Map<string, StudyRoom>()
const pinToRoom = new Map<string, string>()

function generatePin(): string {
  let pin: string
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000))
  } while (pinToRoom.has(pin))
  return pin
}

export function createStudyRoom(hostId: string, gameMode: string = 'speed_60s', language: string = 'de'): StudyRoom {
  const pin = generatePin()
  const room: StudyRoom = {
    pin,
    hostId,
    gameMode,
    language,
    phase: 'lobby',
    players: new Map(),
    questions: [],
    currentIdx: 0,
    createdAt: Date.now(),
  }

  rooms.set(pin, room)
  pinToRoom.set(pin, pin)
  return room
}

export function getStudyRoom(pin: string): StudyRoom | undefined {
  return rooms.get(pin)
}

export function joinStudyRoom(pin: string, nickname: string): { player: Player; room: StudyRoom } | { error: string } {
  const room = rooms.get(pin)
  if (!room) return { error: 'Mã PIN không tồn tại hoặc đã hết hạn' }

  const cleanName = nickname.trim()
  if (!cleanName || cleanName.length < 2) return { error: 'Biệt danh phải từ 2 ký tự trở lên' }

  const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const player: Player = {
    id: playerId,
    nickname: cleanName,
    score: 0,
    streak: 0,
    connected: true,
    joinedAt: Date.now(),
  }

  room.players.set(playerId, player)
  return { player, room }
}

export function startStudyRoom(pin: string, questions: any[]): StudyRoom | null {
  const room = rooms.get(pin)
  if (!room) return null
  room.phase = 'playing'
  room.questions = questions
  room.currentIdx = 0
  room.startTime = Date.now()
  return room
}

export function updatePlayerScore(pin: string, playerId: string, points: number): boolean {
  const room = rooms.get(pin)
  if (!room) return false
  const player = room.players.get(playerId)
  if (!player) return false
  player.score += points
  return true
}

export function listRoomPlayers(pin: string) {
  const room = rooms.get(pin)
  if (!room) return []
  return Array.from(room.players.values()).sort((a, b) => b.score - a.score)
}
