/**
 * Mẹo học của cáo và luật im lặng theo trang.
 *
 * Tách khỏi composable vì đây là phần quyết định cáo *nói gì* và *có nên nói
 * không* — thứ dễ sai và người dùng đọc trực tiếp, nên phải test được mà không
 * cần dựng cả Nuxt runtime.
 */

export const MASCOT_REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

export type MascotReaction = (typeof MASCOT_REACTIONS)[number]

export interface Tip {
  reaction: MascotReaction
  line: string
}

/** Mẹo chung — dùng khi trang hiện tại không có mẹo riêng. */
export const CLICK_TIPS: Tip[] = [
  { reaction: 'wink', line: 'Bấm mình khi cần động viên nhé.' },
  { reaction: 'heart', line: 'Học 15 phút đều tốt hơn 2 giờ một lần.' },
  { reaction: 'sparkle', line: 'Sai một câu không sao — SRS sẽ nhắc lại.' },
  { reaction: 'bashful', line: 'Đọc to giúp nhớ phát âm lâu hơn.' },
  { reaction: 'delighted', line: 'Xong một khối Today là thắng nhỏ rồi.' },
]

/**
 * Mẹo theo trang đang đứng. Trước đây 5 mẹo chung xoay vòng cứng, nên bấm cáo ở
 * màn chép chính tả hay màn ôn SRS đều ra cùng một câu.
 */
export const ROUTE_TIPS: Array<{ match: RegExp; tips: Tip[] }> = [
  {
    match: /^\/sub-menu\/youtube/,
    tips: [
      { reaction: 'sparkle', line: 'Nghe cả câu trước, đừng bắt từng từ.' },
      { reaction: 'wink', line: 'Chậm lại còn 0.75x nếu người nói nhanh quá.' },
      { reaction: 'heart', line: 'Gõ sai chính tả vẫn được tính — nghe đúng mới là chính.' },
    ],
  },
  {
    match: /^\/review/,
    tips: [
      { reaction: 'sparkle', line: 'Nhớ mờ mờ vẫn bấm "nhớ" — não cần chút chật vật.' },
      { reaction: 'wink', line: 'Quên rồi thì thành thật bấm "quên", lịch sẽ tự siết lại.' },
    ],
  },
  {
    match: /^\/practice\/(shadowing|pronunciation)/,
    tips: [
      { reaction: 'heart', line: 'Thu âm rồi nghe lại — tai bạn khắt khe hơn bạn nghĩ.' },
      { reaction: 'bashful', line: 'Nói to hơn bình thường một chút, phát âm rõ hẳn ra.' },
    ],
  },
  {
    match: /^\/sub-menu\/news/,
    tips: [
      { reaction: 'delighted', line: 'Đọc hết câu rồi mới tra — đoán nghĩa trước đã.' },
      { reaction: 'sparkle', line: 'Từ nào gặp lần hai thì nên lưu vào SRS.' },
    ],
  },
]

/**
 * Chỉ những trang có bài tập mới được nhắc khi ngồi im. Trang đọc
 * (`/sub-menu/news`, `/dictionary`) thì đứng yên lâu là đang đọc chứ không phải
 * đang lơ đãng — cáo xen vào lúc đó là ngắt quãng, không phải động viên.
 */
const IDLE_ROUTES = [/^\/review/, /^\/practice/, /^\/lesson/, /^\/today/]

export function idleAllowedFor(path: string): boolean {
  return IDLE_ROUTES.some((r) => r.test(String(path || '')))
}

/** Nhóm mẹo cho trang này: khoá để lưu con trỏ xoay vòng, và danh sách mẹo. */
export function tipPoolFor(path: string): { key: string; tips: Tip[] } {
  const hit = ROUTE_TIPS.find((r) => r.match.test(String(path || '')))
  return hit ? { key: hit.match.source, tips: hit.tips } : { key: '*', tips: CLICK_TIPS }
}
