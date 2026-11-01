<script setup lang="ts">
/**
 * `/contact` — the public contact page.
 *
 * The band is `bfContactSection`, the same one `/about#contact` mounts.
 * Copy comes from `utils/agentContent.ts`, which is also the Markdown body.
 * The locality is Washington, DC. No street address and no phone: neither is
 * in the repo. TODO(owner): both, when they are confirmed.
 */
import { contactPage } from '../../utils/agentContent'

defineOptions({ name: 'ContactPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: contactPage.title })
</script>

<template>
  <bfPageHeader
    label="Contact"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Contact' }]"
    :heading="contactPage.title"
    :tagline="contactPage.description"
  />

  <bfSection
    v-for="section in contactPage.sections"
    :key="section.heading"
    :heading="section.heading"
  >
    <p v-for="(para, i) in section.paragraphs" :key="i">{{ para }}</p>
  </bfSection>

  <bfContactSection id="contact" address="Washington, DC" />
</template>
