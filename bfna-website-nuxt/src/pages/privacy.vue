<script setup lang="ts">
// TODO(owner): street address, postal code, and phone are not in v2 content.
// The contact band still renders the Directus placeholder, which is not an address.
// Bluesky in the footer is #bluesky-profile-url and is omitted from sameAs.
// Legal name on the production privacy page is "Bertelsmann Foundation (North America), Inc.";
// v2 copy does not use the Inc. form. Confirm before adding it.
// The production HTML policy at /privacy-policy/ makes GDPR, cookie, and retention claims
// this repo does not implement; do not paste that policy over this page until the owner confirms it.

import { PRIVACY_META_DESCRIPTION } from '~/constants/privacy-page'

defineOptions({ name: 'PrivacyPage' })
definePageMeta({ layout: 'bf-default' })
useHead({ title: 'Privacy' })
</script>

<template>
  <bfPageHeader
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy' }]"
    heading="Privacy"
  />
  <bfSection>
    <p>{{ PRIVACY_META_DESCRIPTION }}</p>
    <p>
      The site does not run an analytics script, a tag manager, an advertising pixel, or a cookie banner. Nothing in the repository records a visit.
    </p>
    <p>
      The contact form on the About page asks for a name, an email address, and a message. Submitting it does not send those fields anywhere: the form cancels the submit and there is no form endpoint. To reach the Foundation, email info@bfna.org, the address shown on that page.
    </p>
    <p>
      Pages load fonts from Google (Newsreader, IBM Plex Sans, and Material Symbols) and load images from bfna.simplyas.com. Your browser requests those hosts while it draws the page. Footer links leave this site for LinkedIn, Instagram, Facebook, YouTube, and Vimeo.
    </p>
    <p>
      To ask what information the Foundation holds about you, or to ask for a correction, email info@bfna.org.
    </p>
  </bfSection>
</template>
