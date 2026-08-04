<!-- THE insights grid: fixed 3 columns of insight cards, used everywhere insights
     are listed (Claudio, Aug 3). Featured cards live in their own 2-col grid above
     this one on the homepage — that grid is intentionally not this component. -->
<script setup lang="ts">
import type { WfInsight } from '~/composables/useWfContent'

defineProps<{
  insights: WfInsight[]
  excerptLength?: number
  extraChips?: (i: WfInsight) => string[] | undefined
}>()
</script>

<template>
  <!-- <ul> group: cards are <li> (inclusive-components card pattern) -->
  <ul class="grid" data-gap="m" style="grid-template-columns: repeat(3, 1fr);">
    <wf-card-insight
      v-for="i in insights" :key="i.slug" :insight="i"
      :excerpt-length="excerptLength" :extra-chips="extraChips?.(i)"
    />
  </ul>
</template>
