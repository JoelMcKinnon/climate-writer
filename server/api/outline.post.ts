// server/api/outline.post.ts
import { z } from 'zod'
import { briefs } from '@/data/briefs'
import OpenAI from 'openai'

const Body = z.object({
  issue: z.string().min(3),
  briefId: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  audience: z.enum(['editor','moc']),
  articleTitle: z.string().optional(),
  articleDate: z.string().optional(),
  wordLimit: z.number().int().min(120).max(300)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = Body.parse(body)

  const brief = (briefs as any)[input.briefId]
  if (!brief) throw createError({ statusCode: 400, statusMessage: 'Unknown briefId' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'LLM unavailable: server is not configured.',
    })
  }

    const config = useRuntimeConfig()
    const apiKey = config.openaiApiKey
    if (!apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
    }
    const openai = new OpenAI({ apiKey })

  const system = `You are a coach helping Citizens' Climate Lobby advocates draft LTEs.
Follow CCL tone: respectful, appreciative, solution-focused. Avoid doom and snark.
Return concise, locally-relevant bullet ideas.`
  const user = `
ISSUE: ${input.issue}
AUDIENCE: ${input.audience}
LOCATION: ${[input.city, input.state].filter(Boolean).join(', ') || '—'}
ARTICLE: ${input.articleTitle || '—'}  DATE: ${input.articleDate || '—'}
TARGET WORD LIMIT: ${input.wordLimit}

CCL BRIEF:
Title: ${brief.title}
Summary: ${brief.summary}
Dos: ${brief.dos.join('; ')}
Donts: ${brief.donts.join('; ')}
Key points: ${brief.keyPoints.join('; ')}

Return JSON with keys: thesis (string), bullets (array of 5-8 strings), suggestedAsk (string).
Each bullet must be one idea, 10–24 words, locally relevant if possible.
`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' }
  })

  const data = JSON.parse(resp.choices[0].message.content || '{}')
  return data
})
