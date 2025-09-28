// app/stores/draft.ts
import { defineStore } from 'pinia'

export const useDraft = defineStore('draft', {
  state: () => ({
    // Step 1: intake
    issue: '', audience: 'editor' as 'editor'|'moc',
    city: '', state: '', zip: '', outlet: '', wordLimit: 180,
    articleTitle: '', articleDate: '', articleUrl: '',
    personal: '',              // user's personal perspective (1–2 sentences)
    includePersonal: true,     // whether to include it in the outline/draft

    // Step 2: selected CCL brief id
    briefId: '',

    // Step 3: outline from LLM
    thesis: '', bullets: [] as string[], selectedBullets: [] as string[],

    // Step 4: draft + polished
    draftText: '', polishedText: '', changeNotes: '' // short bullet summary of edits
  }),
  getters: {
    location(state) { return [state.city, state.state].filter(Boolean).join(', ') },
    finalText(state) { return state.polishedText || state.draftText }
  }
})
