// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

const dsRootDir = resolve(currentDir, 'components/ds')

let dsComponentDirs: string[] = []

try {
  const dsEntries = readdirSync(dsRootDir, { withFileTypes: true })
  const hasRootComponents = dsEntries.some(entry => entry.isFile() && entry.name.endsWith('.vue'))
  const subdirPaths = dsEntries
    .filter(entry => entry.isDirectory())
    .map(entry => resolve(dsRootDir, entry.name))

  dsComponentDirs = [
    ...(hasRootComponents ? [dsRootDir] : []),
    ...subdirPaths
  ]
} catch {
  dsComponentDirs = [dsRootDir]
}

export default defineNuxtConfig({
  rootDir: projectRoot,
  srcDir: currentDir,
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxt/image'
  ],
  image: {
    // Allow external domains for images
    domains: ['bfna.simplyas.com'],
    // Let Nuxt Image auto-detect the provider (Netlify will use its native service)
    // For external images, components use regular img tags to bypass optimization
    provider: process.env.NUXT_IMAGE_PROVIDER || undefined,
    // Quality settings for optimized images
    // Raised 80 -> 90 for BF-51 parity (matches live Eleventy q=80 -> q=90)
    quality: 90,
    // Screen breakpoints for responsive images.
    // Ceiling extended toward the live BF-51 ladder (~2400w hero/website,
    // ~1920w smaller card) so retina/desktop product boxes are not forced
    // to upscale a too-small source. See PR body Q2 re: provider resize.
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '3xl': 1920,
      '4xl': 2400,
    }
  },
  runtimeConfig: {
    public: {
    }
  },
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },],
      link: [
        // google icons
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" },
      ],
      script: [],
    }
  },
  css: [
    // New Nuxt CSS - COMMENTED OUT for Phase 3 to use legacy CSS only
    // '~/public/css/styles.css',
    // Legacy CSS loaded via layout instead of here to ensure proper loading order
    // '~/public/css-legacy/global.css',
    // '~/public/css-legacy/fixes.css',
    // '~/public/css-legacy/v2updates.css'
  ],
  postcss: {
    plugins: {
      'postcss-import': {},
      'postcss-preset-env': {
        stage: 1,
        features: {
          'nesting-rules': true,
          /*
           * Off deliberately (gh#101, residual #98). `stage: 1` enables the
           * cascade-layers polyfill, which rewrites each SFC stylesheet in
           * isolation: it cannot see the layer-order statement in
           * `public/css/styles.css` (`@layer reset, defaults, tokens, themes,
           * composition, components, utils, overrides;`), so it flattened the
           * `@layer components { … }` wrapper every `bf-*` component ships
           * into unlayered rules. Unlayered CSS outranks every layer, which is
           * backwards — a `utils` or `overrides` rule could never outrank a
           * component. Native `@layer` is supported across the target
           * browsers, so no polyfill is wanted.
           *
           * `public/css/**` is served through `<link>` and never passes
           * through Vite/PostCSS, so this changes nothing there — the
           * wireframe stylesheet included.
           *
           * Guarded by `scripts/verify-bf-logo.ts` §7.
           */
          'cascade-layers': false
        }
      }
    }
  },
  build: {
    transpile: ['vue-carousel'],
  },
  vite: {
  },
  plugins: [

  ],
  ssr: true,
  nitro: {
    prerender: {
      // Wireframes aren't linked from the main site — seed them so the crawler finds them
      routes: ['/wireframes'],
      failOnError: false
    }
  },
  experimental: {
    clientFallback: true
  },
  components: [
    ...dsComponentDirs.map(path => ({
      path,
      pathPrefix: false,
      prefix: 'ccm'
    })),
    {
      path: resolve(currentDir, 'components/content'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/docs'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/templates'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/legacy'),
      pathPrefix: false
    },
    {
      // Front 2 wireframes only — components used exclusively under /wireframes
      path: resolve(currentDir, 'components/wireframe'),
      pathPrefix: false
    },
    {
      // Final bf-* design system — `components/bf/Card.vue` auto-imports as <bfCard>
      path: resolve(currentDir, 'components/bf'),
      pathPrefix: false,
      prefix: 'bf'
    }
  ],
})
