import { z } from 'zod'
import OpenAI from 'openai'
// IMPORTANT: use a Nitro-friendly import for Vercel.
// If this path is what you already fixed earlier, keep it.
import { briefs } from '../../app/data/briefs'

const Body = z.object({
  issue: z.string().min(2),
  briefId: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  audience: z.enum(['editor', 'moc']).default('editor'),
  articleTitle: z.string().optional(),
  articleDate: z.string().optional(),
  outlet: z.string().optional(),
  wordLimit: z.number().int().min(120).max(300),
  personalPerspective: z.string().min(10),          // required, avoids empty bullets
  extraContext: z.string().optional()               // new: long topical context
})

export default defineEventHandler(async (event) => {
  const input = Body.parse(await readBody(event))

  const brief = (briefs as any)[input.briefId]
  if (!brief) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown briefId' })
  }

  // ---- OpenAI client (must exist before any usage) ----
  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
  }
  const openai = new OpenAI({ apiKey: openaiApiKey })

  // ---- Optional: summarize any pasted topical context so we don't blow the prompt ----
  const extra = (input.extraContext ?? '').trim()
  // hard cap and normalize whitespace to be safe for the model
  const extraSafe = extra.slice(0, 4000).replace(/\s+/g, ' ').trim()

  let extraFacts = ''
  if (extraSafe) {
    const sum = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You extract neutral, factual notes from pasted text. Return 4–8 concise bullets (each 10–20 words), no advocacy, US spelling.'
        },
        { role: 'user', content: extraSafe }
      ]
    })
    extraFacts = (sum.choices?.[0]?.message?.content ?? '').trim()
  }

  const system = `You are a coach helping Citizens' Climate Lobby advocates draft LTEs.
Follow CCL tone: respectful, appreciative, solution-focused. Avoid doom and snark.
Return compact JSON:
{
  "thesis": string,        // one-sentence core claim
  "bullets": string[],     // 5–8 bullets, 10–24 words each, no duplicates, no "Personal:" prefixes
  "suggestedAsk": string   // single actionable ask if audience is MoC; empty for editor
}`

  const locale = [input.city, input.state].filter(Boolean).join(', ')
  const newsRef = input.articleTitle
    ? `News ref: "${input.articleTitle}"${input.articleDate ? ` (${input.articleDate})` : ''}${input.outlet ? ` in ${input.outlet}` : ''}.`
    : ''

  const cclDoDont = [
    `Brief: ${brief.title}`,
    `Summary: ${brief.summary}`,
    `Do: ${brief.dos.join(' • ')}`,
    `Avoid: ${brief.donts.join(' • ')}`
  ].join('\n')

  // Build user content the model will use to create bullets
  const user = [
    `Topic: ${input.issue}`,
    locale ? `Location: ${locale}` : '',
    newsRef,
    `Audience: ${input.audience === 'moc' ? 'Member of Congress' : 'Newspaper editor'}`,
    `Personal perspective: ${input.personalPerspective}`,
    extraFacts ? `Extra context (summarized):\n${extraFacts}` : '',
    cclDoDont,
    `Word target: ${input.wordLimit}`
  ]
    .filter(Boolean)
    .join('\n')

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  })

  // Basic JSON-parse-with-guard
  let data: any = {}
  try {
    const txt = resp.choices?.[0]?.message?.content ?? '{}'
    data = JSON.parse(txt)
  } catch {
    data = {}
  }

  // Normalize outputs defensively
  const thesis = (data.thesis ?? '').toString().trim()
  const bullets: string[] = Array.isArray(data.bullets) ? data.bullets : []
  const cleaned = dedupeAndCleanBullets(
    [
      // ensure the personal perspective is present first
      input.personalPerspective.trim(),
      ...bullets
    ],
    8 // max bullets after merge
  )

  const suggestedAsk =
    input.audience === 'moc' ? (data.suggestedAsk ?? '').toString().trim() : ''

  return {
    thesis,
    bullets: cleaned,
    suggestedAsk
  }
})

/** remove blank/near-duplicate bullets and strip leading “Personal:” if any */
function dedupeAndCleanBullets(items: string[], max = 8): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of items) {
    const b = (raw ?? '')
      .toString()
      .replace(/^personal:\s*/i, '') // drop “Personal:” prefix if model added it
      .replace(/\s+/g, ' ')
      .trim()

    if (!b) continue
    // cheap near-dup key: lowercase and drop punctuation
    const key = b.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '')
    if (seen.has(key)) continue

    seen.add(key)
    out.push(b)
    if (out.length >= max) break
  }
  return out
}
