/**
 * Bóc videoId từ liên kết YouTube — dùng chung cho handler và trang luyện nghe.
 *
 * Regex này từng bị chép tay ở ba chỗ. Ở `/api/youtube/parse` nó đi kèm một giá trị
 * mặc định, nên link sai sẽ âm thầm cho học nhầm video thay vì báo lỗi.
 */

/** ID video YouTube: đúng 11 ký tự [A-Za-z0-9_-]. */
export const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/

const URL_PATTERN =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/

/**
 * Trả về videoId, hoặc `null` nếu không phải URL/ID YouTube hợp lệ.
 * Nhận cả liên kết đầy đủ lẫn ID trần 11 ký tự.
 */
export function extractYoutubeId(input: string): string | null {
  const raw = (input || '').trim()
  if (!raw) return null

  if (YOUTUBE_ID_PATTERN.test(raw)) return raw

  const match = raw.match(URL_PATTERN)
  return match && match[1] ? match[1] : null
}
