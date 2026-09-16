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

/**
 * The document stems of one `content/bf/*` collection, e.g. `insights`.
 *
 * The stem **is** the route slug: `scripts/normalise-wireframe-data.ts` writes
 * each document as `<slug>.json`, and `pages/insights/[slug].vue` /
 * `pages/projects/[slug].vue` resolve `params.slug` against the same field.
 * Reading the directory rather than parsing every file keeps this synchronous —
 * a Nuxt config is evaluated before anything async is available — and it is the
 * same source `scripts/generate-legacy-redirects.ts` builds the redirect map
 * from, which is precisely why the two used to disagree (see below).
 *
 * A missing directory yields `[]` rather than throwing: a checkout without the
 * generated content should still be able to load a config.
 */
const collectionSlugs = (collection: string): string[] => {
  try {
    return readdirSync(resolve(projectRoot, 'content/bf', collection), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

/**
 * Every route BRIEF §7 promises, seeded explicitly rather than discovered by
 * the crawler (gh#68, residuals #194 and #210).
 *
 * `crawlLinks` is still on and still does most of the work, but it can only
 * reach a detail page that some other page links to — and a document that
 * appears in no grid, no featured band and no related list is linked from
 * nowhere. Three separate defects came out of that one gap:
 *
 * - **#194** — `/projects/wisdom-of-the-crowd` (external, not grid-eligible,
 *   not featured, not in the nav) and `/projects/cepi-2011` (archived child of
 *   an orphaned parent) answered correctly in dev and were simply absent from
 *   `.output/public`, i.e. 404 on a static host.
 * - **#210** — 51 of the 433 rows in the generated `public/_redirects` pointed
 *   at a target with no file behind it, so a legacy URL answered `301` and the
 *   destination then answered `404`. `generate-legacy-redirects.ts` builds the
 *   map from `content/bf/**` on disk, which knows nothing about what got
 *   crawled; seeding from the *same* source is what makes the two agree by
 *   construction. `scripts/verify-legacy-redirects.ts --targets` asserts it.
 * - the ordering fragility the retired `probeRoutes` block documented: Nitro
 *   hands the seeded list to the crawler ten at a time, one batch per
 *   successfully rendered page, so a batch spliced during a failing render is
 *   dropped with that response. There are no failing renders left (#114 went
 *   with the legacy pages in gh#67), and the `--targets` check is the standing
 *   assertion that this stays true.
 *
 * Enumerated from the content, never hand-listed: the counts move whenever
 * curation flags change, and a hand-written list of 371 slugs is a list that is
 * wrong by the next content import.
 *
 * `/wireframes` is **kept** (D2 — the frozen prototype must still crawl), and
 * its six static pages are seeded for the same robustness reason. The
 * `/wireframes/{area}` hubs and the `wf-*` detail routes stay on the crawler,
 * exactly as before: the prototype links the subset it means to show, and this
 * config may not reach into that layer to decide otherwise.
 */
const prerenderRoutes: string[] = [
  '/',
  '/about',
  '/archive',
  '/insights',
  '/projects',
  '/search',
  ...collectionSlugs('programs').map(slug => `/${slug}`),
  ...collectionSlugs('insights').map(slug => `/insights/${slug}`),
  ...collectionSlugs('projects').map(slug => `/projects/${slug}`),
  '/wireframes',
  '/wireframes/about',
  '/wireframes/archive',
  '/wireframes/insights',
  '/wireframes/projects',
  '/wireframes/search'
]

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
      /*
       * DoD-A9 (a11y epic, gh#217). WCAG 3.1.1 is a Level A criterion and it is
       * a property of the *document*, not of a layout — so it belongs to the one
       * declaration every route inherits whether it renders `bf-default`,
       * `wireframe`, `docs-layout`, `default`, `demo` or nothing at all.
       *
       * It used to live in `layouts/bf-default.vue` and `layouts/wireframe.vue`
       * and only there, which meant `/docs/**` — whose layout makes no `useHead`
       * call — shipped `<html>` with no `lang` and no way for a screen reader to
       * pick a pronunciation dictionary. `bf-default`'s copy went with this
       * line's arrival; a route must not be able to opt out by omission.
       *
       * `layouts/wireframe.vue` still restates it, and deliberately: site-epic
       * DoD-4 byte-guards that path against f757a64 and the guard diff is empty
       * on `dev`. Its line is now redundant with this one rather than load-
       * bearing, and comes out when the wireframe freeze lifts.
       *
       * `app.head` is unhead's lowest-priority source, so a page that genuinely
       * needs another language can still declare its own `htmlAttrs.lang`.
       * Nothing does today, and the build gate in `scripts/check-routes.ts`
       * ("every prerendered HTML file carries a non-empty lang") fails the run
       * if a future route drops it again.
       */
      htmlAttrs: { lang: "en" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },],
      link: [
        // google icons
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" },
      ],
      script: [],
    }
  },
  /*
   * Deliberately empty, and it is load-bearing that it stays that way.
   *
   * `layouts/bf-default.vue` is the only stylesheet injector at `/` — it links
   * `/css/styles.css` and restates the `@layer` order ahead of it (residual
   * #103). An entry here would inject the CUBE stack a second time, ahead of
   * that statement, for every route including the frozen `wf-*` prototype.
   *
   * The three commented `css-legacy/*` entries that used to sit here went with
   * `layouts/legacy-base.vue` in gh#67; the dead `/global.css`, `/fixes.css`
   * and `/v2updates.css` copies under `public/` went with them in gh#68. The
   * originals remain at `src/public/css-legacy/`, unserved, as reference.
   */
  css: [],
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
           * Guarded by `scripts/check-routes.ts`, whose cascade-layer gate
           * fails if any compiled stylesheet loses its `@layer components`
           * wrapper. That guard was `scripts/verify-bf-logo.ts` §7 until
           * gh#68, which retired the probe pages that script read.
           */
          'cascade-layers': false
        }
      }
    }
  },
  build: {
    transpile: ['vue-carousel'],
  },
  /*
    `<search>` is a native HTML element (WHATWG HTML, shipped in every engine
    since 2023) that Vue's tag table has not caught up with. Measured on the
    version this repo pins, not assumed:

        require('@vue/shared').isHTMLTag('search')  // => false   (vue 3.5.40)

    Without this predicate `@vue/compiler-dom` compiles `<search>` to
    `resolveComponent("search")`. The element still *renders* — the resolver
    falls back to the tag name — but every dev render logs "Failed to resolve
    component: search", and the vnode takes the component path rather than the
    element one on both the client and the SSR compiler.

    `isCustomElement` is the escape hatch Vue's own warning names, and it is
    the whole fix: with it, both compilers emit a plain element
    (`createElementBlock("search", …)` / `_push('<search…>')`) — byte-identical
    to what a native tag would have produced.

    Scoped to the one tag on purpose. It is a predicate, not a list, so it must
    say no to everything else: a broader match would silently turn a mistyped
    component name into a stray unknown element instead of an error.

    Delete this block when Vue adds `search` to `HTML_TAGS` — the check above is
    the one-line test for whether that has happened. Added by gh#227.
  */
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === 'search'
    }
  },
  vite: {
  },
  plugins: [

  ],
  ssr: true,
  nitro: {
    prerender: {
      // Every BRIEF §7 route, enumerated from `content/bf/**` — see
      // `prerenderRoutes` above for why the crawler alone is not enough.
      routes: prerenderRoutes,
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
