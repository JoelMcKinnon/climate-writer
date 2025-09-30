import { defineStore } from 'pinia'

export const useDraft = defineStore('draft', {
  state: () => ({
    issue: '',
    audience: 'editor' as 'editor' | 'moc',
    briefId: '',
    city: '',
    state: '',
    personal: '',
    draftText: '',
    articleTitle: '',
    articleDate: '',
    outlet: '',

    bullets: [] as string[],
    // Remove selection/ask fields
    // selectedBullets: [] as string[],
    // ask: '',
    wordLimit: 180,
  }),
})
