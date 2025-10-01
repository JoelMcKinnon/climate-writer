import { z } from 'zod'
import OpenAI from 'openai'
// Nitro/Vercel-friendly import (matches your working path)
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
  personalPerspective: z.string().min(10),
  extraContext: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const input = Body.parse(await readBody(event))

  const brief = (briefs as any)[input.briefId]
  if (!brief) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown briefId' })
  }

  // ---- OpenAI client ----
  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
  }
  const openai = new OpenAI({ apiKey: openaiApiKey })

  // ---- Optional: summarize pasted topical context (kept compact) ----
  const extraRaw = (input.extraContext ?? '').trim()
  const extraSafe = extraRaw.slice(0, 4000).replace(/\s+/g, ' ').trim()

  let extraFacts = ''
  if (extraSafe) {
    const sum = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You extract neutral, factual notes from pasted text. Return 4–8 concise bullets (each ~10–20 words), no advocacy, US spelling.',
        },
        { role: 'user', content: extraSafe },
      ],
    })
    extraFacts = (sum.choices?.[0]?.message?.content ?? '').trim()
  }

  // ---- Prompt for bullets (ask model NOT to restate personal POV) ----
  const system = `You are a coach helping Citizens' Climate Lobby advocates draft LTEs.
Follow CCL tone: respectful, appreciative, solution-focused. Avoid doom and snark.
Return compact JSON:
{
  "thesis": string,        // one-sentence core claim
  "bullets": string[],     // 5–8 bullets, 10–24 words each, no duplicates, no "Personal:" prefixes, no restating personal anecdote
  "suggestedAsk": string   // if audience is MoC, a single actionable ask; otherwise empty
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

  const user = [
    `Topic: ${input.issue}`,
    locale ? `Location: ${locale}` : '',
    newsRef,
    `Audience: ${input.audience === 'moc' ? 'Member of Congress' : 'Newspaper editor'}`,
    // Make it explicit that this is provided already:
    `Personal perspective (already provided; do NOT rephrase as a bullet): ${input.personalPerspective}`,
    extraFacts ? `Extra context (summarized):\n${extraFacts}` : '',
    cclDoDont,
    `Word target: ${input.wordLimit}`,
  ].filter(Boolean).join('\n')

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  // ---- Parse model JSON safely ----
  let data: any = {}
  try {
    const txt = resp.choices?.[0]?.message?.content ?? '{}'
    data = JSON.parse(txt)
  } catch {
    data = {}
  }

  const thesis = (data.thesis ?? '').toString().trim()
  const modelBullets: string[] = Array.isArray(data.bullets) ? data.bullets : []

  // Merge personal perspective first, then model bullets; then clean/near-dedupe
  const cleaned = dedupeAndCleanBullets(
    [input.personalPerspective, ...modelBullets],
    8
  )

  const suggestedAsk =
    input.audience === 'moc' ? (data.suggestedAsk ?? '').toString().trim() : ''

  return {
    thesis,
    bullets: cleaned,
    suggestedAsk,
  }
})

/**
 * Remove blank/near-duplicate bullets and strip "Personal:" if present.
 * Uses a token-set Jaccard similarity to catch light rephrasings (e.g., model echoing the personal POV).
 */
function dedupeAndCleanBullets(items: string[], max = 8): string[] {
  const out: string[] = []
  const seenKeys: Array<Set<string>> = []

  for (const raw of items) {
    const b = normalizeBullet(raw)
    if (!b) continue

    const tokens = significantTokens(b)
    // skip if too similar to any kept bullet
    if (seenKeys.some((k) => jaccard(tokens, k) >= 0.68)) continue

    seenKeys.push(tokens)
    out.push(b)
    if (out.length >= max) break
  }
  return out
}

function normalizeBullet(s: string): string {
  return (s ?? '')
    .toString()
    .replace(/^personal:\s*/i, '')       // drop "Personal:" prefix
    .replace(/^as (a|an)\s+/i, 'as ')     // minor normalization
    .replace(/\s+/g, ' ')
    .trim()
}

const STOPWORDS = new Set([
  'a','an','and','the','of','in','on','to','for','with','as','i','am','im',"i'm",
  'we','our','us','is','are','be','can','will','that','this','there','it','but',
  'from','by','at','into','about','over','not','only','also'
])

function significantTokens(s: string): Set<string> {
  // letters/numbers only, lowercased
  const base = s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
  const words = base.split(/\s+/).filter(Boolean)
  const sig = words.filter(w => !STOPWORDS.has(w))
  // take first 14 significant tokens to stabilize similarity
  return new Set(sig.slice(0, 14))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return union ? inter / union : 0
}
