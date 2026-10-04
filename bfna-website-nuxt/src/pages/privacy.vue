<script setup lang="ts">
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfSeo } from '~/composables/useBfSeo'

/*
 * TODO(owner): Have counsel approve this policy and supply its effective date.
 * TODO(owner): Confirm processors, log retention, transfer language, and
 * whether Netlify Analytics, Netlify Forms, or consent tooling is enabled.
 */
definePageMeta({ layout: 'bf-default' })
const { pageBySlug } = await useBfPages()
const page = pageBySlug('privacy')
if (!page) throw createError({ statusCode: 404, statusMessage: 'Privacy policy not found' })
const privacyTitle = page.heading ?? 'Privacy Policy'
useHead({ title: privacyTitle })
useBfSeo({ title: privacyTitle, description: page.subheading ?? 'How Bertelsmann Foundation North America handles information on this website.' })
</script>

<template>
  <bfPageHeader label="Privacy" :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy' }]" :heading="page.heading" :tagline="page.subheading" />
  <bfSection measure="narrow">
    <div class="stack" data-gap="m">
      <bfProse :content="page.description" />
      <p>Questions about this policy may be sent to <a href="mailto:info@bfna.org">info@bfna.org</a>.</p>
    </div>
  </bfSection>
</template>
