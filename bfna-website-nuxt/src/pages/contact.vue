<script setup lang="ts">
/**
 * `/contact` — how to reach the foundation.
 *
 * The about page keeps the message form at `#contact`. This route is the
 * standalone URL. The form is not repeated here: it does not submit, and a
 * second form would say otherwise.
 *
 * Layout comes from `definePageMeta` only. The template is not wrapped again.
 */
import { CONTACT_LEAD, CONTACT_SECTIONS } from '~/utils/trust-copy'

defineOptions({ name: 'ContactPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: 'Contact' })
useBfPageSeo(() => ({
  title: 'Contact',
  description: CONTACT_LEAD
}))
</script>

<template>
  <bfPageHeader
    label="Contact"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Contact' }]"
    heading="Contact"
    :tagline="CONTACT_LEAD"
  />

  <bfSection
    v-for="section in CONTACT_SECTIONS"
    :key="section.heading"
    :label="section.heading"
    :heading="section.heading"
  >
    <p v-for="(para, i) in section.paragraphs" :key="i">{{ para }}</p>
  </bfSection>

  <bfSection label="Next" heading="On this site">
    <p><a href="mailto:info@bfna.org">info@bfna.org</a></p>
    <p><NuxtLink to="/about#contact">Message form on the about page</NuxtLink></p>
    <p><NuxtLink to="/privacy">Privacy</NuxtLink></p>
  </bfSection>
</template>
