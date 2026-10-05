<script setup lang="ts">
/**
 * `/privacy` — what this site does with information today.
 *
 * TODO(owner): the counsel-approved privacy policy is still an open client
 * input (docs/site-epic/BRIEF.md). This page does not invent one. The prose
 * is the same text the Markdown negotiator serves.
 */
import { privacyPage } from '../../utils/agentContent'

defineOptions({ name: 'PrivacyPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: privacyPage.title })
</script>

<template>
  <bfPageHeader
    label="Privacy"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy' }]"
    :heading="privacyPage.title"
    :tagline="privacyPage.description"
  />

  <bfSection
    v-for="section in privacyPage.sections"
    :key="section.heading"
    :heading="section.heading"
  >
    <p v-for="(para, i) in section.paragraphs" :key="i">{{ para }}</p>
  </bfSection>
</template>
