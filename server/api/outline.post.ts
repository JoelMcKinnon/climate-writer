import OpenAI from 'openai'
import { z } from 'zod'
import { briefs } from '@/data/briefs'

const Body = z.object({
  issue: z.string().min(2),
  briefId: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  audience: z.enum(['editor','moc']),
  personalPerspective: z.string().min(10),
  articleTitle: z.string().optional(),
  articleDate: z.string().optional(),
  outlet: z.string().optional(),
  wordLimit: z.number().int().min(120).max(300)
})

export default defineEventHandler(async (event) => {
  const input = Body.parse(await readBody(event))
  const brief = (briefs as any)[input.briefId]
  if (!brief) throw createError({ statusCode: 400, statusMessage: 'Unknown briefId' })

  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
  const openai = new OpenAI({ apiKey: openaiApiKey })

  const system = `You help Citizens' Climate Lobby volunteers brainstorm LTE bullet ideas.
Return only JSON: {"bullets": string[]}
Rules:
- 6–8 bullets, each one idea, 10–24 words.
- Reflect the user's personal perspective and local city/state.
- Align to the provided CCL brief (policy substance & tone).
- Avoid doom/snark; be respectful; avoid partisan jabs.`

  const user = `
Issue: ${input.issue}
Audience: ${input.audience}
City/State: ${input.city}, ${input.state}
Personal perspective: ${input.personalPerspective}

CCL brief summary:
${brief.summary || brief.content || ''}

Optional media context:
Title: ${input.articleTitle || '—'}
Date: ${input.articleDate || '—'}
Outlet: ${input.outlet || '—'}
`

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' }
    })

    const json = JSON.parse(resp.choices[0].message.content || '{}')
    return { bullets: Array.isArray(json.bullets) ? json.bullets : [] }
  } catch (err: any) {
    if (err?.status === 429) {
      throw createError({ statusCode: 503, statusMessage: 'Out of LLM credits. Try again later.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Could not generate bullets.' })
  }
})
