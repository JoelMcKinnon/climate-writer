import { z } from 'zod'

const Body = z.object({
  url: z.string().url().max(1000)
})

export default defineEventHandler(async (event) => {
  const { url } = Body.parse(await readBody(event))

  // fetch with Nitro's global fetch
  const resp = await fetch(url, { headers: { 'User-Agent': 'climate-writer/1.0' } })
  if (!resp.ok) {
    throw createError({ statusCode: 400, statusMessage: `Fetch failed (${resp.status})` })
  }

  const ct = (resp.headers.get('content-type') || '').toLowerCase()
  if (/application\/pdf/.test(ct)) {
    // keep it simple for now
    // If you later want PDF parsing, add a separate server path using a PDF parser.
    throw createError({ statusCode: 415, statusMessage: 'PDF not supported here. Please upload a .txt/.md excerpt instead.' })
  }

  let raw = await resp.text()

  // if HTML, strip tags & scripts/styles
  if (/text\/html/.test(ct) || /<\/?\w+/.test(raw)) {
    raw = raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  }

  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 12000) // keep modest

  return { text }
})
