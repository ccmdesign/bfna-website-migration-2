<script setup lang="ts">
/**
 * `/privacy` — privacy and data practices for www.bfna.org (agent-readiness).
 */
import { useBfSiteSeo } from '~/composables/useBfSiteSeo'

defineOptions({ name: 'PrivacyPage' })

definePageMeta({ layout: 'bf-default' })

const description =
  'Privacy practices for the Bertelsmann Foundation North America website: contact form handling, fonts, embedded media, and how to reach us.'

useBfSiteSeo({
  title: 'Privacy Policy',
  description,
  path: '/privacy',
  ogType: 'article'
})

useHead({ title: 'Privacy Policy' })
</script>

<template>
  <bfPageHeader
    heading="Privacy Policy"
    tagline="How we handle information on this website."
  />

  <bfSection label="Privacy policy">
    <div class="stack" data-gap="m">
      <p>
        The Bertelsmann Foundation North America (“BFNA”, “we”) publishes this site at
        <a href="https://www.bfna.org">www.bfna.org</a> to share research, programs, projects, and insights about
        transatlantic relations. This page describes what the <strong>website</strong> itself does with information—not
        the separate policies of third-party platforms we link to (social networks, podcast hosts, document microsites,
        and similar).
      </p>

      <h2 class="bf-section__heading">Information you provide</h2>
      <p>
        The contact form on <a href="/about#contact">About → Contact</a> collects your name, email address, and message
        so you can reach our team at
        <a href="mailto:info@bfna.org">info@bfna.org</a>. The form is presented in the browser; this rebuild does not
        yet post submissions to a server endpoint or email pipeline. Until that integration is enabled, nothing you type
        is transmitted off your device when you press “Send message.”
      </p>
      <p>
        The footer search field navigates to <a href="/search">/search</a> with your query in the URL; it does not store
        searches in a BFNA account or profile.
      </p>

      <h2 class="bf-section__heading">Fonts and static assets</h2>
      <p>
        Pages load stylesheets and font files from this site’s own domain. The Nuxt configuration also references
        Google Fonts (Material Symbols) for icon glyphs; requesting those assets may cause your browser to contact
        Google’s servers. We do not control Google’s logging practices for font delivery.
      </p>

      <h2 class="bf-section__heading">Embedded media and external links</h2>
      <p>
        Some insights and projects include embedded video (for example YouTube or Vimeo) or images hosted on legacy
        content delivery domains used during migration. Opening those pages may cause your browser to contact the embed
        provider under its own privacy terms. Links to social profiles, podcasts, RANGE, Transponder, and partner sites
        leave BFNA’s site when you follow them.
      </p>

      <h2 class="bf-section__heading">Cookies and analytics</h2>
      <p>
        This v2 site is built as static HTML with client-side hydration. We have not identified first-party analytics
        scripts (such as Google Analytics) in the application bundle for the public <code>/</code> routes. If
        server-side or tag-manager analytics are added before launch, this page should be updated to name the vendor,
        cookies set, and retention period.
      </p>

      <h2 class="bf-section__heading">Contact and updates</h2>
      <p>
        Questions about this policy or about information BFNA holds about you can be directed to
        <a href="mailto:info@bfna.org">info@bfna.org</a> or by mail to BFNA at 1108 16th Street NW, Floor 1,
        Washington, DC 20036, United States. We may update this page when site functionality changes; the “last updated”
        date will be reflected in the sitemap entry when the content changes.
      </p>
    </div>
  </bfSection>
</template>
