<script setup lang="ts">
import documentationHtml from './_docs/ccm-chip.html?raw'

if (import.meta.client) {
  definePageMeta({
    layout: 'docs2',
    hero: {
      brow: 'Component demos',
      title: 'Chip demos',
      tagline: 'Interactive coverage of the component API',
      size: 'l'
    }
  })
}

const documentationFragment = documentationHtml
</script>

<template>
  <ccmSection>
    <h2>Variants</h2>
    <div class="cluster">
      <ccmChip label="Chip" color="primary" />
      <ccmChip label="Chip" variant="outlined" />
      <ccmChip label="Chip" variant="minimal" />
    </div>
  </ccmSection>
  <ccmSection>
    <h2>Colors</h2>
    <div class="cluster">
      <ccmChip label="Chip" color="primary" />
      <ccmChip label="Chip" color="secondary" />
      <ccmChip label="Chip" color="success" />
      <ccmChip label="Chip" color="warning" />
      <ccmChip label="Chip" color="error" />
      <ccmChip label="Chip" color="info" />
    </div>
  </ccmSection>
  <ccmSection>
    <h2>Sizes</h2>
    <div class="cluster">
      <ccmChip size="xs" label="Chip" color="primary" />
      <ccmChip size="s" label="Chip" color="secondary" />
      <ccmChip size="m" label="Chip" color="success" />
    </div>
  </ccmSection>
  <ccmSection>
    <div class="stack">
      <h2>Documentation</h2>
      <div v-html="documentationFragment" />
    </div>
  </ccmSection>
</template>

<style lang="css" scoped>

</style>