// server/api/outline.post.ts
import { z } from 'zod'
import OpenAI from 'openai'
import { briefs } from '../../app/data/briefs'

/**
 * Incoming payload
 */
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

  // ---- Brief lookup ---------------------------------------------------------
  const brief = (briefs as any)[input.briefId]
  if (!brief) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown briefId' })
  }

  // ---- OpenAI client ---------------------------------------------------------
  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'LLM unavailable: server is not configured.' })
  }
  const openai = new OpenAI({ apiKey: openaiApiKey })

  // ---- Optional: summarize long pasted/link-fetched context ------------------
  const extra = (input.extraContext ?? '').trim()
  const extraSafe = extra.slice(0, 4000).replace(/\s+/g, ' ').trim() // guard tokens

  let extraFacts = ''
  if (extraSafe) {
    const sum = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'Extract neutral, factual notes from the user text. Return 4–8 concise bullets (10–20 words each). No advocacy; US spelling.',
        },
        { role: 'user', content: extraSafe },
      ],
    })
    extraFacts = (sum.choices?.[0]?.message?.content ?? '').trim()
  }

  // ---- Prompting for bullets -------------------------------------------------
  const locale = [input.city, input.state].filter(Boolean).join(', ')
  const newsRef = input.articleTitle
    ? `News ref: "${input.articleTitle}"${input.articleDate ? ` (${input.articleDate})` : ''}${input.outlet ? ` in ${input.outlet}` : ''}.`
    : ''

  const cclDoDont = [
    `Brief: ${brief.title}`,
    `Summary: ${brief.summary}`,
    `Do: ${brief.dos.join(' • ')}`,
    `Avoid: ${brief.donts.join(' • ')}`,
  ].join('\n')

  const system = `You are coaching Citizens' Climate Lobby volunteers writing letters to the editor.
Follow CCL tone: respectful, appreciative, constructive, and solution-focused. Avoid doom, snark, and absolutist language.

Return compact JSON with these keys only:
{
  "thesis": string,      // one-sentence core claim
  "bullets": string[],   // 5–8 bullets, 10–24 words each, locally relevant where possible
  "suggestedAsk": string // actionable ask if audience is MoC; otherwise empty
}

Hard rules:
• Do NOT copy or restate the user's personal perspective as a bullet; add NEW, distinct points instead.
• No “Personal:” prefixes, no rhetorical questions, no quotes, no emojis.
• Prefer variety: problem, evidence, solution, local benefit, cost/health/economy angle, and civility.
• If a news reference is provided, include exactly ONE neutral bullet that ties to it (title/date only).
• Eliminate duplicate or near-duplicate ideas.`

  const user = [
    `Topic: ${input.issue}`,
    locale ? `Location: ${locale}` : '',
    newsRef,
    `Audience: ${input.audience === 'moc' ? 'Member of Congress' : 'Newspaper editor'}`,
    `Personal perspective (do NOT restate as a bullet): ${input.personalPerspective}`,
    extraFacts ? `Extra context (summarized bullets):\n${extraFacts}` : '',
    cclDoDont,
    `Word target: ${input.wordLimit}`,
  ]
    .filter(Boolean)
    .join('\n')

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  // ---- Parse model JSON safely ----------------------------------------------
  let data: any = {}
  try {
    const txt = resp.choices?.[0]?.message?.content ?? '{}'
    data = JSON.parse(txt)
  } catch {
    data = {}
  }

  const thesis = (data.thesis ?? '').toString().trim()
  const modelBullets: string[] = Array.isArray(data.bullets) ? data.bullets : []

  // ---- Merge + de-dupe -------------------------------------------------------
  const cleaned = dedupeAndCleanBullets({
    personal: input.personalPerspective,
    modelBullets,
    max: 8,
  })

  const suggestedAsk =
    input.audience === 'moc' ? (data.suggestedAsk ?? '').toString().trim() : ''

  return { thesis, bullets: cleaned, suggestedAsk }
})

/**
 * Utilities: light semantic de-dupe so a paraphrase of the personal perspective
 * (or another bullet) is filtered out. Jaccard over word sets + normalized keys.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toWordSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const w of a) if (b.has(w)) inter++
  const union = a.size + b.size - inter
  return union ? inter / union : 0
}

function tooSimilar(a: string, b: string): boolean {
  const sim = jaccard(toWordSet(a), toWordSet(b))
  return sim >= 0.68 // tuned to catch “as a professional driver…” paraphrases
}

/**
 * Remove blank / prefix / near-duplicate bullets; ensure the user's personal perspective
 * is NOT injected as a bullet — instead we only use it to filter similar model bullets.
 */
function dedupeAndCleanBullets(opts: {
  personal: string
  modelBullets: string[]
  max?: number
}): string[] {
  const { personal, modelBullets, max = 8 } = opts
  const out: string[] = []
  const seenKeys = new Set<string>()
  const personalText = (personal ?? '').trim()

  for (const raw of modelBullets) {
    let b = (raw ?? '').toString().replace(/^personal:\s*/i, '').trim()
    if (!b) continue

    // skip if near-duplicate of personal perspective
    if (personalText && tooSimilar(b, personalText)) continue

    // collapse whitespace & make a coarse key for exact/near-exact dupes
    b = b.replace(/\s+/g, ' ')
    const key = normalize(b)
    if (!key) continue
    if (seenKeys.has(key)) continue

    // avoid near-duplicates within the growing list
    if (out.some((x) => tooSimilar(x, b))) continue

    seenKeys.add(key)
    out.push(b)
    if (out.length >= max) break
  }

  return out
}
