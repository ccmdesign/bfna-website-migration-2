<script setup lang="ts">
/**
 * `src/error.vue` — the site's error page (issue 56 / gh#65).
 *
 * Nuxt's error-page convention: this file lives **outside** `pages/`, and
 * `nuxt-root` swaps it in for the entire app whenever an error reaches the top
 * — a `validate` guard returning `false`, a `createError` throw, a missing
 * route, a failed chunk load. It is not a route, has no `definePageMeta`, and
 * therefore gets **no layout automatically**; `<NuxtLayout name="bf-default">`
 * below is what puts the nav, the footer and the stylesheet around it.
 *
 * ## What this replaces
 *
 * The last consumer of the as-built D.1 finding — the not-found block
 * duplicated verbatim at three wireframe call sites. The component-level fix
 * shipped as `bfEmptyState` in #33/gh#42, and the `bf-*` page templates took it
 * up as they landed: `pages/[program].vue`, `pages/insights/[slug].vue` and
 * `pages/projects/[slug].vue` each render it in their own not-found branch. The
 * error page is what a route that never reached a page hits, and it was the one
 * place still hand-rolling the block. This closes the finding end to end.
 *
 * ## One not-found page (refined pass, Sep 2026)
 *
 * The block alone was a dead end: a heading, a sentence and one link home.
 * This page now renders `bfNotFound`, the layout every not-found path is meant
 * to share — the same `bfEmptyState` heading block on the paper masthead
 * ground, then a search field and the programs and indexes to start from, then
 * the three most recent insights. The three per-route branches —
 * `pages/insights/[slug].vue`, `pages/projects/[slug].vue` and the defensive
 * one in `pages/[program].vue` — render the same component with their own
 * heading and back link, so every dead end on the site is this one page. Only
 * this file passes `announced`: it is the one reached by a client-side swap,
 * where the others are prerendered. See `components/bf/NotFound.vue` for the
 * bands and why the heading block is still `bfEmptyState` (gh#224's gate
 * reads its root).
 *
 * ## Data
 *
 * `bfNotFound` is presentational (D8), so the programs and the recent insights
 * are read here, the way a page reads them: two awaited composables, imported
 * explicitly because they live at `composables/data/useBf*.ts`. `nuxt-root`
 * renders this file inside its `<Suspense>`, which is what makes the top-level
 * `await` legal, exactly as `bf-default`'s own `await useBfSite()` is.
 *
 * Neither read can take the error page down with it. `useAsyncData` catches a
 * failed query into its own `error` ref, and both composables fall back to an
 * empty list, so an error raised *by* the content layer renders this page
 * with the heading block and the search field and without the two data bands
 * — `bfNotFound` renders each only when it has rows.
 *
 * The file it replaces hand-rolled all of it: its own `h1` element reading
 * "404", a centred wrapper, a pill button, and a `<style scoped>` block
 * carrying four `hsl()` colour declarations. Every one of those is something
 * the token set and the composition layer already own, and the colours were
 * the kind BRIEF §5 rule 2 exists to stop. The stylesheet is gone entirely:
 * this file declares no CSS at all.
 *
 * ## Why the layout is invoked here and not inferred
 *
 * `error.vue` is rendered by `nuxt-root`, not by the router, so nothing applies
 * a layout to it. Without the explicit `<NuxtLayout>` this page would render
 * with no nav, no footer, and — the part that is invisible until production —
 * **no `/css/styles.css` link and no `@layer` order statement**, both of which
 * `layouts/bf-default.vue` owns (residual #103). An unlayered legacy stylesheet
 * outranks every layer, so a layout-less error page is not merely unstyled; it
 * is styled wrongly and silently.
 *
 * The layout's slot-partition (residual #179) sees exactly one root here, and
 * it is not a `NuxtPage`, so the "no page outlet" branch applies and the
 * not-found page renders inside `<main id="main">` — which is where a page's
 * only content belongs. `bfNotFound`'s three bands are that one root's
 * fragment, so they land as `<main>`'s own children and take its band rhythm,
 * as every page's bands do.
 *
 * ## One `h1`, and it is not in this file
 *
 * `bfEmptyState` — which `bfNotFound` renders as its first band — defaults
 * `headingLevel` to `1` precisely because this block is what a page shows
 * *instead of* its content: it **is** the page heading. So this file writes no
 * heading element of its own — the spec's acceptance greps
 * `error.vue` for an opening `h1` tag and requires **zero**, which is also why
 * no line below spells one out, and the rendered page has exactly one.
 * Repeating the status code as a giant "404" above the sentence, the way the
 * old file did, would have been the second.
 *
 * ## `404.html` is a client-rendered shell, and that is the framework's choice
 *
 * Under `npx nuxt generate` this file's output lands at
 * `.output/public/404.html`, and that file contains an empty `#__nuxt` with
 * `data-ssr="false"` — no nav, no footer, no heading in the HTML. It is not a
 * failed prerender: `@nuxt/nitro-server` adds `/200.html` and `/404.html` to
 * the prerender list and then forces `noSSR` on exactly those paths
 * (`PRERENDER_NO_SSR_ROUTES` in `runtime/utils/renderer/app.mjs`), because a
 * static host serves one 404 document for every unknown URL and a server-
 * rendered one would bake a single route's state into all of them.
 *
 * So every assertion about this page's *rendered* content — one `h1`, the nav
 * and footer around it, axe — has to be made against the **hydrated** page in a
 * browser, not against the HTML file. Adding `/404.html` to
 * `nitro.prerender.routes` does not change this; the `noSSR` set is matched on
 * the path and is not configurable. Recorded in the spec's Decisions.
 *
 * ## The back link is a plain link, not `clearError`
 *
 * `bfEmptyState` renders `backTo` through `NuxtLink`, and that is deliberate.
 * (The search field's submit is a `navigateTo` for the same reason — it is a
 * client navigation, and leaving this page clears the error on its own.)
 * Nuxt already clears the error on any client-side navigation —
 * `nuxt/dist/pages/runtime/plugins/router.js` does
 * `if (import.meta.client && !nuxtApp.isHydrating && error.value) await nuxtApp.runWithContext(clearError)`
 * on resolve — so a link out of this page works without help, and the file it
 * replaces was a plain `NuxtLink` too. Reaching for `clearError({ redirect: '/' })`
 * would mean a `@click` handler on a slotted control instead of the two props
 * the spec names, for behaviour that is already the behaviour. Recorded in the
 * spec's Decisions.
 */
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPrograms } from '~/composables/data/useBfPrograms'

