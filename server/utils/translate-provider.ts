/**
 * Dịch văn bản theo ba tầng dự phòng:
 *
 *   1. Cloud Translation API — chính thức, cần `GOOGLE_TRANSLATE_API_KEY`,
 *      miễn phí 500.000 ký tự/tháng.
 *   2. `translate_a/single` — endpoint nội bộ trang Google Dịch tự gọi. Không
 *      key, không SLA, đã từng trả 429 hàng loạt. Đo thực tế cho thấy yếu tố
 *      quyết định là User-Agent: giả UA trình duyệt thì bị chặn, để UA mặc
 *      định thì qua — vì vậy ở đây **không** đặt User-Agent.
 *   3. MyMemory — kho bộ nhớ dịch cộng đồng, không key, không phụ thuộc Google.
 *
 * Có tầng 3 để khi Google chặn thì app vẫn tra được nghĩa thay vì báo lỗi.
 * (Đã cân nhắc LibreTranslate: `cs→vi` trả về tiếng Anh — `láska` ra "love" —
 * và mirror công cộng giới hạn 3 request/phút, nên không dùng.)
 */

export type TranslateProvider = 'cloud' | 'free' | 'off'

/** Các giá trị `client` đã kiểm là còn hoạt động, thử lần lượt khi bị chặn. */
const FREE_CLIENTS = ['gtx', 'dict-chrome-ex', 'at'] as const

const CLOUD_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

export function getCloudApiKey(): string {
  return (process.env.GOOGLE_TRANSLATE_API_KEY || '').trim()
}

/**
 * `cloud` khi có API key, `off` khi bị tắt thủ công, còn lại là `free`.
 * Đặt `SMU_TRANSLATE_PROVIDER=off` để buộc trả 503 (dùng khi muốn tắt hẳn
 * đường không chính thức).
 */
export function resolveTranslateProvider(): TranslateProvider {
  const raw = (process.env.SMU_TRANSLATE_PROVIDER || '').toLowerCase()
  if (raw === 'off') return 'off'
  if (raw === 'free') return 'free'
  if (raw === 'cloud') return 'cloud'
  return getCloudApiKey() ? 'cloud' : 'free'
}

export interface TranslateResult {
  translated: string
  /** Đường nào thực sự trả kết quả — dùng cho header chẩn đoán. */
  via: 'cloud' | 'free' | 'mymemory'
}

/** Cloud Translation API v2. Hạn mức miễn phí 500.000 ký tự/tháng. */
async function translateViaCloud(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const key = getCloudApiKey()
  if (!key) throw new Error('Thiếu GOOGLE_TRANSLATE_API_KEY')

  const res = await fetch(`${CLOUD_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Cloud Translation ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data: any = await res.json()
  const out = data?.data?.translations?.[0]?.translatedText
  if (typeof out !== 'string' || !out) {
    throw new Error('Cloud Translation trả về rỗng')
  }
  return decodeEntities(out)
}

/** Cloud API trả HTML entity ngay cả khi format=text. */
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Endpoint nội bộ. Thử lần lượt các `client` cho tới khi có cái qua được. */
async function translateViaFree(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  let lastError: Error | null = null

  for (const client of FREE_CLIENTS) {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=${client}` +
      `&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
    try {
      // Cố ý không đặt User-Agent: UA trình duyệt giả bị Google chặn 429.
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Translate upstream ${res.status} (client=${client})`)
      }
      const data: any = await res.json()
      const out = parseFreeResponse(data)
      if (!out) throw new Error(`Translate upstream rỗng (client=${client})`)
      return out
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError || new Error('Translate upstream thất bại')
}

/** Định dạng `[[["đã dịch","gốc",...], ...], ...]`. */
export function parseFreeResponse(data: unknown): string {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return ''
  return (data[0] as unknown[])
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('')
    .trim()
}

/**
 * MyMemory trả **HTTP 200 kèm thông báo lỗi nằm ngay trong trường dịch**, ví dụ
 * `"'XX' IS AN INVALID SOURCE LANGUAGE ..."`. Không lọc thì người học sẽ thấy
 * nguyên dòng chữ hoa tiếng Anh đó làm nghĩa của từ.
 * `responseStatus` trong body (không phải mã HTTP) mới là thứ phân biệt.
 */
export function parseMyMemoryResponse(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = data as Record<string, any>

  const status = Number(d.responseStatus)
  if (Number.isFinite(status) && status !== 200) return ''
  if (d.quotaFinished === true) return ''

  const out = d.responseData?.translatedText
  if (typeof out !== 'string') return ''

  const trimmed = out.trim()
  if (!trimmed) return ''

  // Chốt chặn cuối: thông báo lỗi của họ luôn viết hoa toàn bộ và có từ khoá
  // đặc trưng. Từ vựng thật hiếm khi vừa dài vừa toàn chữ hoa.
  const isShouting = trimmed.length > 24 && trimmed === trimmed.toUpperCase()
  if (isShouting && /INVALID|NO QUERY|LANGPAIR|QUOTA|EXAMPLE/.test(trimmed)) {
    return ''
  }

  return trimmed
}

/**
 * MyMemory — kho bộ nhớ dịch cộng đồng, không cần key.
 * Dùng làm lớp cuối khi Google chặn: đo thực tế cho `cs→vi` tốt hơn
 * LibreTranslate (`láska` → "tình yêu" thay vì trả về tiếng Anh "love").
 */
async function translateViaMyMemory(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const url =
    'https://api.mymemory.translated.net/get' +
    `?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`MyMemory ${res.status}`)

  const out = parseMyMemoryResponse(await res.json())
  if (!out) throw new Error('MyMemory không trả được bản dịch')
  return out
}

/**
 * Dịch theo ba tầng: Cloud API (nếu có key) → endpoint nội bộ của Google →
 * MyMemory. Endpoint nội bộ đã từng bị chặn 429 hàng loạt, nên cần một lớp cuối
 * không phụ thuộc Google.
 *
 * Ném lỗi khi cả ba hỏng — **không** trả lại nguyên văn, vì như thế người dùng
 * sẽ thấy "Haus" nghĩa là "Haus" và tưởng app dịch sai thay vì dịch hỏng.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const provider = resolveTranslateProvider()

  if (provider === 'off') {
    throw new Error('Dịch tự động đang tắt')
  }

  if (provider === 'cloud') {
    try {
      return { translated: await translateViaCloud(text, from, to), via: 'cloud' }
    } catch (err) {
      console.warn('Cloud Translation lỗi, chuyển sang đường dự phòng:', err)
    }
  }

  try {
    return { translated: await translateViaFree(text, from, to), via: 'free' }
  } catch (err) {
    console.warn('Google nội bộ lỗi, chuyển sang MyMemory:', err)
  }

  return { translated: await translateViaMyMemory(text, from, to), via: 'mymemory' }
}
