import { createError } from 'h3'

/** Multiplayer rooms are demo-only (in-memory). Disabled in production. */
export function assertRoomsEnabled() {
  if (process.env.NODE_ENV === 'production' && process.env.SMU_ENABLE_ROOMS !== '1') {
    throw createError({
      statusCode: 503,
      message:
        'Quiz phòng multiplayer chỉ là demo (single-server). Bật SMU_ENABLE_ROOMS=1 nếu cần.',
    })
  }
}
