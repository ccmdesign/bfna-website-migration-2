<script setup lang="ts">
/**
 * `/404` — Server-rendered 404 page (Finding 2: Agent-friendly 404s).
 *
 * Serves as the static catch-all when paths don't match any prerendered route.
 * Netlify serves this file with HTTP 404 automatically (it's named `404.html`).
 * The Netlify Edge Function (`netlify/edge-functions/markdown.ts`) intercepts
 * `Accept: text/markdown` requests to serve a Markdown body instead.
 *
 * Coordinated with PR #295 (Accessibility pass, #231) which changes 404 titles.
 * If #295 lands and renames this page title, update the `useHead` title below.
 */
definePageMeta({ layout: 'bf-default' })

useHead({
  title: 'Page Not Found'
})
</script>

<template>
  <NuxtLayout name="bf-default">
    <!-- Page header -->
    <bfSection
      label="Page not found"
      heading="Page Not Found"
      headingLevel="1"
    />

    <!-- Main content -->
    <bfSection label="Not found">
      <div class="stack" data-gap="l">
        <p>
          The page you are looking for does not exist or may have been moved.
        </p>

        <p><strong>Try these instead:</strong></p>

        <ul class="stack" role="list" data-gap="xs">
          <li>
            <a href="/">Home Page</a> — Main landing page
          </li>
          <li>
            <a href="/sitemap.xml">Sitemap</a> — Full list of pages
          </li>
          <li>
            <a href="/llms.txt">llms.txt</a> — Site overview for agents
          </li>
          <li>
            <a href="/about">About BFNA</a> — Our mission, Board of Directors, and team
          </li>
        </ul>

        <p>
          If you believe this is an error, please
          <a href="/about#contact">contact us</a>.
        </p>
      </div>
    </bfSection>
  </NuxtLayout>
</template>
