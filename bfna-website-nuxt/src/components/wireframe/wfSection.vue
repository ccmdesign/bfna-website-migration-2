<!-- Full-bleed wireframe band. Slot-based: heading/gap/layout are conveniences,
     everything else (grids, prose, forms, rich h2s) goes in the default slot. -->
<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  heading?: string
  gap?: string
  layout?: 'stack' | 'switcher' | 'cluster' | 'plain'
  measure?: string
  padded?: boolean
}>(), { gap: 'm', layout: 'stack' })
</script>

<template>
  <section class="wf-slot" :data-label="label">
    <div
      :class="layout === 'plain' ? 'center' : `center | ${layout}`"
      :data-gap="layout === 'plain' ? undefined : gap"
      :data-measure="measure"
      :style="padded ? 'padding-block: var(--space-l);' : undefined"
    >
      <h2 v-if="heading">{{ heading }}</h2>
      <slot />
    </div>
  </section>
</template>
