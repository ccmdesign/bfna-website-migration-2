<!-- Featured/highlight card: media 16/9 + Featured chip + title + excerpt + View link. -->
<script setup lang="ts">
import type { WfInsight } from '~/composables/useWfContent'

defineProps<{ item: WfInsight }>()

const { plain } = useWfContent()
</script>

<template>
  <wf-card>
    <template #media>
      <wf-media :src="item.image" :alt="item.heading ?? ''" ratio="16/9" />
    </template>
    <template #chips>
      <span class="wf-chip">Featured</span>
    </template>
    <h3>{{ item.heading }}</h3>
    <p v-if="plain(item.excerpt)">{{ plain(item.excerpt) }}</p>
    <a href="#" :data-external="item.external_url ? true : undefined">View</a>
  </wf-card>
</template>
