<!-- Project card: [media] + chips (kind / External platform / Copy pending) +
     title (↗ when external) + excerpt + Explore CTA. -->
<script setup lang="ts">
import type { WfProject } from '~/composables/useWfContent'

const props = withDefaults(defineProps<{
  project: WfProject
  media?: boolean
  mediaRatio?: string
  chips?: boolean
  excerptLength?: number
}>(), { chips: true, mediaRatio: '3/2', excerptLength: 140 })

const { kindLabel, plain } = useWfContent()

const excerptText = computed(() => {
  const t = plain(props.project.excerpt ?? props.project.description)
  return t.length > props.excerptLength ? t.slice(0, props.excerptLength).trimEnd() + '…' : t
})

const hasChips = computed(() =>
  props.chips && Boolean(kindLabel(props.project.kind) || props.project.external_url || props.project.pending))
</script>

<template>
  <wf-card>
    <template v-if="media" #media>
      <wf-media :src="project.image" :alt="project.heading" :ratio="mediaRatio" />
    </template>
    <template v-if="hasChips" #chips>
      <span v-if="kindLabel(project.kind)" class="wf-chip">{{ kindLabel(project.kind) }}</span>
      <span v-if="project.external_url" class="wf-chip">External platform</span>
      <span v-if="project.pending" class="wf-chip">Copy pending {{ project.pending }}</span>
    </template>
    <h3>{{ project.heading }}<span v-if="project.external_url" aria-hidden="true"> ↗</span></h3>
    <p v-if="excerptText">{{ excerptText }}</p>
    <NuxtLink :to="`/wireframes/projects/${project.slug}`" class="wf-button">Explore {{ project.heading }}</NuxtLink>
  </wf-card>
</template>
