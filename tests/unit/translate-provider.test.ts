import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  parseFreeResponse,
  parseMyMemoryResponse,
} from '~/server/utils/translate-provider'

const ENV_KEYS = ['GOOGLE_TRANSLATE_API_KEY', 'SMU_TRANSLATE_PROVIDER'] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]!
  }
})

/** Module đọc env lúc gọi hàm, nhưng import lại cho chắc sau khi đổi env. */
const freshResolve = async () => {
  const mod = await import('~/server/utils/translate-provider')
  return mod.resolveTranslateProvider()
}

describe('resolveTranslateProvider', () => {
  it('không có key thì dùng đường dự phòng', async () => {
    expect(await freshResolve()).toBe('free')
  })

  it('có API key thì ưu tiên Cloud Translation', async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key'
    expect(await freshResolve()).toBe('cloud')
  })

  it('key toàn khoảng trắng coi như không có', async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = '   '
    expect(await freshResolve()).toBe('free')
  })

  it('SMU_TRANSLATE_PROVIDER=off tắt hẳn dịch tự động', async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key'
    process.env.SMU_TRANSLATE_PROVIDER = 'off'
    expect(await freshResolve()).toBe('off')
  })

  it('ép dùng free kể cả khi có key', async () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key'
    process.env.SMU_TRANSLATE_PROVIDER = 'free'
    expect(await freshResolve()).toBe('free')
  })
})

describe('parseFreeResponse', () => {
  it('đọc đúng định dạng của endpoint nội bộ', () => {
    const real = [
      [['Căn nhà', 'Haus', null, null, 10]],
      null,
      'de',
      null,
      null,
      null,
      null,
      [],
    ]
    expect(parseFreeResponse(real)).toBe('Căn nhà')
  })

  it('ghép nhiều đoạn của câu dài', () => {
    const multi = [
      [
        ['Xin chào ', 'Hello ', null, null, 10],
        ['thế giới', 'world', null, null, 10],
      ],
    ]
    expect(parseFreeResponse(multi)).toBe('Xin chào thế giới')
  })

  it('trả chuỗi rỗng với dữ liệu sai dạng', () => {
    for (const bad of [null, undefined, {}, [], [null], 'x', 42, [[null]]]) {
      expect(parseFreeResponse(bad), JSON.stringify(bad)).toBe('')
    }
  })

  it('bỏ qua phần tử không phải chuỗi', () => {
    expect(parseFreeResponse([[['ok', 'x'], [123, 'y'], ['!', 'z']]])).toBe('ok!')
  })
})

describe('parseMyMemoryResponse', () => {
  const ok = (translatedText: string) => ({
    responseData: { translatedText, match: 1 },
    responseStatus: 200,
    quotaFinished: null,
  })

  it('đọc bản dịch hợp lệ', () => {
    expect(parseMyMemoryResponse(ok('tình yêu'))).toBe('tình yêu')
    expect(parseMyMemoryResponse(ok('  nhà  '))).toBe('nhà')
  })

  // MyMemory trả HTTP 200 kèm thông báo lỗi ngay trong trường dịch — không lọc
  // thì người học thấy nguyên dòng chữ hoa tiếng Anh làm nghĩa của từ.
  it('loại thông báo lỗi nấp trong trường dịch', () => {
    expect(
      parseMyMemoryResponse({
        responseData: {
          translatedText:
            "'XX' IS AN INVALID SOURCE LANGUAGE . EXAMPLE: LANGPAIR=EN|IT USING 2 LETTER ISO",
        },
        responseStatus: 403,
      }),
    ).toBe('')

    expect(
      parseMyMemoryResponse({
        responseData: {
          translatedText:
            'NO QUERY SPECIFIED. EXAMPLE REQUEST: GET?Q=HELLO&LANGPAIR=EN|IT',
        },
        responseStatus: 200,
      }),
    ).toBe('')
  })

  it('loại khi hết quota', () => {
    expect(
      parseMyMemoryResponse({
        responseData: { translatedText: 'gì đó' },
        responseStatus: 200,
        quotaFinished: true,
      }),
    ).toBe('')
  })

  it('giữ từ viết hoa ngắn hợp lệ — không lọc quá tay', () => {
    // Viết tắt và danh từ riêng phải đi qua được
    expect(parseMyMemoryResponse(ok('CHLB Đức'))).toBe('CHLB Đức')
    expect(parseMyMemoryResponse(ok('NATO'))).toBe('NATO')
    expect(parseMyMemoryResponse(ok('BERLIN'))).toBe('BERLIN')
  })

  it('giữ câu dài viết hoa nếu không phải thông báo lỗi', () => {
    const shout = 'ĐÂY LÀ MỘT CÂU DÀI VIẾT HOA NHƯNG VẪN LÀ BẢN DỊCH'
    expect(parseMyMemoryResponse(ok(shout))).toBe(shout)
  })

  it('trả rỗng với dữ liệu sai dạng', () => {
    for (const bad of [null, undefined, 'x', 42, [], {}, { responseData: {} }]) {
      expect(parseMyMemoryResponse(bad as unknown), JSON.stringify(bad)).toBe('')
    }
    expect(parseMyMemoryResponse(ok('   '))).toBe('')
  })
})
