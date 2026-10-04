<script setup lang="ts">
/**
 * `/privacy` — what this website does with information.
 *
 * `definePageMeta` is the only layout hook. The template is not wrapped in a
 * second layout component, which would mount the shell twice.
 *
 * Owner questions live in `src/utils/trust-copy.ts`. Nothing in the template is a placeholder.
 */
import { PRIVACY_LEAD, PRIVACY_SECTIONS } from '~/utils/trust-copy'

defineOptions({ name: 'PrivacyPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: 'Privacy' })
useBfPageSeo(() => ({
  title: 'Privacy',
  description: PRIVACY_LEAD
}))
</script>

<template>
  <bfPageHeader
    label="Privacy"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy' }]"
    heading="Privacy"
    :tagline="PRIVACY_LEAD"
  />

  <bfSection
    v-for="section in PRIVACY_SECTIONS"
    :key="section.heading"
    :label="section.heading"
    :heading="section.heading"
  >
    <p v-for="(para, i) in section.paragraphs" :key="i">{{ para }}</p>
  </bfSection>

  <bfSection label="Related" heading="Related pages">
    <p><NuxtLink to="/contact">Contact</NuxtLink></p>
    <p><NuxtLink to="/about">About</NuxtLink></p>
    <p><a href="/sitemap.xml">Sitemap</a></p>
    <p><a href="/llms.txt">llms.txt</a></p>
  </bfSection>
</template>
