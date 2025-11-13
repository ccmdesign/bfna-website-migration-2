<template>
  <div>
    <LegacyOrganismsFrame />

    <section class="main-content">
      <slot />
    </section>

    <LegacyOrganismsFooter />
  </div>
</template>

<script setup lang="ts">
import LegacyOrganismsFrame from '~/components/legacy/organisms/Frame.vue'
import LegacyOrganismsFooter from '~/components/legacy/organisms/Footer.vue'

// Common head/meta elements for base layout
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ]
})

// TODO: Prepare for future design system integration
// This layout structure will be extended when design system is integrated
// Placeholder for design system components and utilities
</script>

