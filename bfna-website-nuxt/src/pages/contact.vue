<script setup lang="ts">
/**
 * `/contact` — Contact page (Finding 7: Trust anchor pages).
 *
 * Provides a dedicated contact landing page in addition to the contact
 * section embedded in the About page (`/about#contact`).
 *
 * The contact form is rendered by the existing `bfContactSection` component
 * (which uses Netlify Forms when deployed on Netlify).
 */
definePageMeta({ layout: 'bf-default' })

useHead({
  title: 'Contact'
})
</script>

<template>
  <NuxtLayout name="bf-default">
    <!-- Page header -->
    <bfSection
      label="Contact BFNA"
      heading="Contact BFNA"
      headingLevel="1"
    >
      <div class="stack" data-gap="l">
        <p>
          We welcome your questions, comments, and inquiries. Whether you want to
          learn about our programs, request a speaking engagement, or discuss a
          potential partnership, we are here to help.
        </p>
      </div>
    </bfSection>

    <!-- Contact form and visit-us block -->
    <bfContactSection />

    <!-- Additional contact info -->
    <bfSection label="Other Ways to Reach Us">
      <div class="stack" data-gap="l">
        <p>
          <strong>Press inquiries:</strong> Please reach out through the contact
          form above with "Press" in the subject line.
        </p>
        <p>
          <strong>Social media:</strong> Follow BFNA on
          <a href="https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc." rel="noopener" target="_blank">LinkedIn</a>,
          <a href="https://www.facebook.com/BertelsmannFoundation/" rel="noopener" target="_blank">Facebook</a>,
          <a href="https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg" rel="noopener" target="_blank">YouTube</a>, and
          <a href="https://www.instagram.com/bertelsmannfoundation/" rel="noopener" target="_blank">Instagram</a>.
        </p>
        <p>
          TODO(owner): Provide a direct email address for general inquiries.
        </p>
      </div>
    </bfSection>
  </NuxtLayout>
</template>
