import { defineEventHandler, getQuery, createError } from 'h3'
import { assertRateLimit, clientIp } from '~/server/utils/rate-limit'
import { requireUserId } from '~/server/utils/user'

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  assertRateLimit(`translate:${clientIp(event)}`, 60, 60 * 1000)

  const query = getQuery(event)
  const text = (query.text as string || '').trim()
  const from = (query.from as string || 'cs')
  const to = (query.to as string || 'vi')

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Text query parameter is required' })
  }

  try {
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(translateUrl)
    if (!res.ok) {
      throw new Error(`Translation upstream error: ${res.statusText}`)
    }

    const data = await res.json()
    // Extract translated text from Google response format [[["translated", "original", ...]]]
    let translatedText = ''
    if (data && data[0] && Array.isArray(data[0])) {
      translatedText = data[0].map((item: any) => item[0]).join('')
    }

    return {
      original: text,
      translated: translatedText || text,
      from,
      to,
    }
  } catch (err: any) {
    console.error('Translation API error:', err)
    return {
      original: text,
      translated: text,
      from,
      to,
    }
  }
})
