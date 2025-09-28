// app/data/briefs.ts
export const briefs = {
  'carbon-pricing': {
    title: 'Pricing Pollution',
    summary: 'Price carbon economy-wide and return revenue to households to cut emissions efficiently.',
    dos: [
      'Be respectful and solution-focused',
      'Reference local economy/health/air benefits'
    ],
    donts: [
      'No doom or personal attacks',
      'Avoid long lists of policies'
    ],
    keyPoints: [
      'Market signal reduces emissions at lowest cost',
      'Dividends can protect low- and middle-income families',
      'Predictable price drives clean investment'
    ]
  },
  'permitting': {
    title: 'Clean Energy Permitting Reform',
    summary: 'Speed clean projects and transmission while maintaining strong environmental protections.',
    dos: ['Emphasize faster build-out of clean energy', 'Mention transmission & community input'],
    donts: ['Don’t frame as deregulation for fossil expansion'],
    keyPoints: [
      'Modernize reviews to cut delays',
      'Prioritize big grid projects',
      'Pair speed with community benefits'
    ]
  },
  'building-electrification': {
    title: 'Building Electrification & Efficiency',
    summary: 'Cut bills and pollution with heat pumps, induction, and efficiency upgrades.',
    dos: ['Highlight comfort, savings, health'], donts: ['Avoid tech shaming'],
    keyPoints: [
      'Heat pumps work in cold climates',
      'Incentives lower upfront costs',
      'Efficiency first reduces load'
    ]
  },
  'healthy-forests': {
    title: 'Healthy Forests',
    summary: 'Improve forest health and resilience while storing carbon and protecting communities.',
    dos: ['Talk wildfire risk, local stewardship'], donts: ['Avoid overselling carbon alone'],
    keyPoints: [
      'Proactive thinning & prescribed fire',
      'Support restoration & rural jobs',
      'Guard old growth and biodiversity'
    ]
  }
} as const;
