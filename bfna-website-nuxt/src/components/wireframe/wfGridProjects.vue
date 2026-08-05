<!-- THE projects grid: fixed 2 columns of project cards — the same grid on the
     program pages and the all-projects index (Claudio, Aug 5), so the two views
     can't drift apart in layout. -->
<script setup lang="ts">
import type { WfProject } from '~/composables/useWfContent'

defineProps<{
  projects: WfProject[]
  excerptLength?: number
}>()
</script>

<template>
  <!-- <ul> group: cards are <li> (inclusive-components card pattern) -->
  <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
    <wf-card-project
      v-for="p in projects" :key="p.slug" :project="p"
      :excerpt-length="excerptLength"
    />
  </ul>
</template>
