import { defineStore } from 'pinia'

export const useDraft = defineStore('draft', {
  state: () => ({
    // CCL five-part formula
    newsRef: '',     // 1) Reference a recent news item (title/date)
    problem: '',     // 2) Relate to climate; state the problem without doom
    solution: '',    // 3) Identify a solution (e.g., pricing pollution)
    ask: '',         // 4) Clear call to action for your MoC
    close: '',       // 5) Close the circle — tie back to the opener

    // Other context
    region: '',
    starterAccepted: false
  }),
  getters: {
    fullText(state) {
      return [
        state.newsRef,
        state.problem,
        state.solution,
        state.ask,
        state.close
      ].filter(Boolean).join(' ')
    }
  }
})
