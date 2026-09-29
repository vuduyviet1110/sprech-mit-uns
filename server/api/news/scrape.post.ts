import { defineEventHandler, readBody, createError } from 'h3'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'
import { feedsForLanguage } from '~/utils/news-sources'

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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&Aacute;/g, 'Á').replace(/&aacute;/g, 'á')
    .replace(/&Ccaron;/g, 'Č').replace(/&ccaron;/g, 'č')
    .replace(/&Dcaron;/g, 'Ď').replace(/&dcaron;/g, 'ď')
    .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
    .replace(/&Ecaron;/g, 'Ě').replace(/&ecaron;/g, 'ě')
    .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
    .replace(/&Ncaron;/g, 'Ň').replace(/&ncaron;/g, 'ň')
    .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
    .replace(/&Rcaron;/g, 'Ř').replace(/&rcaron;/g, 'ř')
    .replace(/&Scaron;/g, 'Š').replace(/&scaron;/g, 'š')
    .replace(/&Tcaron;/g, 'Ť').replace(/&tcaron;/g, 'ť')
    .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
    .replace(/&Uring;/g, 'Ů').replace(/&uring;/g, 'ů')
    .replace(/&Yacute;/g, 'Ý').replace(/&yacute;/g, 'ý')
    .replace(/&Zcaron;/g, 'Ž').replace(/&zcaron;/g, 'ž')
}

function cleanHtmlText(rawHtml: string): string {
  const cleaned = rawHtml
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
  return decodeHtmlEntities(cleaned)
}

function estimateCEFR(text: string, lang = 'de'): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
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

