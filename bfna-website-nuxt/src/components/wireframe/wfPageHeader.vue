<!-- Hero-headings unit for inner pages: breadcrumb + chips + h1 + tagline + by-line.
     Chips accept strings via `chips` or rich content via the chips slot; the
     default slot holds by-lines, meta rows, or header actions. -->
<script setup lang="ts">
import type { WfCrumb } from './wfBreadcrumb.vue'

const props = withDefaults(defineProps<{
  label?: string
  crumbs?: WfCrumb[]
  chips?: (string | null)[]
  heading?: string | null
  tagline?: string | string[] | null
}>(), { label: 'Page header' })

const chipList = computed(() => (props.chips ?? []).filter((c): c is string => !!c))
const taglines = computed(() =>
  Array.isArray(props.tagline) ? props.tagline : props.tagline ? [props.tagline] : [])
</script>

<template>
  <wf-section :label="label" gap="s" padded>
    <wf-breadcrumb v-if="crumbs?.length" :items="crumbs" />
    <div v-if="chipList.length || $slots.chips" class="cluster" data-gap="xs">
      <wf-chip v-for="c in chipList" :key="c">{{ c }}</wf-chip>
      <slot name="chips" />
    </div>
    <h1>{{ heading }}</h1>
    <p v-for="p in taglines" :key="p.slice(0, 20)" data-measure="normal">{{ p }}</p>
    <slot />
  </wf-section>
</template>
