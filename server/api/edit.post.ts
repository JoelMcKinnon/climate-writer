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
PRESERVE all existing paragraph breaks exactly—do not merge paragraphs.
Do NOT add a sign-off or courteous closing unless the draft already contains one.
Respect content and ordering; tighten wording to fit the limit while keeping the same paragraph structure.
Return JSON: { "polished": string, "notes": string[] }.
"polished" MUST use \\n\\n between paragraphs. No markdown, no extra headers.`

const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: draft }
    ],
    response_format: { type: 'json_object' }
  })

  const json = JSON.parse(resp.choices[0].message.content || '{}')
  return { polished: json.polished || '', notes: json.notes || [] }
})
