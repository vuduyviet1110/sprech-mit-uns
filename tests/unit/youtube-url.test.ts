import { describe, expect, it } from 'vitest'
import { extractYoutubeId, YOUTUBE_ID_PATTERN } from '~/utils/youtube-url'

describe('extractYoutubeId', () => {
  it('nhận các dạng liên kết YouTube phổ biến', () => {
    const cases: [string, string][] = [
      ['https://www.youtube.com/watch?v=3iV2WK1-IV8', '3iV2WK1-IV8'],
      ['http://youtube.com/watch?v=3iV2WK1-IV8', '3iV2WK1-IV8'],
      ['https://youtu.be/9-4SJ_1Ypv0', '9-4SJ_1Ypv0'],
      ['https://www.youtube.com/embed/lwc1_Dukv_o', 'lwc1_Dukv_o'],
      ['https://www.youtube.com/v/lwc1_Dukv_o', 'lwc1_Dukv_o'],
      ['https://www.youtube.com/shorts/3iV2WK1-IV8', '3iV2WK1-IV8'],
      ['https://www.youtube.com/live/3iV2WK1-IV8', '3iV2WK1-IV8'],
    ]
    for (const [input, expected] of cases) {
      expect(extractYoutubeId(input), input).toBe(expected)
    }
  })

  it('lấy được id khi v= không nằm đầu query', () => {
    expect(
      extractYoutubeId(
        'https://www.youtube.com/watch?list=PL123&v=3iV2WK1-IV8&index=2',
      ),
    ).toBe('3iV2WK1-IV8')
  })

  it('bỏ qua tham số phía sau id', () => {
    expect(
      extractYoutubeId('https://youtu.be/9-4SJ_1Ypv0?t=42&si=abc'),
    ).toBe('9-4SJ_1Ypv0')
  })

  it('nhận id trần 11 ký tự', () => {
    expect(extractYoutubeId('3iV2WK1-IV8')).toBe('3iV2WK1-IV8')
    expect(extractYoutubeId('  9-4SJ_1Ypv0  ')).toBe('9-4SJ_1Ypv0')
  })

  it('trả null cho đầu vào không hợp lệ', () => {
    const invalid = [
      '',
      '   ',
      'https://example.com/notavideo',
      'https://vimeo.com/123456789',
      'https://www.youtube.com/watch?v=',
      'https://www.youtube.com/',
      'abcdefghij', // 10 ký tự
      'abcdefghijkl', // 12 ký tự
      'không phải link',
    ]
    for (const input of invalid) {
      expect(extractYoutubeId(input), input).toBeNull()
    }
  })

  it('không rơi về video mặc định — đầu vào rác luôn là null', () => {
    expect(extractYoutubeId('https://example.com/notavideo')).not.toBe(
      '3iV2WK1-IV8',
    )
  })

  it('YOUTUBE_ID_PATTERN khớp đúng 11 ký tự cho phép', () => {
    expect(YOUTUBE_ID_PATTERN.test('3iV2WK1-IV8')).toBe(true)
    expect(YOUTUBE_ID_PATTERN.test('lwc1_Dukv_o')).toBe(true)
    expect(YOUTUBE_ID_PATTERN.test('abcdefghij')).toBe(false)
    expect(YOUTUBE_ID_PATTERN.test('abcdefghijkl')).toBe(false)
    expect(YOUTUBE_ID_PATTERN.test('abcdefghi j')).toBe(false)
  })
})
