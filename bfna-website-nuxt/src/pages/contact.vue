<script setup lang="ts">
import { useBfPages } from '~/composables/data/useBfPages'

defineOptions({ name: 'ContactPage' })

definePageMeta({ layout: 'bf-default' })

const { pageBySlug } = await useBfPages()
const contactCopy = pageBySlug('about')

useHead({ title: 'Contact' })

useBfSeo({
  title: 'Contact',
  description:
    'Contact the Bertelsmann Foundation North America by email or message form, and find visit information for our Washington, DC office.',
  canonicalPath: '/contact'
})
</script>

<template>
  <bfPageHeader
    heading="Contact"
    :tagline="contactCopy?.excerpt || 'Get in touch with the Bertelsmann Foundation North America.'"
  />

  <bfContactSection id="contact" />

  <bfSection label="More information" layout="stack" gap="m">
    <p>
      The Bertelsmann Foundation North America is an independent, nonpartisan think tank.
      For media inquiries, partnership questions, or general information, email
      <a href="mailto:info@bfna.org">info@bfna.org</a>.
      <!-- TODO(owner): confirm whether a separate press or privacy inbox should be listed publicly -->
    </p>
    <p>
      Learn more about our mission and team on the
      <NuxtLink to="/about">About</NuxtLink> page, or browse recent publications in
      <NuxtLink to="/insights">Insights</NuxtLink>.
    </p>
  </bfSection>
</template>
