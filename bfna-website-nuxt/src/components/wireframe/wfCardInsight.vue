<!-- Insight card: format chip [+ extras] [+ Archive] + linked title [+ excerpt]
     + date. Heading first in source, link stretched over the card. -->
<script setup lang="ts">
import type { WfInsight } from '~/composables/useWfContent'

const props = withDefaults(defineProps<{
  insight: WfInsight
  extraChips?: string[]
  excerpt?: boolean   // on by default — insight cards show excerpts everywhere (Claudio, Aug 3)
  excerptLength?: number
}>(), { excerpt: true, excerptLength: 140 })

const { formatLabel, monthYear, plain } = useWfContent()

const excerptText = computed(() => {
  const t = plain(props.insight.excerpt)
  return t.length > props.excerptLength ? t.slice(0, props.excerptLength).trimEnd() + '…' : t
})
</script>

<template>
  <wf-card>
    <h3><NuxtLink :to="`/wireframes/insights/${insight.slug}`">{{ insight.heading }}</NuxtLink></h3>
    <p v-if="excerpt && excerptText">{{ excerptText }}</p>
    <time>{{ monthYear(insight.publish_date) }}</time>
    <template #chips>
      <span class="wf-chip">{{ formatLabel(insight.format) }}</span>
      <span v-for="c in extraChips" :key="c" class="wf-chip">{{ c }}</span>
      <span v-if="insight.archived" class="wf-chip">Archive</span>
    </template>
  </wf-card>
</template>
