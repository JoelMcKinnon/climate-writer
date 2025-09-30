// server/api/edit.post.ts
import { z } from 'zod'
import OpenAI from 'openai'

const Body = z.object({
  draft: z.string().min(40),
  wordLimit: z.number().int().min(120).max(300)
})

export default defineEventHandler(async (event) => {
  const { draft, wordLimit } = Body.parse(await readBody(event))

  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
  }
  const openai = new OpenAI({ apiKey: openaiApiKey })

  const system = `Edit for clarity, respectful tone, and CCL style.
Keep the author's voice. Remove jargon and absolutist language.
Return JSON: { "polished": string, "notes": string[] }.
Enforce a hard limit of ${wordLimit} words.`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: draft }
    ],
    response_format: { type: 'json_object' }
  })

  const parsed = JSON.parse(resp.choices[0].message.content ?? '{"polished":"","notes":[]}')
  return parsed
})
