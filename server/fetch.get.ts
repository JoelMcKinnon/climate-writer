export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string | undefined
  if (!url) { throw createError({ statusCode: 400, statusMessage: 'Missing url' }) }

  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
    // crude content-type gate; treat HTML/text only
    const ct = res.headers.get('content-type') || ''
    if (!/text|html|markdown/i.test(ct)) {
      throw createError({ statusCode: 415, statusMessage: 'Unsupported content type' })
    }
    const text = (await res.text()).slice(0, 40000) // server cap
    return text
  } catch (e: any) {
    throw createError({ statusCode: 502, statusMessage: e?.message || 'Fetch failed' })
  }
})
