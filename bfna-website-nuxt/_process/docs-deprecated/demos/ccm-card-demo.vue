<script setup lang="ts">
import documentationHtml from './_docs/ccm-card.html?raw'

if (import.meta.client) {
  definePageMeta({
    layout: 'docs2',
    hero: {
      brow: 'Component demos',
      title: 'Card demos',
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
    <div class="grid">
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
      <ccmCard>
        <h2>Card</h2>
        <p>Card content</p>
      </ccmCard>
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