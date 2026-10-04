<script setup lang="ts">
defineOptions({ name: 'PrivacyPage' })

definePageMeta({ layout: 'bf-default' })

useHead({ title: 'Privacy Policy' })

useBfSeo({
  title: 'Privacy Policy',
  description:
    'Privacy policy for the Bertelsmann Foundation North America website: data collected through this site, third-party services, and your choices.',
  canonicalPath: '/privacy',
  ogType: 'article'
})
</script>

<template>
  <bfPageHeader
    heading="Privacy Policy"
    tagline="How the Bertelsmann Foundation North America (BFNA) website handles information when you visit bfna.org."
  />

  <bfSection label="Privacy policy" layout="stack" gap="m">
    <div class="bf-prose">
      <p>
        This privacy policy describes what happens when you use the public Bertelsmann Foundation
        North America website (the “Site”). It applies to pages served at
        <strong>https://www.bfna.org</strong> and to preview deployments of the same codebase
        before launch. If anything here is unclear,
        <!-- TODO(owner): confirm the legal entity name and data controller for GDPR/CCPA notices -->
        contact us at <a href="mailto:info@bfna.org">info@bfna.org</a>.
      </p>

      <h2>Information we collect</h2>
      <p>
        <strong>Browsing the Site.</strong> When you load pages, your browser sends standard
        request data (such as IP address, user agent, and referrer) to our hosting provider,
        Netlify, which serves the static Site. Netlify may process server logs for security and
        operations. We do not run first-party analytics scripts in the Site codebase reviewed for
        this policy.
        <!-- TODO(owner): confirm whether Netlify Analytics, Netlify Forms submissions, or other Netlify features are enabled in production -->
      </p>
      <p>
        <strong>Contact form.</strong> The Contact page includes a message form. At the time of
        this rebuild, the form prevents default submission in the browser and does not yet post
        to a configured endpoint in this repository. When Netlify Forms or another processor is
        enabled, submitting the form will send the fields you enter (name, email, message) to that
        service so staff can respond.
        <!-- TODO(owner): document retention period and processor once Netlify Forms (issue #72) is live -->
      </p>
      <p>
        <strong>Search.</strong> Site search runs in your browser against content bundled with the
        Site; search queries are not sent to a separate BFNA search API in this codebase.
      </p>

      <h2>Third-party services and embeds</h2>
      <p>
        <strong>Fonts and icons.</strong> The Site loads typography and icon assets from Google
        (<code>fonts.googleapis.com</code> / Google Fonts and Material Symbols). Those requests may
        be logged by Google under its policies.
      </p>
      <p>
        <strong>Media and images.</strong> Some pages link to or embed content from third parties
        such as YouTube, Vimeo, and our image CDN (<code>bfna.simplyas.com</code>). If you follow a
        link or play embedded media, those providers receive data under their own terms.
      </p>
      <p>
        <strong>Social links.</strong> Footer links open BFNA profiles on LinkedIn, Instagram,
        Facebook, YouTube, Vimeo, and Bluesky. We do not place third-party social “share” widgets
        on every page in this codebase.
      </p>

      <h2>Cookies and similar technologies</h2>
      <p>
        The static Site does not set first-party cookies for basic page views in the application
        code reviewed here. Third-party services listed above may store cookies or use local storage
        when you interact with them.
        <!-- TODO(owner): list any consent banner or cookie policy required for EU/UK visitors -->
      </p>

      <h2>How we use information</h2>
      <p>
        We use information collected through the Site to operate and improve our public content,
        respond to inquiries, and maintain security. We do not sell personal information collected
        through the Site.
        <!-- TODO(owner): confirm whether BFNA or Bertelsmann Stiftung policies govern cross-border transfers -->
      </p>

      <h2>Your choices</h2>
      <p>
        You may email <a href="mailto:info@bfna.org">info@bfna.org</a> to ask questions about this
        policy or to request access, correction, or deletion of information you submitted through
        a BFNA channel, subject to applicable law.
        <!-- TODO(owner): provide jurisdiction-specific rights (EU, UK, California) and response timelines -->
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy when the Site or applicable law changes. The effective date of
        the current version is shown when this page is published.
        <!-- TODO(owner): add effective date and change log -->
      </p>

      <p>
        Related pages:
        <NuxtLink to="/about">About</NuxtLink> ·
        <NuxtLink to="/contact">Contact</NuxtLink> ·
        <NuxtLink to="/llms.txt">llms.txt</NuxtLink>
      </p>
    </div>
  </bfSection>
</template>

<style scoped>
@layer components {
  .bf-prose {
    max-inline-size: var(--measure, 65ch);
  }

  .bf-prose h2 {
    margin-block-start: var(--space-l);
    font-size: var(--size-1);
  }

  .bf-prose p,
  .bf-prose li {
    margin-block-end: var(--space-s);
  }
}
</style>