async function scrapeSingleUrl(targetUrl: string, lang = 'de'): Promise<ScrapedArticle> {
  let urlToFetch = targetUrl.trim()
  if (!/^https?:\/\//i.test(urlToFetch)) {
    urlToFetch = 'https://' + urlToFetch
  }

  const acceptLangHeader = lang === 'cs' ? 'cs-CZ,cs;q=0.9,en;q=0.8' : 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'

  const headersList: Record<string, string>[] = [
    {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': acceptLangHeader,
      'Cookie': 'idnes_nastaveni=1; cmp=1; didomi_token=1; adsCMP=gemius=1; tech_max=aplikace=1; euconsent-v2=true',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
    {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': acceptLangHeader,
      'Cookie': 'idnes_nastaveni=1; cmp=1; euconsent-v2=true',
    },
    {
      'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      'Accept': '*/*',
    },
  ]

  let response: Response | null = null
  let lastStatus = 403

  for (const h of headersList) {
    try {
      const res = await fetch(urlToFetch, { headers: h })
      if (res.ok) {
        response = res
        break
      }
      lastStatus = res.status
    } catch {
      // Continue to next header
    }
  }

  if (!response || !response.ok) {
    throw createError({
      statusCode: lastStatus || 403,
      message: `Không thể truy cập URL trang báo (${urlToFetch}): Lỗi ${lastStatus} Forbidden / Blocked.`,
    })
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || ''

  let encoding = 'utf-8'
  if (/windows-1250/i.test(contentType) || /iso-8859-2/i.test(contentType)) {
    encoding = 'windows-1250'
  } else {
    // Check meta charset in raw buffer bytes
    const peekText = new TextDecoder('ascii').decode(buffer.slice(0, 1000))
    if (/charset=["']?(windows-1250|iso-8859-2)/i.test(peekText)) {
      encoding = 'windows-1250'
    }
  }

  let html = ''
  try {
    html = new TextDecoder(encoding).decode(buffer)
  } catch {
    html = new TextDecoder('utf-8').decode(buffer)
  }

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

  title = title
    .replace(/\s*[-|]\s*(Tagesschau|DW|Spiegel|ZEIT ONLINE|ZDF|NDR|WDR|BR|n-tv|FAZ|iROZHLAS|ČT24|iDNES|Novinky|Seznam Zprávy).*$/i, '')
    .trim()
  if (!title) title = lang === 'cs' ? 'Zprávy v češtině' : 'Tin tức tiếng Đức mới'

  let summary = ''
  const ogDescMatch =
    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i) ||
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
  if (ogDescMatch) {
    summary = cleanHtmlText(ogDescMatch[1])
  }

  // Strip non-content blocks (script, style, iframe, audio, video, nav, footer, header) before extracting text
  const cleanBodyHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')
    .replace(/<video[\s\S]*?<\/video>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  // Scope extraction to article containers if present, otherwise extract from cleanBodyHtml
  const artTextIndex = cleanBodyHtml.indexOf('id="art-text"')
  let scopedHtml = cleanBodyHtml

  if (artTextIndex !== -1) {
    scopedHtml = cleanBodyHtml.slice(artTextIndex, artTextIndex + 15000)
  } else {
    const articleContentMatch =
      cleanBodyHtml.match(/<article[\s\S]*?<\/article>/i) ||
      cleanBodyHtml.match(/<main[\s\S]*?<\/main>/i) ||
      cleanBodyHtml.match(/<div[^>]*class=["'][^"']*(b-detail|article-content|entry-content|post-content|content-article|art-text|bbtext|opener)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
    if (articleContentMatch) {
      scopedHtml = articleContentMatch[0]
    }
  }

  const extractFromHtml = (targetHtml: string): string[] => {
    const blockMatches = [...targetHtml.matchAll(/<(p|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)]
    const result: string[] = []

    for (const m of blockMatches) {
      const tagName = m[1].toLowerCase()
      let text = cleanHtmlText(m[2])

      if (
        text.length >= 15 &&
        !/^https?:\/\//i.test(text) &&
        !/Používání profilů|personalizovaného obsahu|Vytváření profilů|Měření výkonu|Technický provoz stránek|Zpracování údajů vydavateli|zpracování provádět|těmto účelům/i.test(text) &&
        !/Vámi zvolené nastavení|zobrazováním cílené reklamy|Vyberte prosím znovu|jakou formou|máme zobrazovat obsah/i.test(text) &&
        !/Mozilla\/5\.0|AppleWebKit|Chrome\/|Safari\//i.test(text) &&
        !/To view this video please enable JavaScript/i.test(text) &&
        !/Bez reklam|iDNES Premium|Můžete neomezeně číst|Už máte účet|Přihlaste se|S cílenou reklamou|Podrobné nastavení|reklama|využitím k těmto účelům|zpracovávání provádět|blokování reklam|blokované některé skripty|Vypnout blokování|Neblokujete reklamy|Napište nám/i.test(text) &&
        !/Abyste mohli pokra|potřebujeme vědět|reklamu|neomezený přístup|Příhlaste se|Zachováme vám|souhlas s cílenou|zobrazování obsahu|osobní údaje|zpracováváme údaje/i.test(text) &&
        !/Hauptnavigation|springen|Zustimmen|datenschutz|impressum|copyright|newsletter|folgen sie|kontakt|datenschutz-einstellungen|soukromí|cookies|podmínky/i.test(text) &&
        !/^Stand:\s*\d/i.test(text) &&
        !/Dieses Thema im Programm/i.test(text) &&
        !/Foto:\s*|\/ Foto:\s*/i.test(text)
      ) {
        text = text.replace(/Bild:\s*[^.]+\./gi, '').trim()
        text = text.replace(/Foto:\s*[^.]+\./gi, '').trim()
        text = text.replace(/\s+mehr$/i, '').trim()

        if (tagName === 'h2' || tagName === 'h3') {
          text = `### ${text}`
        }

        if (text.length >= 12 && !result.includes(text)) {
          result.push(text)
        }
      }
    }
    return result
  }

  let paragraphs = extractFromHtml(scopedHtml)
  if (paragraphs.length === 0) {
    paragraphs = extractFromHtml(cleanBodyHtml)
  }

  // Prepend lead summary paragraph (opener) if present and not already at top
  if (summary && summary.length > 20) {
    const cleanSummaryText = cleanHtmlText(summary)
    if (cleanSummaryText && !paragraphs.some(p => p.includes(cleanSummaryText.slice(0, 25)))) {
      paragraphs.unshift(cleanSummaryText)
    }
  }

  // If page returned zero valid paragraphs due to Cookie/Paywall JS wall, use meta description summary
  let fullContent = paragraphs.length > 0 ? paragraphs.join('\n\n') : summary || title
  if (paragraphs.length === 0 && summary) {
    fullContent = `⚠️ [CHÚ Ý: Trang báo (${new URL(urlToFetch).hostname}) yêu cầu xác minh Cookie tường lửa trên trình duyệt. Đã trích xuất đoạn tóm tắt bài báo đầy đủ dưới đây:]\n\n${summary}`
  }
  const finalSummary = summary || paragraphs[0] || (lang === 'cs' ? 'Článek byl automaticky stažen.' : 'Bài báo tiếng Đức được cào tự động.')

  return {
    id: `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title,
    date: formatDate(),
    level: estimateCEFR(fullContent, lang),
    summary: finalSummary,
    content: fullContent,
    sourceUrl: urlToFetch,
    sourceName: new URL(urlToFetch).hostname.replace('www.', ''),
    isSaved: false,
  }
}

async function scrapeRssFeeds(lang = 'de', source = 'all', count = 3): Promise<ScrapedArticle[]> {
  const allRss = feedsForLanguage(lang)

  const picked = source === 'all' ? allRss : allRss.filter((f) => f.key === source)
  // `source` đến từ body client. Key lạ (client cũ còn giữ nguồn đã gỡ, hoặc gõ tay)
  // từng cho ra 0 feed rồi ném 500 "không cào được" — sai bản chất. Quay về tất cả nguồn.
  const selectedFeeds = picked.length > 0 ? picked : allRss
  const limitCount = Math.min(Math.max(1, count), 5)

  const scrapedArticles: ScrapedArticle[] = []

  for (const feed of selectedFeeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': lang === 'cs' ? 'cs-CZ,cs;q=0.9' : 'de-DE,de;q=0.9',
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
        let link = linkMatch ? cleanHtmlText(linkMatch[1]) : ''
        // Clean CDATA or trailing spaces from RSS URL links
        link = link.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()

        const pubDate = pubDateMatch ? pubDateMatch[1] : undefined

        if (!rawTitle) continue

        let fullArticleText = ''
        let scrapeErrMessage = ''
        if (link) {
          try {
            const deepArticle = await scrapeSingleUrl(link, lang)
            if (deepArticle && deepArticle.content && deepArticle.content.length > 50) {
              fullArticleText = deepArticle.content
              // Prepend rawDesc from RSS item feed if it contains lead paragraph text missing from deep scrape
              if (rawDesc && rawDesc.length > 25 && !fullArticleText.includes(rawDesc.slice(0, 30))) {
                fullArticleText = `${rawDesc}\n\n${fullArticleText}`
              }
            }
          } catch (e: any) {
            scrapeErrMessage = e.message || 'Lỗi truy cập chi tiết bài báo'
            console.error(`Không thể cào sâu chi tiết link RSS (${link}):`, e)
          }
        }

        if (!fullArticleText) {
          // If deep scraping failed, tag article content with a clear warning prefix or throw
          fullArticleText = `⚠️ [CHÚ Ý: Không thể cào full nội dung do bị trang báo (${feed.name}) chặn 403. ${scrapeErrMessage}]\n\n${rawTitle}\n\n${rawDesc}`
        }

        const content = fullArticleText.length > 40 ? fullArticleText : `${rawTitle}. ${rawDesc}`

        scrapedArticles.push({
          id: `rss-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          title: rawTitle,
          date: formatDate(pubDate),
          level: estimateCEFR(content, lang),
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
    await requireUserId(event)
    assertRateLimit(`news:scrape:${clientIp(event)}`, 10, 60 * 60 * 1000)

    const body = await readBody(event).catch(() => ({}))
    const { url, mode, source = 'all', count = 3, lang = 'de' } = body

    const maxCount = Math.min(Math.max(1, Number(count) || 3), 5)
    const targetLang = lang === 'cs' ? 'cs' : 'de'

    if (mode === 'url' || url) {
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Vui lòng nhập liên kết URL bài báo cần cào!',
        })
      }
      const article = await scrapeSingleUrl(url, targetLang)
      return {
        success: true,
        articles: [article],
      }
    }

    const articles = await scrapeRssFeeds(targetLang, source, maxCount)
    if (articles.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: `Không thể cào tin tức tự động cho ngôn ngữ ${targetLang.toUpperCase()}. Vui lòng thử cào bằng URL cụ thể.`,
      })
    }

    return {
      success: true,
      articles,
    }
  } catch (error: any) {
    console.error('Scrape News Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Lỗi khi cào tin tức',
    })
  }
})
