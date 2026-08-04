<!-- Featured/highlight card: media 16/9 + Featured chip + linked title + excerpt.
     Heading carries the link (stretched) — the old href="#" "View" link had no
     accessible name worth announcing. -->
<script setup lang="ts">
import type { WfInsight } from '~/composables/useWfContent'

defineProps<{ item: WfInsight }>()

const { plain } = useWfContent()
</script>

<template>
  <wf-card>
    <h3><NuxtLink :to="`/wireframes/insights/${item.slug}`">{{ item.heading }}</NuxtLink></h3>
    <p v-if="plain(item.excerpt)">{{ plain(item.excerpt) }}</p>
    <template #chips>
      <span class="wf-chip">Featured</span>
    </template>
    <template #media>
      <wf-media :src="item.image" alt="" ratio="16/9" />
    </template>
  </wf-card>
</template>
