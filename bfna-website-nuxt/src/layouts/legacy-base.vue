<template>
  <div>
    <LegacyOrganismsFrame />

    <section class="main-content">
      <slot />
    </section>

    <LegacyOrganismsFooter />
  </div>
</template>

<script setup lang="ts">
import LegacyOrganismsFrame from '~/components/legacy/organisms/Frame.vue'
import LegacyOrganismsFooter from '~/components/legacy/organisms/Footer.vue'
import { useThirdPartyIntegrations } from '~/composables/legacy/useThirdPartyIntegrations'

// Initialize third-party integrations with graceful failure handling
useThirdPartyIntegrations()

const route = useRoute()
const props = defineProps<{
  title?: string
  description?: string
  image?: string
  theme?: string
}>()

const heroBackgrounds = {
  'default': {
    'webp': '/images/hero/homepage.webp',
    'fallback': '/images/hero/homepage.jpg'
  },
  'democracy': {
    'webp': '/images/hero/democracy@2x.webp',
    'fallback': '/images/hero/democracy@2x.jpg'
  },
  'digital-world': {
    'webp': '/images/hero/digital-world@2x.webp',
    'fallback': '/images/hero/digital-world.jpg'
  },
  'future-leadership': {
    'webp': '/images/hero/future-leadership@2x.webp',
    'fallback': '/images/hero/future-leadership@2x.jpg'
  },
  'politics-society': {
    'webp': '/images/hero/politics-society@2x.webp',
    'fallback': '/images/hero/politics-society@2x.jpg'
  },
  'team': {
    'webp': '/images/hero/team@2x.webp',
    'fallback': '/images/hero/team@2x.jpg'
  },
  'about': {
    'webp': '/images/hero/about@2x.webp',
    'fallback': '/images/hero/about@2x.jpg'
  },
  'stiftung': {
    'webp': '/images/hero/stiftung.webp',
    'fallback': '/images/hero/stiftung.jpg'
  },
  'archives': {
    'webp': '/images/hero/archives@2x.webp',
    'fallback': '/images/hero/archives@2x.jpg'
  },
  'updates': {
    'webp': '/images/hero/updates@2x.webp',
    'fallback': '/images/hero/updates@2x.jpg'
  }
}

const heroTheme = computed(() => {
  if (props.theme) return props.theme
  if (route.path === '/') return 'default'
  return false
})

const heroBg = computed(() => {
  if (heroTheme.value && heroBackgrounds[heroTheme.value as keyof typeof heroBackgrounds]) {
    return heroBackgrounds[heroTheme.value as keyof typeof heroBackgrounds]
  }
  return null
})

const pageTitle = computed(() => props.title || 'BFNA')
const pageDescription = computed(() => props.description || '')
const pageImage = computed(() => props.image || '/images/bfna-og.jpg')
const ogUrl = computed(() => `https://bfna.org${route.path}`)

