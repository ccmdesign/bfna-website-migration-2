<!-- Homepage hero: prop-based copy, slot for the action buttons (the part that varies). -->
<script setup lang="ts">
defineProps<{
  heading?: string | null
  description?: string | null
}>()
</script>

<template>
  <section class="wf-slot wf-hero" data-label="Hero">
    <div class="center | stack" data-gap="s">
      <h1>{{ heading }}</h1>
      <p v-if="description" data-measure="normal">{{ description }}</p>
      <div v-if="$slots.default" class="cluster" data-gap="s">
        <slot />
      </div>
    </div>
  </section>
</template>
