<script setup lang="ts">
/**
 * `/privacy` — Privacy Policy (Finding 7: Trust anchor pages).
 *
 * Content is based on what the v2 site actually does:
 * - No analytics/cookies configured at build time (no GTM, Matomo, etc.)
 * - Uses Google Fonts (fonts.googleapis.com) via Nuxt config
 * - May embed YouTube/Vimeo videos (external, controlled by user)
 * - Netlify Forms (if/when enabled) collect form data per Netlify's TOS
 * - Uses Netlify hosting (Netlify's privacy policy applies to hosting)
 *
 * TODO(owner): Confirm/add:
 * - Exact email for privacy inquiries
 * - Whether Netlify Forms are enabled and what fields they collect
 * - Data retention periods
 * - Legal entity information (DUNS, EIN, etc.)
 * - Whether any third-party analytics are deployed that aren't in this repo
 * - Whether the site collects IP addresses or other PII through forms
 */
definePageMeta({ layout: 'bf-default' })

useHead({
  title: 'Privacy Policy'
})
</script>

<template>
  <NuxtLayout name="bf-default">
    <bfSection
      label="Privacy Policy"
      heading="Privacy Policy"
      headingLevel="1"
    />

    <!-- Main content -->
    <bfSection label="Overview">
      <div class="stack" data-gap="l">
        <p>
          The Bertelsmann Foundation North America (BFNA) respects your privacy.
          This Privacy Policy describes how we collect, use, and protect information
          through our website at <code>www.bfna.org</code> (the "Site"). This policy
          applies to visitors, readers, newsletter subscribers, and users of our
          online services.
        </p>
        <p>
          <strong>Last updated:</strong> {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>
    </bfSection>

    <!-- Information we collect -->
    <bfSection label="Information We Collect">
      <div class="stack" data-gap="l">
        <p>
          <strong>Information you provide directly:</strong> When you submit a contact
          form, sign up for a newsletter, or register for an event through the Site,
          we collect the information you voluntarily provide, such as your name, email
          address, and any message content. This information is transmitted through
          Netlify Forms and stored in accordance with Netlify's data handling practices.
        </p>
        <p>
          <strong>Information collected automatically:</strong> Our web server logs
          standard access data (IP address, browser type, access timestamps, referring
          pages). This data is used solely for Site operation and security, and is not
          combined with personally identifiable information.
        </p>
        <p>
          <strong>Third-party services:</strong> The Site uses Google Fonts
          (fonts.googleapis.com) for typography. Google's font delivery may log your
          IP address. For details, see <a href="https://developers.google.com/fonts/faq#privacy" rel="noopener" target="_blank">Google's Font API Privacy FAQ</a>.
        </p>
        <p>
          <strong>Embedded content:</strong> Pages may contain embedded videos from
          YouTube or Vimeo. These platforms may collect data about your viewing
          activity if you are logged into their services. We do not control their
          data collection practices.
        </p>
      </div>
    </bfSection>

    <!-- How we use information -->
    <bfSection label="How We Use Information">
      <div class="stack" data-gap="l">
        <p>
          We use the information we collect to:
        </p>
        <ul class="stack" role="list" data-gap="xs">
          <li>Respond to your inquiries and communications</li>
          <li>Deliver newsletters and event notifications you have requested</li>
          <li>Maintain and improve the Site's functionality and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
      </div>
    </bfSection>

    <!-- Data sharing -->
    <bfSection label="Data Sharing">
      <div class="stack" data-gap="l">
        <p>
          BFNA does not sell, trade, or rent personal information to third parties.
          We may share information with:
        </p>
        <ul class="stack" role="list" data-gap="xs">
          <li><strong>Netlify</strong>, our hosting provider, for form data storage and Site delivery, subject to Netlify's privacy policy</li>
          <li><strong>Google</strong>, for font delivery (as described above)</li>
          <li><strong>YouTube / Vimeo</strong>, when you choose to view embedded videos</li>
        </ul>
      </div>
    </bfSection>

    <!-- Cookies -->
    <bfSection label="Cookies">
      <div class="stack" data-gap="l">
        <p>
          The Site does not use cookies or tracking technologies at this time,
          except for Google Fonts delivery which may involve minimal server-side
          logging. We do not set any persistent cookies on your device.
        </p>
      </div>
    </bfSection>

    <!-- Your rights -->
    <bfSection label="Your Rights">
      <div class="stack" data-gap="l">
        <p>
          Depending on your jurisdiction, you may have the right to access, correct,
          delete, or restrict processing of your personal data. To exercise these
          rights, please contact us.
        </p>
        <p>
          TODO(owner): Provide a verifiable email address for privacy requests and
          confirm data retention periods and response timelines.
        </p>
      </div>
    </bfSection>

    <!-- Contact -->
    <bfSection label="Contact">
      <div class="stack" data-gap="l">
        <p>
          If you have questions about this Privacy Policy or our data practices,
          please contact us through the <a href="/about#contact">About page</a> or
          by writing to:
        </p>
        <p>
          TODO(owner): Add mailing address for BFNA.
        </p>
      </div>
    </bfSection>
  </NuxtLayout>
</template>
