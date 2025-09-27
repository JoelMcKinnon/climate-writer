<script setup lang="ts">
const loading = ref(false);
const draft = ref("");
async function generate(){
  loading.value = true;
  const { data, error } = await useFetch('/api/generate', { method:'POST', body: {
    issue:{ key:'Custom' }, personalImpact:'', audience:'LTE_Editor', targetLengthWords:170
  }});
  draft.value = error.value ? 'Sorry, failed to generate.' : (data.value?.draft || '');
  loading.value = false;
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-4">
    <h1 class="text-xl font-semibold">Starter draft (last resort)</h1>
    <p class="text-sm text-neutral-600">Use this only when you’re pressed for time. Edit heavily before submitting.</p>
    <button class="px-3 py-2 rounded bg-sky-600 text-white" @click="generate" :disabled="loading">
      {{ loading ? 'Generating…' : 'Generate starter' }}
    </button>
    <pre v-if="draft" class="rounded border bg-white/80 p-3 whitespace-pre-wrap">{{ draft }}</pre>
    <NuxtLink class="underline text-sky-700" to="/">← Back to Coach Mode</NuxtLink>
  </main>
</template>
