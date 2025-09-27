<!-- app/pages/index.vue -->
<script setup lang="ts">
import CoachCard from '~/components/CoachCard.vue'
import { useDraft } from '~/stores/draft'
import { scoreLTE, tightenToWords } from '~/composables/useCoach'
import { computed } from 'vue'

const d = useDraft()

// TEMP migration if you had older fields; remove later
// @ts-ignore
if ((d as any).hook && !d.newsRef) d.newsRef = (d as any).hook
// @ts-ignore
if ((d as any).personal && !d.problem) d.problem = (d as any).personal
// @ts-ignore
if ((d as any).body && !d.solution) d.solution = (d as any).body

const words = computed(() => (d.fullText.match(/\b\w+\b/g)?.length) || 0)
const result = computed(() => scoreLTE({
  newsRef: d.newsRef,
  problem: d.problem,
  solution: d.solution,
  ask: d.ask,
  close: d.close,
  region: d.region
}))

function copyLetter(){ navigator.clipboard.writeText(d.fullText) }
function trimTo(n:number){
  d.close = '' // prefer trimming from close first
  const parts = [d.newsRef, d.problem, d.solution, d.ask, d.close].join(' ')
  const trimmed = tightenToWords(parts, n)
  // naive split back (keeps order intact)
  const segs = trimmed.split(/(?<=\.)\s+/)
  ;[d.newsRef, d.problem, d.solution, d.ask, d.close] = [
    segs[0]||'', segs[1]||'', segs[2]||'', segs[3]||'', segs.slice(4).join(' ')
  ]
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr,360px]">
    <div class="space-y-6">
      <CoachCard :step="1" title="Reference a recent news item (title/date)">
        <textarea v-model="d.newsRef" class="textarea min-h-24" aria-label="News reference"></textarea>
        <p class="text-sm text-slate-600">Name the article or event and its date; keep it timely.</p>
      </CoachCard>

      <CoachCard :step="2" title="Relate it to climate (state the problem)">
        <textarea v-model="d.problem" class="textarea min-h-28" aria-label="Problem"></textarea>
        <p class="text-sm text-slate-600">Add one concrete detail (cost, health, commute, smoke, etc.); avoid doom or hot-button framing.</p>
      </CoachCard>

      <CoachCard :step="3" title="Identify one solution">
        <textarea v-model="d.solution" class="textarea min-h-28" aria-label="Solution"></textarea>
        <p class="text-sm text-slate-600">Stick to one idea (e.g., pricing pollution, efficiency, permitting) and stay specific.</p>
      </CoachCard>

      <CoachCard :step="4" title="Single clear ask">
        <input v-model="d.ask" class="input" aria-label="Ask"
               placeholder="Please support ___ / cosponsor ___ / oppose ___" />
        <p class="text-sm text-slate-600">Name the official and the action you want.</p>
      </CoachCard>

      <CoachCard :step="5" title="Close the circle">
        <textarea v-model="d.close" class="textarea min-h-20" aria-label="Close"></textarea>
        <p class="text-sm text-slate-600">Tie back to your opening or local relevance; appreciative, respectful tone.</p>
      </CoachCard>

      <!-- Feedback card (unchanged except bindings) -->
      <section class="ccl-card p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-900">Coach feedback</h3>
          <div role="status" aria-live="polite" class="text-sm text-slate-600">
            {{ result.score }}/100 • {{ words }} words
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

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="btn-primary" @click="copyLetter">Copy letter</button>
          <button class="btn-outline" @click="trimTo(180)">Trim to ~180 words</button>
        </div>
      </section>
    </div>

    <!-- Right guidance panel you already have can remain; titles now match the 5-step flow -->
    <aside class="ccl-panel p-5 sm:p-6 h-fit">
      <h3 class="text-xl font-bold text-slate-900">CCL guidance for LTEs</h3>
      <h4 class="mt-3 font-semibold text-slate-900">Five-part formula</h4>
      <ol class="mt-2 list-decimal pl-5 text-sm text-slate-800 space-y-1">
        <li>Reference a recent news item (title/date).</li>
        <li>Relate it to climate; state the problem without doom.</li>
        <li>Identify a solution.</li>
        <li>Present a clear call to action for your member of Congress.</li>
        <li>Close the circle—tie back to your opener.</li>
      </ol>
      <h4 class="mt-4 font-semibold text-slate-900">Target length</h4>
      <p class="text-sm text-slate-800">Aim for 150–250 words; follow your paper’s limits.</p>
    </aside>
  </div>
</template>
