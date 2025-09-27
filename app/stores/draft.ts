export const useDraft = defineStore('draft', {
  state: () => ({
    hook: "",
    personal: "",
    body: "",
    ask: "",
    region: { city: "", state: "" },
    starterAccepted: false,
    starterText: ""
  }),
  getters: {
    fullText(s){
      return [s.hook, "", s.personal, "", s.body, "", s.ask, "", "Thank you for considering this letter."].join("\n");
    }
  }
});