defineOptions({ name: 'BfErrorPage' })

/**
 * Nuxt hands the error object in as this single prop, and the shape is the
 * convention's, not ours — kept exactly as the file it replaces declared it.
 * `statusCode` is the only field read: `statusMessage` and `message` are
 * whatever threw, frequently a stack-shaped string or an internal path, and
 * neither is copy to show a visitor.
 */
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

/**
 * The one distinction this page makes.
 *
 * 404 is the case a visitor can act on — a stale link, a renamed page, a typo —
 * and gets a sentence that says so. Everything else (500, a thrown
 * `createError`, a chunk that failed to load) gets the generic message: the
 * visitor did nothing wrong and there is nothing for them to fix, so a specific
 * message would only be a specific way of being unhelpful.
 */
const isNotFound = computed<boolean>(() => props.error.statusCode === 404)

const heading = computed<string>(() =>
  isNotFound.value ? 'Page not found' : 'Something went wrong'
)

const message = computed<string>(() =>
  isNotFound.value
    ? 'That page does not exist, or its address has changed.'
    : 'Something went wrong on our end. Try again, or start from the home page.'
)

/*
 * Status-code-driven, as before. The title is only the page's own name —
 * `bf-default`'s `titleTemplate` appends the site name, which the layout-less
 * file this replaces never got.
 */
useHead({
  title: computed(() => (isNotFound.value ? 'Page not found' : 'Error'))
})

/*
 * The two data bands' rows. `programs()` is the client's curated order;
 * `active` is newest first, and `bfNotFound` draws the first three of it, so
 * the head is taken here and the rest is never handed down.
 */
const { programs } = await useBfPrograms()
const { active } = await useBfInsights()

const programList = programs()
const recentInsights = active.slice(0, 3)
</script>

<template>
  <NuxtLayout name="bf-default">
    <!--
      `announced`, so the block renders `role="status"` (gh#224).

      This is the one call site in the repo that unambiguously wants it. A
      client-side navigation to a dead route does not reload the document: Vue
      Router swaps `<main>`'s subtree for this block in place, the URL changes,
      and a screen reader is told nothing — the user is left on what sounds
      like the previous page. A live region is the announcement.

      Not conditional on `isNotFound`: a 500 replaces the page just as silently
      as a 404 does, and the branch would be a distinction without a
      difference. Prop, not a hand-written `role` attribute, so the decision
      stays the component's contract rather than this file's markup —
      `bfNotFound` forwards it to its `bfEmptyState` untouched, so the region
      is the heading block and not the search field or the cards below it.
    -->
    <bfNotFound
      :heading="heading"
      :message="message"
      back-label="Back to home"
      back-to="/"
      announced
      :programs="programList"
      :insights="recentInsights"
    />
  </NuxtLayout>
</template>
