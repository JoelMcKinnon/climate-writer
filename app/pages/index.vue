<template>
  <div class="grid gap-6 lg:grid-cols-[1fr,360px]">
    <!-- LEFT: 3-step GPT-assisted flow -->
    <div class="space-y-6">
      <!-- STEP A: Intake -->
      <CoachCard :step="1" title="Provide essential context">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700">Issue / topic <span class="text-amber-700">*</span></label>
            <input v-model="d.issue" class="input" placeholder="e.g., Clean energy permitting" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Audience</label>
            <select v-model="d.audience" class="select">
              <option value="editor">Newspaper editor</option>
              <option value="moc">Member of Congress</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">CCL brief <span class="text-amber-700">*</span></label>
            <select v-model="d.briefId" class="select">
              <option disabled value="">Select a brief</option>
              <option v-for="opt in briefOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">City</label>
            <input v-model="d.city" class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">State</label>
            <input v-model="d.state" class="input" />
          </div>

          <!-- Personal perspective required -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700">
              Your personal perspective (1–2 sentences) <span class="text-amber-700">*</span>
            </label>
            <textarea
              v-model="d.personal"
              class="textarea min-h-20"
              placeholder="One concrete detail: cost, health, commute, wildfire smoke, etc."
            ></textarea>
            <p v-if="!hasEnoughPersonal" class="mt-1 text-xs text-amber-700">
              Please add at least {{ minPersonal }} characters (one short sentence is fine).
            </p>
          </div>

        <!-- NEW: Add context (optional) -->
        <div class="mt-4 space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Add context (optional)
            <span class="block text-xs font-normal text-slate-600">
              Paste background notes here, or attach a .txt/.md/.html file, or fetch from a link.
            </span>
          </label>

          <!-- textarea bound to extraContext -->
          <textarea
            v-model="d.extraContext"
            class="textarea min-h-28"
            placeholder="Paste relevant excerpts, facts, quotes, or guidance. (We’ll summarize this for the model.)"
          />

          <!-- file upload -->
          <div class="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".txt,.md,.html,.htm,text/plain,text/markdown,text/html"
              @change="handleFile"
              class="text-sm"
            />
          </div>

          <!-- URL fetch -->
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="urlInput"
              class="input flex-1"
              placeholder="https://example.com/background-article"
            />
            <button class="btn-outline" :disabled="!urlInput || ctxBusy" @click="fetchUrl">
              {{ ctxBusy ? 'Fetching…' : 'Fetch & add' }}
            </button>
          </div>

          <p v-if="ctxError" class="text-sm text-amber-700">{{ ctxError }}</p>
        </div>

          <!-- Optional article context -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700">Article (title) you’re responding to (optional)</label>
            <input v-model="d.articleTitle" class="input" placeholder="e.g., ‘Faster clean power is within reach’" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Article date (optional)</label>
            <input v-model="d.articleDate" class="input" placeholder="e.g., Sept 10, 2025" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Outlet (optional)</label>
            <input v-model="d.outlet" class="input" placeholder="e.g., Bellingham Herald" />
          </div>
        </div>

        <div v-if="activeBrief" class="mt-4 ccl-panel p-4">
          <h4 class="font-semibold text-slate-900">{{ activeBrief.title }}</h4>
          <p class="mt-1 text-sm text-slate-800">{{ activeBrief.summary }}</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs font-semibold text-slate-700">Do</p>
              <ul class="mt-1 list-disc pl-5 text-xs text-slate-800">
                <li v-for="x in activeBrief.dos" :key="x">{{ x }}</li>
              </ul>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-700">Avoid</p>
              <ul class="mt-1 list-disc pl-5 text-xs text-slate-800">
                <li v-for="x in activeBrief.donts" :key="x">{{ x }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="btn-primary" :disabled="!canGenerate" @click="generateBullets">
            Generate bullets
          </button>
          <span v-if="genBusy" class="text-sm text-slate-600">Generating…</span>
          <p v-if="genError" class="text-sm text-amber-700">{{ genError }}</p>
        </div>
      </CoachCard>

      <!-- STEP B: Bullets (read-only list with personal first) -->
      <CoachCard :step="2" title="Bullet ideas">
        <p class="text-sm text-slate-600" v-if="!mergedBullets.length">
          No bullets yet — run “Generate bullets.”
        </p>

        <div v-else class="space-y-3">
          <ul class="list-disc pl-6 text-sm text-slate-800">
            <li v-for="(b, i) in mergedBullets" :key="i">
              {{ b }}
            </li>
          </ul>

          <div class="mt-3">
            <button class="btn-outline" @click="insertOutline">Insert into editor</button>
          </div>
        </div>
      </CoachCard>

      <!-- STEP C: Editor + Polish -->
      <CoachCard :step="3" title="Draft & polish">
        <p class="text-sm text-slate-600">
          Draft your letter. When ready, click <em>Polish &amp; trim</em> to copy-edit and meet your word target.
        </p>

        <textarea v-model="d.draftText" class="textarea min-h-60" placeholder="Start drafting here…"></textarea>

        <div class="mt-3 flex flex-wrap gap-2 items-center">
          <button class="btn-primary" :disabled="!trim(d.draftText)" @click="polish">
            Polish &amp; trim
          </button>
          <button class="btn-outline" :disabled="!finalText" @click="copy(finalText)">Copy final</button>
          <span class="text-sm text-slate-600">Words: {{ wordCount(finalText || d.draftText) }}</span>
          <span v-if="editBusy" class="text-sm text-slate-600">Polishing…</span>
          <p v-if="editError" class="text-sm text-amber-700">{{ editError }}</p>
        </div>

        <div v-if="d.polishedText" class="mt-4">
          <h4 class="font-semibold text-slate-900">Polished draft</h4>
          <div class="mt-2 whitespace-pre-wrap text-sm text-slate-800">{{ d.polishedText }}</div>
          <details v-if="d.changeNotes" class="mt-3">
            <summary class="text-sm link">What changed</summary>
            <ul class="mt-2 list-disc pl-5 text-sm text-slate-700">
              <li v-for="n in noteList" :key="n">{{ n }}</li>
            </ul>
          </details>
        </div>
      </CoachCard>

      <!-- Coach feedback -->
      <section class="ccl-card p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-900">Coach feedback</h3>
          <div role="status" aria-live="polite" class="text-sm text-slate-600">
            {{ result.score }}/100 • {{ wordCount(finalText || d.draftText) }} words
          </div>
        </div>
        <ul class="mt-2 space-y-1">
          <li v-for="i in result.items" :key="i.key" class="text-sm">
            <span :class="i.pass ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'">
              {{ i.label }}
            </span>
            <span v-if="!i.pass" class="text-slate-600"> — {{ i.note }}</span>
          </li>
        </ul>
      </section>
    </div>

    <!-- RIGHT: Guidance -->
    <aside class="ccl-panel p-5 sm:p-6 h-fit">
      <h3 class="text-xl font-bold text-slate-900">CCL guidance for LTEs</h3>
      <h4 class="mt-3 font-semibold text-slate-900">Five-part formula</h4>
      <ol class="mt-2 list-decimal pl-5 text-sm text-slate-800 space-y-1">
        <li>Reference a recent news item (title/date).</li>
        <li>Relate it to climate; state the problem without doom.</li>
        <li>Identify a solution.</li>
        <li>Present a clear call to action.</li>
        <li>Close the circle—tie back to your opener.</li>
      </ol>
      <h4 class="mt-4 font-semibold text-slate-900">Target length</h4>
      <p class="text-sm text-slate-800">Aim for 150–250 words; follow your paper’s limits.</p>
      <h4 class="mt-4 font-semibold text-slate-900">Submission checklist</h4>
      <ul class="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
        <li>Include name, address, and phone for verification.</li>
        <li>Use your paper’s submission page; follow word-count rules.</li>
        <li>Monitor the paper; editors may not notify you.</li>
        <li>Share published LTEs with your CCL liaison; log in Action Tracker.</li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import CoachCard from '~/components/CoachCard.vue'
import { useDraft } from '~/stores/draft'
import { scoreLTE, tightenToWords } from '~/composables/useCoach'
import { computed, ref } from 'vue'
import { briefs } from '@/data/briefs'

const trim = (s?: string | null) => (s ?? '').trim()

type OutlineResp = {
  thesis?: string;
  bullets?: string[];
};

const d = useDraft()

// ------- Context helpers (upload + fetch URL) -------
const ctxBusy = ref(false)
const ctxError = ref('')
const urlInput = ref('')

function handleFile(e: Event) {
  ctxError.value = ''
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Guard: text-like only (keep it simple)
  const ok =
    file.type.startsWith('text/') ||
    /\.md$/i.test(file.name) ||
    /\.txt$/i.test(file.name) ||
    /\.htm(l)?$/i.test(file.name)

  if (!ok) {
    ctxError.value = 'Unsupported file type. Please upload .txt, .md, or .html.'
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    // light cap to avoid huge client payloads; server also caps/summarizes
    const append = text.slice(0, 8000).replace(/\s+/g, ' ').trim()
    d.extraContext = [d.extraContext, append].filter(Boolean).join('\n\n')
    input.value = ''
  }
  reader.onerror = () => {
    ctxError.value = 'Could not read the file.'
  }
  reader.readAsText(file)
}

async function fetchUrl() {
  ctxError.value = ''
  if (!trim(urlInput.value)) return
  ctxBusy.value = true
  try {
    const { text } = await $fetch('/api/fetch-url', {
      method: 'POST',
      body: { url: urlInput.value }
    })
    if (trim(text)) {
      d.extraContext = [d.extraContext, text].filter(Boolean).join('\n\n')
      urlInput.value = ''
    } else {
      ctxError.value = 'No readable text detected at that link.'
    }
  } catch (e: any) {
    ctxError.value = e?.data?.statusMessage || e?.message || 'Failed to fetch the URL.'
  } finally {
    ctxBusy.value = false
  }
}

function dedupeAgainstPersonal(personal: string, bullets: string[]) {
  const norm = (s: string) =>
    (' ' + s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ').trim()

  const p = norm(personal)
  const pWords = new Set(p.split(' ').filter(Boolean))

  return bullets.filter((b) => {
    const nb = norm(b)
    // exact or substring duplication
    if (nb === p || nb.includes(p) || p.includes(nb)) return false

    // simple word-overlap similarity to catch near-dupes
    const bWords = nb.split(' ').filter(Boolean)
    const overlap = bWords.filter((w) => pWords.has(w)).length
    const ratio = overlap / Math.max(pWords.size, bWords.length)
    return ratio < 0.6
  })
}


// --- Brief options & active brief ---
const briefOptions = Object.entries(briefs).map(([value, b]) => ({ value, label: b.title }))
const activeBrief = computed(() => (d.briefId ? (briefs as any)[d.briefId] : null))

/** -------- De-dupe helpers (personal vs model bullets) -------- **/
const STOP = new Set([
  'a','an','the','and','or','but','to','of','in','on','for','with','as','by','at','from',
  'that','this','it','is','are','was','were','be','being','been','we','i','you','they','our',
  'us','your','their'
])

function normWords(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP.has(w))
}

function jaccard(a: string, b: string) {
  const A = new Set(normWords(a))
  const B = new Set(normWords(b))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

function sameLead(a: string, b: string, n = 5) {
  const wa = a.trim().toLowerCase().split(/\s+/).slice(0, n).join(' ')
  const wb = b.trim().toLowerCase().split(/\s+/).slice(0, n).join(' ')
  return wa && wb && wa === wb
}

/** Bullets merged with personal first, removing near-duplicates */
const mergedBullets = computed(() => {
  const personal = trim(d.personal)
  const base = Array.isArray(d.bullets) ? d.bullets : []

  // If no personal note yet, just show model bullets.
  if (!personal) return base

  const filtered = base.filter(b => {
    const s = trim(b)
    if (!s) return false
    // drop if it's basically the same as the personal note
    if (sameLead(s, personal, 5)) return false
    if (jaccard(s, personal) >= 0.55) return false
    return true
  })

  // Put personal first; remove any trailing period cleanup for consistency.
  const personalClean = personal.replace(/^\s*personal:\s*/i, '')
  return [personalClean, ...filtered]
})
/** -------------------------------------------------------------- **/

// --- Step A: Generate bullets ---
const genBusy = ref(false)
const genError = ref('')

const minPersonal = 10
const hasEnoughPersonal = computed(() => trim(d.personal).length >= minPersonal)

const canGenerate = computed(() =>
  !!trim(d.issue) && !!d.briefId && hasEnoughPersonal.value
)

async function generateBullets() {
  genError.value = ''
  genBusy.value = true
  try {
    const payload = {
      issue: d.issue,
      briefId: d.briefId,
      city: d.city,
      state: d.state,
      audience: d.audience,
      articleTitle: d.articleTitle,
      articleDate: d.articleDate,
      outlet: d.outlet, 
      wordLimit: d.wordLimit || 180,
      personalPerspective: String(d.personal ?? ''),
      extraContext: d.extraContext || ''
    }
    const data = await $fetch('/api/outline', { method: 'POST', body: payload })
    d.bullets = Array.isArray(data.bullets) ? data.bullets : []
  } catch (e: any) {
    genError.value = e?.data?.statusMessage || e?.message || 'Failed to generate.'
  } finally {
    genBusy.value = false
  }
}

// --- Step B: Insert outline into editor ---
function insertOutline() {
  if (!mergedBullets.value.length) return

  const intro = d.articleTitle
    ? `Regarding "${d.articleTitle}"${d.articleDate ? ` (${d.articleDate})` : ''}${d.outlet ? ` in ${d.outlet}` : ''}:`
    : `In ${[d.city, d.state].filter(Boolean).join(', ') || 'our community'},`

  // Personal always first; turn each bullet into a clean sentence
  const sentences = mergedBullets.value
    .map(b => b.replace(/^Personal:\s*/, '').replace(/\.*\s*$/, '.'))

  const middle = sentences.join(' ')

  // Only intro + bullet sentences (no close)
  d.draftText = [intro, middle].filter(Boolean).join(' ')

  // Update rubric helpers (no explicit close)
  d.newsRef  = intro
  d.problem  = (d.bullets && d.bullets[0]) ? d.bullets[0] : ''
  d.solution = (d.bullets && d.bullets.slice(1, 3).join(' ')) || ''
  d.close    = '' // keep empty so coach doesn’t invent one
}

// --- Step C: Polish & trim ---
const editBusy = ref(false)
const editError = ref('')

async function polish() {
  editError.value = ''
  editBusy.value = true
  try {
    const data = await $fetch('/api/edit', {
      method: 'POST',
      body: { draft: d.draftText, wordLimit: d.wordLimit || 180 }
    })
    d.polishedText = tightenToWords(data.polished || '', d.wordLimit || 180)
    d.changeNotes = Array.isArray(data.notes) ? data.notes.join('\n') : ''
  } catch (e: any) {
    editError.value = e?.data?.statusMessage || e?.message || 'Failed to polish.'
  } finally {
    editBusy.value = false
  }
}

// --- Coach feedback & helpers ---
const result = computed(() =>
  scoreLTE({
    newsRef: d.newsRef || '',
    problem: d.problem || '',
    solution: d.solution || '',
    ask: '',           // ask removed in this flow
    close: d.close || '',
    region: d.region || ''
  })
)

const finalText = computed(() => d.polishedText || d.draftText || '')
const noteList = computed(() => (d.changeNotes ? d.changeNotes.split('\n').filter(Boolean) : []))

function wordCount(t: string) {
  return (t.match(/\b\w+\b/g)?.length) || 0
}

function copy(t: string) {
  navigator.clipboard.writeText(t)
}
</script>
