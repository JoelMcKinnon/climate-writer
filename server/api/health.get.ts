export default defineEventHandler(() => {
  const key = process.env.OPENAI_API_KEY || ''
  return {
    llmConfigured: Boolean(key),
    // Helpful while debugging—safe to keep; remove later if you prefer:
    keyPreview: key ? key.slice(0, 7) + '…' : ''
  }
})