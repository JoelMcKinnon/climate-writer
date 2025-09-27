<template>
  <section class="rounded-lg border bg-white/80 p-4 shadow-sm">
    <header class="mb-2 flex items-center gap-2">
      <span class="inline-flex size-6 items-center justify-center rounded-full bg-sky-600 text-white text-sm">{{ step }}</span>
      <h2 class="font-medium">{{ title }}</h2>
    </header>
    <div class="space-y-2"><slot /></div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ step: number; title: string }>()
</script>
