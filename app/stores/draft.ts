import { defineStore } from 'pinia'

export const useDraft = defineStore('draft', {
  state: () => ({
    // Core intake
    issue: '',
    audience: 'editor' as 'editor' | 'moc',
    briefId: '',
    city: '',
    state: '',
    personal: '',

    // Optional article context
    articleTitle: '',
    articleDate: '',
    outlet: '',

    // Extra context (3 ways)
    extraPaste: '',          // user-pasted notes
    extraUploadText: '',     // text from uploaded file
    extraFetchedText: '',    // text fetched from a URL
    lastUploadName: '',      // UI display only
    lastFetchedUrl: '',      // UI display only

    // Generated outline
    thesis: '',
    bullets: [] as string[],

    // Draft & polish
    draftText: '',
    polishedText: '',
    changeNotes: '',

    // Settings
    wordLimit: 180,
  }),
})
