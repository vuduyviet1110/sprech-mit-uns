import { defineEventHandler, readBody, createError } from 'h3'

interface ScrapedArticle {
  id: string
  title: string
  date: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  summary: string
  content: string
  sourceUrl?: string
  sourceName?: string
  isSaved?: boolean
}

function cleanHtmlText(rawHtml: string): string {
  return rawHtml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function estimateGermanCEFR(text: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'A2'

  const avgLength = words.reduce((acc, w) => acc + w.length, 0) / words.length
  const longWords = words.filter((w) => w.length > 8).length
  const longWordRatio = longWords / words.length

  if (avgLength < 5.2 && longWordRatio < 0.1) return 'A1'
  if (avgLength < 6.0 && longWordRatio < 0.18) return 'A2'
  if (avgLength < 6.8 && longWordRatio < 0.25) return 'B1'
  if (avgLength < 7.5 && longWordRatio < 0.32) return 'B2'
  return 'C1'
}

function formatDate(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date()
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('vi-VN')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return new Date().toLocaleDateString('vi-VN')
  }
}

async function scrapeSingleUrl(targetUrl: string): Promise<ScrapedArticle> {
  let urlToFetch = targetUrl.trim()
  if (!/^https?:\/\//i.test(urlToFetch)) {
    urlToFetch = 'https://' + urlToFetch
  }

  const response = await fetch(urlToFetch, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Không thể truy cập URL: ${response.statusText}`,
    })
  }

  const html = await response.text()

  // Extract title
  let title = ''
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i)
  if (ogTitleMatch) {
    title = cleanHtmlText(ogTitleMatch[1])
  } else {
    const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (titleTagMatch) {
      title = cleanHtmlText(titleTagMatch[1])
    }
  }

  title = title.replace(/\s*[-|]\s*(Tagesschau|DW|Spiegel|ZEIT ONLINE|ZDF|NDR|WDR|BR|n-tv|FAZ).*$/i, '').trim()
  if (!title) title = 'Tin tức tiếng Đức mới'

  let summary = ''
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
  if (ogDescMatch) {
    summary = cleanHtmlText(ogDescMatch[1])
  }

  // Scope extraction to <article> tag if available to strip header/footer/navigation noise
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i)
  const sourceHtml = articleMatch ? articleMatch[0] : html

  const paragraphMatches = [...sourceHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  const paragraphs: string[] = []

  for (const m of paragraphMatches) {
    let text = cleanHtmlText(m[1])

    // Filter out image captions, video player messages, TV schedules, and URLs
    if (
      text.length >= 25 &&
      !/^https?:\/\//i.test(text) &&
      !/To view this video please enable JavaScript/i.test(text) &&
      !/Hauptnavigation|springen|Zustimmen|datenschutz|impressum|copyright|newsletter|folgen sie|kontakt|datenschutz-einstellungen/i.test(text) &&
      !/^Stand:\s*\d/i.test(text) &&
      !/Dieses Thema im Programm/i.test(text)
    ) {
      // Remove inline image credits (e.g. Bild: dpa...)
      text = text.replace(/Bild:\s*[^.]+\./gi, '').trim()
      text = text.replace(/\s+mehr$/i, '').trim()

      if (text.length >= 20) {
        paragraphs.push(text)
      }
    }
  }

  const fullContent = paragraphs.length > 0 ? paragraphs.join(' ') : summary || title
  const finalSummary = summary || paragraphs[0] || 'Bài báo tiếng Đức được cào tự động.'

  return {
    id: `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title,
    date: formatDate(),
    level: estimateGermanCEFR(fullContent),
    summary: finalSummary,
    content: fullContent,
    sourceUrl: urlToFetch,
    sourceName: new URL(urlToFetch).hostname.replace('www.', ''),
    isSaved: false,
  }
}

async function scrapeRssFeeds(source = 'all', count = 3): Promise<ScrapedArticle[]> {
  const allRss = [
    { key: 'tagesschau', name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2/' },
    { key: 'dw', name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-de-all' },
  ]

  const selectedFeeds = source === 'all' ? allRss : allRss.filter((f) => f.key === source)
  const limitCount = Math.min(Math.max(1, count), 5)

  const scrapedArticles: ScrapedArticle[] = []

  for (const feed of selectedFeeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept-Language': 'de-DE,de;q=0.9',
        },
      })
      if (!res.ok) continue
      const xml = await res.text()

      const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      const perFeedLimit = Math.ceil(limitCount / selectedFeeds.length)

      for (let i = 0; i < Math.min(itemMatches.length, perFeedLimit); i++) {
        if (scrapedArticles.length >= limitCount) break

        const itemXml = itemMatches[i][1]
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i)
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i)
        const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i)
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)

        const rawTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : ''
        const rawDesc = descMatch ? cleanHtmlText(descMatch[1]) : ''
        const link = linkMatch ? cleanHtmlText(linkMatch[1]) : ''
        const pubDate = pubDateMatch ? pubDateMatch[1] : undefined

        if (!rawTitle) continue

        let fullArticleText = rawDesc
        if (link) {
          try {
            const deepArticle = await scrapeSingleUrl(link)
            if (deepArticle && deepArticle.content && deepArticle.content.length > rawDesc.length) {
              fullArticleText = deepArticle.content
            }
          } catch {
            // Fallback to RSS description
          }
        }

        const content = fullArticleText.length > 40 ? fullArticleText : `${rawTitle}. ${rawDesc}`

        scrapedArticles.push({
          id: `rss-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          title: rawTitle,
          date: formatDate(pubDate),
          level: estimateGermanCEFR(content),
          summary: rawDesc || rawTitle,
          content: content,
          sourceUrl: link,
          sourceName: feed.name,
          isSaved: false,
        })
      }
    } catch (e) {
      console.error(`Lỗi cào RSS feed ${feed.name}:`, e)
    }
  }

  return scrapedArticles.slice(0, limitCount)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const { url, mode, source = 'all', count = 3 } = body

    const maxCount = Math.min(Math.max(1, Number(count) || 3), 5)

    if (mode === 'url' || url) {
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Vui lòng nhập liên kết URL bài báo tiếng Đức cần cào!',
        })
      }
      const article = await scrapeSingleUrl(url)
      return {
        success: true,
        articles: [article],
      }
    }

    const articles = await scrapeRssFeeds(source, maxCount)
    if (articles.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Không thể cào tin tức tự động từ các trang báo tiếng Đức. Vui lòng thử cào bằng URL cụ thể.',
      })
    }

    return {
      success: true,
      articles,
    }
  } catch (error: any) {
    console.error('Scrape German News Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Lỗi khi cào tin tức tiếng Đức',
    })
  }
})
