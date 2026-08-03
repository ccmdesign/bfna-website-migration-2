<!-- Program (focus area) card: name + tagline + Explore CTA. -->
<script setup lang="ts">
defineProps<{
  program: { slug: string, name: string, tagline?: string | null, short?: string | null }
}>()
</script>

<template>
  <wf-card>
    <h3>{{ program.name }}</h3>
    <p v-if="program.tagline">{{ program.tagline }}</p>
    <NuxtLink :to="`/wireframes/${program.slug}`" class="wf-button">Explore {{ program.short ?? program.name }}</NuxtLink>
  </wf-card>
</template>
