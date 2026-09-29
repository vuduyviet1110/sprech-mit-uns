/**
 * Nguồn RSS cho trang Tin tức — nguồn sự thật duy nhất cho cả server lẫn client.
 *
 * Trước đây danh sách này bị chép tay ở ba chỗ (handler cào, dropdown chọn nguồn,
 * và nhãn "Tất cả" liệt kê tên). Feed ČT24 chết (404) đã sót lại trong dropdown
 * vì lý do đó — chọn vào thì server lọc ra 0 feed rồi ném 500.
 */

export interface NewsFeed {
  key: string
  /** Tên hiển thị, cũng dùng làm `sourceName` của bài cào được. */
  name: string
  url: string
}

export const GERMAN_FEEDS: NewsFeed[] = [
  { key: 'tagesschau', name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2/' },
  { key: 'dw', name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-de-all' },
]

export const CZECH_FEEDS: NewsFeed[] = [
  { key: 'irozhlas', name: 'iROZHLAS', url: 'https://www.irozhlas.cz/rss/irozhlas' },
  { key: 'idnes', name: 'iDNES.cz', url: 'https://servis.idnes.cz/rss.aspx' },
  { key: 'denikn', name: 'Deník N', url: 'https://denikn.cz/feed/' },
]

export function feedsForLanguage(lang: string): NewsFeed[] {
  return lang === 'cs' ? CZECH_FEEDS : GERMAN_FEEDS
}

/** Nhãn của mục "Tất cả" — suy ra từ danh sách nên không thể lệch khỏi nguồn thật. */
export function allSourcesLabel(lang: string): string {
  const langName = lang === 'cs' ? 'tiếng Séc' : 'tiếng Đức'
  const names = feedsForLanguage(lang)
    .map((f) => f.name)
    .join(', ')
  return `Tất cả nguồn ${langName} (${names})`
}
