<script setup lang="ts">
// TODO(owner): Confirm current retention periods and privacy-request contact details before a legal revision.
defineOptions({ name: 'PrivacyPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: 'Privacy Policy' })
</script>

<template>
  <bfPageHeader
    label="Privacy"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]"
    heading="Privacy Policy"
    tagline="How the Bertelsmann Foundation North America describes information connected with this website and contact requests."
  />

  <bfSection label="Privacy Policy" heading="Privacy Policy">
    <div class="stack" data-gap="m">
      <p>The Bertelsmann Foundation (North America), Inc. takes the protection of privacy and personal data seriously. The Foundation's checked-in privacy policy says that personal data is used in connection with visits to the website and requests to receive emails, invitations, and updates about BFNA's work. Personal data may include a name, job title, affiliation, email address, postal address, or telephone number.</p>
      <p>The current site is a static Nuxt website. Its repository contains a contact form on the About page, but that form currently prevents submission and does not send data to a site endpoint. General inquiries can be sent to <a href="mailto:info@bfna.org">info@bfna.org</a>. The site also loads Material Symbols from Google Fonts; no analytics or advertising script is included in the application source.</p>
      <p>The checked-in policy describes session cookies and says that cookies can be used to remember browser settings and improve the online offering. Visitors can manage or delete cookies through their browser settings. The site includes links to third-party services and media platforms; those services may apply their own privacy policies when a visitor follows a link.</p>
      <p>The policy says that information is used to complete an associated requested action, is shared with service providers only when needed for that service, and is not passed to third parties without consent unless law permits or requires it. It also describes rights to request access, correction, deletion, blocking, restriction, objection, and data portability, and says consent can be withdrawn.</p>
      <p>For privacy questions or requests, contact <a href="mailto:info@bfna.org">info@bfna.org</a>. The organization is based in Washington, DC.</p>
    </div>
  </bfSection>
</template>
