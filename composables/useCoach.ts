export type RubricKey = "hook"|"personal"|"policy"|"ask"|"length"|"local"|"tone";
export interface RubricItem { key: RubricKey; label: string; pass: boolean; note?: string; weight: number; }
export interface CoachResult { score: number; items: RubricItem[]; suggestions: string[]; }

function wordCount(s: string){ return (s.match(/\b\w+\b/g) || []).length; }

export function scoreLTE(input: {
  hook: string; personal: string; body: string; ask: string; region?: { city?: string; state?: string };
}) : CoachResult {
  const items: RubricItem[] = [];
  const suggestions: string[] = [];

  const len = wordCount([input.hook, input.personal, input.body, input.ask].join(" "));
  const hasHook = !!input.hook && /(?:today|this|recent|editorial|op\-ed|report|article|Aug|Sep|Oct|Nov|Dec|\d{4})/i.test(input.hook);
  items.push({ key:"hook", label:"Newsy hook", pass:hasHook, note: hasHook?"":"Name the article/date/event.", weight:0.2 });
  if(!hasHook) suggestions.push("Open with the article title or date so editors know what you’re referencing.");

  const hasPersonal = wordCount(input.personal) >= 10 && input.personal.length <= 350;
  items.push({ key:"personal", label:"Personal connection", pass:hasPersonal, note: hasPersonal?"":"Use 1–2 concrete details.", weight:0.2 });
  if(!hasPersonal) suggestions.push("Add a concrete detail (bill amount, child’s asthma episode, commute, etc.).");

  const oneIdea = !/[;]|(?:\b(and|also|plus)\b.*\b(and|also|plus)\b)/i.test(input.body);
  items.push({ key:"policy", label:"One policy point", pass:oneIdea, note: oneIdea?"":"Keep one policy idea.", weight:0.2 });
  if(!oneIdea) suggestions.push("Cut to one policy idea; save extras for a future letter.");

  const clearAsk = /\b(support|pass|vote|cosponsor|oppose|fund|prioritize)\b/i.test(input.ask);
  items.push({ key:"ask", label:"Single clear ask", pass:clearAsk, note: clearAsk?"":"Name the official and action.", weight:0.2 });
  if(!clearAsk) suggestions.push("Name the decision-maker and a single action (e.g., “Please support ___”).");

  const withinLen = len >= 120 && len <= 200;
  items.push({ key:"length", label:"Within 120–200 words", pass:withinLen, note: withinLen?"":"Target ~150–180 words.", weight:0.1 });
  if(!withinLen) suggestions.push("Trim to ~170 words; remove filler, combine short sentences.");

  const local = !!(input.region?.city || input.region?.state) &&
                new RegExp(`\\b(${[input.region?.city, input.region?.state].filter(Boolean).join("|")})\\b`, "i").test([input.hook,input.personal,input.body].join(" "));
  items.push({ key:"local", label:"Local relevance", pass:local, note: local?"":"Name your city/state or outlet.", weight:0.05 });
  if(!local) suggestions.push("Name your city, neighborhood, or a local landmark/organization.");

  const civilTone = !/\b(dumb|idiot|corrupt|liar|disgusting|hate)\b/i.test([input.hook,input.body].join(" "));
  items.push({ key:"tone", label:"Respectful tone", pass:civilTone, note: civilTone?"":"Rephrase blamey language.", weight:0.05 });
  if(!civilTone) suggestions.push("Swap blamey words for respectful phrasing; it increases publish chances.");

  const score = Math.round(items.reduce((s,i)=> s + (i.pass ? i.weight : 0), 0) * 100);
  return { score, items, suggestions };
}

export function tightenToWords(text: string, target=180){
  const words = text.split(/\s+/);
  if(words.length <= target) return text;
  return words.slice(0, target).join(" ") + "…";
}
