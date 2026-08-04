<!-- Image with wireframe-placeholder fallback; ratio drives both. -->
<script setup lang="ts">
withDefaults(defineProps<{
  src?: string | null
  alt?: string | null
  ratio?: string
}>(), { ratio: '16/9' })
</script>

<template>
  <img v-if="src" :src="src" :alt="alt ?? ''" :style="`aspect-ratio: ${ratio}; width: 100%; object-fit: cover;`">
  <div v-else class="wf-media" :style="`--wf-ratio: ${ratio};`" />
</template>
