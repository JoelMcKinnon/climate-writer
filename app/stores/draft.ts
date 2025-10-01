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
    wordLimit: 180,
    extraContext: ''
  }),
})
