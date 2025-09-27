<script setup lang="ts">
import { useDraft } from '~/stores/draft';
import { scoreLTE, tightenToWords } from '~/composables/useCoach';

const d = useDraft();
const words = computed(() => (d.fullText.match(/\b\w+\b/g)?.length) || 0);
const result = computed(() => scoreLTE({
  hook: d.hook, personal: d.personal, body: d.body, ask: d.ask, region: d.region
}));

function copyLetter(){
  navigator.clipboard.writeText(d.fullText);
}
function trimTo(limit:number){ 
  const parts = [d.hook, d.personal, d.body, d.ask];
  const joined = parts.join(" ");
  const trimmed = tightenToWords(joined, limit);
  // naive repartition into body if long: simplest for now
  d.body = trimmed;
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Climate Writer — Coach Mode</h1>
      <p class="text-neutral-600">Write it yourself. Get targeted feedback. Keep it concise and respectful.</p>
    </header>

    <CoachCard :step="1" title="Newsy hook">
      <textarea v-model="d.hook" class="w-full min-h-24 rounded border p-3" aria-label="Hook"></textarea>
      <p class="text-sm text-neutral-600">Name the article or event (and date) you’re responding to.</p>
    </CoachCard>

    <CoachCard :step="2" title="Personal connection (1–2 sentences)">
      <textarea v-model="d.personal" class="w-full min-h-24 rounded border p-3" aria-label="Personal connection"></textarea>
      <p class="text-sm text-neutral-600">Use one concrete detail: cost, health, commute, wildfire smoke, etc.</p>
    </CoachCard>

    <CoachCard :step="3" title="One policy point">
      <textarea v-model="d.body" class="w-full min-h-28 rounded border p-3" aria-label="Policy point"></textarea>
      <p class="text-sm text-neutral-600">Keep a single idea. Save extras for another letter.</p>
    </CoachCard>

    <CoachCard :step="4" title="Single clear ask">
      <input v-model="d.ask" class="w-full rounded border p-3" aria-label="Ask" placeholder="Please support ___ / cosponsor ___ / oppose ___" />
    </CoachCard>

    <section class="rounded-lg border bg-white/80 p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-medium">Coach feedback</h2>
        <div aria-live="polite" class="text-sm">{{ result.score }}/100 • {{ words }} words</div>
      </div>

      <ul class="mt-2 space-y-1">
        <li v-for="i in result.items" :key="i.key" class="text-sm">
          <span :class="i.pass ? 'text-green-700' : 'text-amber-700'">• {{ i.label }}</span>
          <span v-if="!i.pass" class="ml-2 text-neutral-600">{{ i.note }}</span>
        </li>
      </ul>

      <details v-if="result.suggestions.length" class="mt-3">
        <summary class="cursor-pointer text-sm underline">Suggestions</summary>
        <ul class="list-disc pl-5">
          <li v-for="s in result.suggestions" :key="s" class="text-sm">{{ s }}</li>
        </ul>
      </details>

      <div class="mt-3 flex gap-2">
        <button class="px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-700" @click="copyLetter">Copy letter</button>
        <button class="px-3 py-2 rounded border" @click="trimTo(180)">Trim to ~180 words</button>

        <details class="ml-auto">
          <summary class="text-sm text-neutral-600 underline">Pressed for time?</summary>
          <div class="mt-2 text-sm">
            Writing it yourself is stronger. If you still want a starter draft:
            <label class="mt-2 flex items-center gap-2">
              <input type="checkbox" v-model="d.starterAccepted" /> I understand this is a last-resort helper.
            </label>
            <NuxtLink class="inline-block mt-2 px-3 py-2 rounded border" :class="{ 'opacity-50 pointer-events-none': !d.starterAccepted }" to="/starter">
              Generate starter draft
            </NuxtLink>
          </div>
        </details>
      </div>
    </section>
  </main>
</template>
