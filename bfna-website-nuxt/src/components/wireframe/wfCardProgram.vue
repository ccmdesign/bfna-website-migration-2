<!-- Program (focus area) card: linked name + tagline. Heading link stretched
     over the card — no "Explore" CTA per the inclusive-components pattern. -->
<script setup lang="ts">
defineProps<{
  program: { slug: string, name: string, tagline?: string | null, short?: string | null }
}>()
</script>

<template>
  <wf-card>
    <h3><NuxtLink :to="`/wireframes/${program.slug}`">{{ program.name }}</NuxtLink></h3>
    <p v-if="program.tagline">{{ program.tagline }}</p>
  </wf-card>
</template>