useHead({
  title: pageTitle.value,
  htmlAttrs: {
    lang: 'en'
  },
  script: [
    {
      src: 'https://www.googletagmanager.com/gtag/js?id=G-ZMRLZHXHT4',
      async: true
    },
    {
      innerHTML: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-ZMRLZHXHT4', {
          client_storage: 'none',
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
      `,
      type: 'text/javascript'
    },
    {
      src: 'https://bfna-ds.netlify.app/components/preview/assets/js/components.js',
      defer: true
    }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'preconnect', href: 'https://cdn.embedly.com', crossorigin: '' },
    { rel: 'preconnect', href: 'https://use.typekit.net', crossorigin: '' },
    { rel: 'preload', href: 'https://fonts.googleapis.com/icon?family=Material+Icons&display=swap', as: 'style', crossorigin: '', onload: "this.rel='stylesheet'" },
    { rel: 'preload', href: 'https://use.typekit.net/af/43851c/00000000000000007735ba73/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3', as: 'font', type: 'font/woff2', crossorigin: '' },
    { rel: 'preload', href: 'https://use.typekit.net/af/b78836/00000000000000007735ba66/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3', as: 'font', type: 'font/woff2', crossorigin: '' },
    { rel: 'preload', href: 'https://use.typekit.net/af/f82cc1/00000000000000007735ba3f/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3', as: 'font', type: 'font/woff2', crossorigin: '' },
    ...(heroBg.value ? [
      { rel: 'preload', as: 'image', href: heroBg.value.webp, type: 'image/webp', imagesizes: '100vw', fetchpriority: 'high' },
      { rel: 'preload', as: 'image', href: heroBg.value.fallback, type: 'image/jpeg', imagesizes: '100vw', fetchpriority: 'high' }
    ] : []),
    // Legacy CSS - Loaded for Phase 3 visual parity
    { rel: 'preload', href: '/_nuxt/public/css-legacy/global.css', as: 'style' },
    { rel: 'stylesheet', href: '/_nuxt/public/css-legacy/global.css' },
    { rel: 'preload', href: '/_nuxt/public/css-legacy/fixes.css', as: 'style' },
    { rel: 'stylesheet', href: '/_nuxt/public/css-legacy/fixes.css' },
    { rel: 'preload', href: '/_nuxt/public/css-legacy/v2updates.css', as: 'style' },
    { rel: 'stylesheet', href: '/_nuxt/public/css-legacy/v2updates.css' },
    // Favicon
    { rel: 'apple-touch-icon', sizes: '120x120', href: '/favicon/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' },
    { rel: 'manifest', href: '/favicon/site.webmanifest' },
    { rel: 'mask-icon', href: '/favicon/safari-pinned-tab.svg', color: '#5bbad5' }
  ],
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'msapplication-TileColor', content: '#da532c' },
    { name: 'theme-color', content: '#ffffff' },
    // Open Graph and Twitter Card
    { property: 'og:site_name', content: pageTitle.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: ogUrl.value },
    { property: 'og:title', content: pageTitle.value },
    { name: 'twitter:card', content: 'summary_large_image' },
    { property: 'og:image', content: pageImage.value },
    { name: 'twitter:image', content: pageImage.value.startsWith('http') ? pageImage.value : `https:${pageImage.value}` },
    { property: 'og:image:alt', content: `Page image for ${pageTitle.value}` },
    { name: 'twitter:image:alt', content: `Page image for ${pageTitle.value}` },
    ...(pageDescription.value ? [
      { name: 'description', content: pageDescription.value.length > 280 ? pageDescription.value.substring(0, 280) : pageDescription.value },
      { name: 'twitter:description', content: pageDescription.value.length > 280 ? pageDescription.value.substring(0, 280) : pageDescription.value },
      { property: 'og:description', content: pageDescription.value.length > 280 ? pageDescription.value.substring(0, 280) : pageDescription.value }
    ] : [])
  ],
  style: [
    {
      children: `
        @font-face {
          font-family: "trade-gothic-next";
          font-style: normal;
          font-weight: 300;
          font-display: swap;
          src: url("https://use.typekit.net/af/43851c/00000000000000007735ba73/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3") format("woff2"),
               url("https://use.typekit.net/af/43851c/00000000000000007735ba73/31/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3") format("woff");
        }

        @font-face {
          font-family: "trade-gothic-next";
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url("https://use.typekit.net/af/b78836/00000000000000007735ba66/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3") format("woff2"),
               url("https://use.typekit.net/af/b78836/00000000000000007735ba66/31/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3") format("woff");
        }

        @font-face {
          font-family: "trade-gothic-next";
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url("https://use.typekit.net/af/f82cc1/00000000000000007735ba3f/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"),
               url("https://use.typekit.net/af/f82cc1/00000000000000007735ba3f/31/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff");
        }

        :root {
          --text-base-size: 1rem;
          --text-base-line-height: 1.62;
          --fonts-primary: "trade-gothic-next", "Helvetica Neue", Arial, sans-serif;
          --fonts-heading: "trade-gothic-next", "Helvetica Neue", Arial, sans-serif;
          --ratio: 1.62;
          --s0: 1rem;
          --s1: calc(var(--s0) * var(--ratio));
          --s2: calc(var(--s1) * var(--ratio));
          --white-hsl: 0, 0%, 100%;
          --navy-hsl: 199, 84%, 20%;
        }

        html, body {
          margin: 0;
        }

        body {
          font-family: var(--fonts-primary);
          font-size: var(--text-base-size);
          line-height: var(--text-base-line-height);
          color: hsl(var(--navy-hsl), 1);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .wrapper {
          box-sizing: content-box;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1rem;
          padding-right: 1rem;
        }

        .stack-l {
          --space: var(--s1);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .stack-l > * {
          margin-top: 0;
          margin-bottom: 0;
        }

        .stack-l > * + * {
          margin-top: var(--space);
        }

        .hero {
          --theme-hsl: var(--navy-hsl);
          --button-hsl: var(--theme-hsl);
          display: flex;
          min-height: 70vh;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .hero > * {
          margin-top: 1rem;
          margin-bottom: 1rem;
        }

        .hero > :first-child:not(.hero__content) {
          margin-top: 0;
        }

        .hero > :last-child:not(.hero__content) {
          margin-bottom: 0;
        }

        .hero__content {
          margin-top: auto;
          padding-top: var(--s2);
          padding-bottom: var(--s2);
          width: calc(100% - 2rem);
        }

        @media screen and (min-width: 64em) {
          .hero__content {
            margin-bottom: auto;
          }
        }

        .hero__logo {
          display: block;
          max-width: 120px;
        }

        @media screen and (min-width: 64em) {
          .hero__logo {
            max-width: 160px;
          }
        }

        .hero__heading {
          font-family: var(--fonts-heading);
          font-weight: 600;
          font-size: 2rem;
          line-height: 1.3;
          color: hsl(var(--theme-hsl), 1);
        }

        @media screen and (min-width: 36em) {
          .hero__heading {
            max-width: calc(100% - 300px);
          }
        }

        @media screen and (min-width: 64em) {
          .hero__heading {
            font-size: 2.5rem;
            line-height: 1.1;
            letter-spacing: 1px;
          }
        }

        .hero__subheading {
          font-family: var(--fonts-heading);
          max-width: 26ch;
          text-shadow: 0 0 6px hsl(var(--white-hsl), 0.7);
          font-size: 1.2rem;
          line-height: 1.5;
          font-weight: 300;
        }

        @media screen and (min-width: 36em) {
          .hero__subheading {
            max-width: calc(100% - 300px);
          }
        }

        @media screen and (min-width: 64em) {
          .hero__subheading {
            font-size: 1.6rem;
            line-height: 1.5;
            letter-spacing: 0.3px;
          }
        }

        .hero__description {
          max-width: 75ch;
          text-shadow: 0 0 6px hsl(var(--white-hsl), 0.7);
          padding-bottom: 1.5rem;
        }

        .hero__media {
          position: absolute;
          inset: 0;
          z-index: -3;
          display: block;
        }

        .hero__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background-image: linear-gradient(0deg, hsl(var(--white-hsl), 1) 20%, hsl(var(--white-hsl), 0.2) 100%);
        }

        @media screen and (min-width: 64em) {
          .hero::after {
            left: calc(50% - 5px);
            border-left: 4px solid hsl(var(--white-hsl), 1);
            background-image: linear-gradient(90deg, hsl(var(--white-hsl), 1) 0%, hsl(var(--white-hsl), 0) 100%);
          }
        }

        .hero--democracy {
          --theme-hsl: 153, 28%, 43%;
        }

        .hero--future-leadership {
          --theme-hsl: 355, 58%, 49%;
        }

        .hero--politics-society {
          --theme-hsl: 33, 100%, 49%;
        }

        .hero--digital-world {
          --theme-hsl: 299, 63%, 24%;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: background-color 0.2s ease, color 0.2s ease;
          cursor: pointer;
        }

        .button--primary {
          background-color: hsl(var(--theme-hsl), 1);
          color: hsl(var(--white-hsl), 1);
        }

        .button--primary:hover,
        .button--primary:focus {
          background-color: hsl(var(--theme-hsl), 0.85);
          color: hsl(var(--white-hsl), 1);
        }
      `
    }
  ]
  })
</script>

