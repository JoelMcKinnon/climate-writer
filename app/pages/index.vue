<template>
  <div class="grid gap-6 lg:grid-cols-[1fr,360px]">
    <!-- LEFT: 3-step GPT-assisted flow -->
    <div class="space-y-6">
      <!-- STEP A: Intake -->
      <CoachCard :step="1" title="Describe your situation">
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
            <p v-if="!trim(d.personal)" class="mt-1 text-xs text-amber-700">This field is required.</p>
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
          <p class="text-sm">
            <span class="font-medium">Thesis:</span> {{ d.thesis }}
          </p>

          <ul class="list-disc pl-6 text-sm text-slate-800">
            <li v-for="b in mergedBullets" :key="b">{{ b }}</li>
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

const d = useDraft()

// --- Brief options & active brief ---
const briefOptions = Object.entries(briefs).map(([value, b]) => ({ value, label: b.title }))
const activeBrief = computed(() => (d.briefId ? (briefs as any)[d.briefId] : null))

// Bullets merged with required personal perspective (always first)
const mergedBullets = computed(() => {
  const personal = d.personal?.trim() ? [`Personal: ${d.personal.trim()}`] : []
  return [...personal, ...(Array.isArray(d.bullets) ? d.bullets : [])]
})

// --- Step A: Generate bullets ---
const genBusy = ref(false)
const genError = ref('')
const canGenerate = computed(() => !!trim(d.issue) && !!d.briefId && !!trim(d.personal))

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
      personalPerspective: d.personal
    }
    const data = await $fetch('/api/outline', { method: 'POST', body: payload })
    d.thesis = data.thesis || ''
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

  // Personal always first; rest follow as sentences.
  const sentences = mergedBullets.value.map(b => b.replace(/^Personal:\s*/,'').replace(/\.*\s*$/, '.'))
  const middle = sentences.join(' ')
  const close = 'Thank you for considering this perspective.'

  d.draftText = [intro, middle, close].filter(Boolean).join(' ')

  // Populate rubric helpers
  d.newsRef = intro
  d.problem = (d.bullets && d.bullets[0]) ? d.bullets[0] : ''
  d.solution = (d.bullets && d.bullets.slice(1, 3).join(' ')) || ''
  d.close = close
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
