export function scoreLTE(input: {
  newsRef?: string
  problem?: string
  solution?: string
  ask?: string
  close?: string
  region?: string
}) {
  // defaults so we never read .length on undefined
  const data = {
    newsRef: input.newsRef ?? '',
    problem: input.problem ?? '',
    solution: input.solution ?? '',
    ask:     input.ask ?? '',
    close:   input.close ?? '',
    region:  input.region ?? ''
  }

  const words = (txt: string) => (String(txt).match(/\b\w+\b/g) || []).length
  const totalWords = words(
    [data.newsRef, data.problem, data.solution, data.ask, data.close].join(' ')
  )

  const items = [
    {
      key: 'newsRef',
      label: 'Reference a recent news item',
      note: 'Name the article and date.',
      pass: /\b(202\d|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(data.newsRef) || data.newsRef.length > 20
    },
    {
      key: 'problem',
      label: 'Relate it to climate without doom',
      note: 'Be specific and local where possible.',
      pass: data.problem.length >= 30
    },
    {
      key: 'solution',
      label: 'Identify a solution',
      note: 'Stick to one idea; avoid a list.',
      pass: data.solution.length >= 30 && !/[;•]/.test(data.solution)
    },
    {
      key: 'ask',
      label: 'Single clear ask',
      note: 'Name the official and action.',
      pass: /(support|cosponsor|oppose|vote|introduce)/i.test(data.ask)
    },
    {
      key: 'close',
      label: 'Close the circle',
      note: 'Tie back to the opening.',
      pass: data.close.length >= 12
    },
    {
      key: 'length',
      label: 'Within 150–250 words',
      note: 'Target ~150–180 words unless outlet differs.',
      pass: totalWords >= 120 && totalWords <= 260
    },
    {
      key: 'tone',
      label: 'Respectful tone',
      note: 'No insults; appreciative where appropriate.',
      pass: !/(idiot|stupid|corrupt|traitor)/i.test(`${data.problem} ${data.solution} ${data.ask}`)
    }
  ]

  const score = Math.min(100, items.filter(i => i.pass).length * 14)
  const suggestions = items.filter(i => !i.pass).map(i => i.note)

  return { score, items, suggestions }
}

export function tightenToWords(text: string, limit: number): string {
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const out: string[] = []
  let used = 0

  for (const p of paras) {
    const words = p.split(/\s+/)
    if (used >= limit) break

    const remaining = limit - used
    if (words.length <= remaining) {
      out.push(words.join(' '))
      used += words.length
    } else {
      out.push(words.slice(0, remaining).join(' '))
      used = limit
      break
    }
  }

  return out.join('\n\n').trim()
}