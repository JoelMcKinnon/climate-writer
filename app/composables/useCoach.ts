export function scoreLTE(input: {
  newsRef: string
  problem: string
  solution: string
  ask: string
  close: string
  region?: string
}) {
  const words = (txt: string) => (txt.match(/\b\w+\b/g) || []).length
  const totalWords = words(
    [input.newsRef, input.problem, input.solution, input.ask, input.close].join(' ')
  )

  const items = [
    {
      key: 'newsRef',
      label: 'Reference a recent news item',
      note: 'Name the article and date.',
      pass: /\b(202\d|202\d-\d{1,2}|\bMon|\bTue|\bWed|\bThu|\bFri|\bSat|\bSun)/i.test(input.newsRef) || input.newsRef.length > 20
    },
    {
      key: 'problem',
      label: 'Relate it to climate without doom',
      note: 'Be specific and local where possible.',
      pass: input.problem.length >= 30
    },
    {
      key: 'solution',
      label: 'Identify a solution',
      note: 'Stick to one idea; avoid a list.',
      pass: input.solution.length >= 30 && !/[;•]/.test(input.solution)
    },
    {
      key: 'ask',
      label: 'Single clear ask',
      note: 'Name the official and action.',
      pass: /(support|cosponsor|oppose|vote|introduce)/i.test(input.ask)
    },
    {
      key: 'close',
      label: 'Close the circle',
      note: 'Tie back to the opening.',
      pass: input.close.length >= 12
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
      pass: !/(idiot|stupid|corrupt|traitor)/i.test([input.problem,input.solution,input.ask].join(' '))
    }
  ]

  // Simple score: each pass = +14 (cap at 100)
  const score = Math.min(100, items.filter(i => i.pass).length * 14)

  const suggestions = items.filter(i => !i.pass).map(i => i.note)

  return { score, items, suggestions }
}

// Utility you already had:
export function tightenToWords(text: string, maxWords = 180) {
  const tokens = (text || '').trim().split(/\s+/)
  if (tokens.length <= maxWords) return text
  return tokens.slice(0, maxWords).join(' ') + '…'
}
