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
 * The third and last consumer of the as-built D.1 finding — the not-found block
 * duplicated verbatim at three call sites. The component-level fix shipped as
 * `bfEmptyState` in #33/gh#42; the other two consumers were replaced inside
 * `pages/insights/[slug].vue` and `pages/projects/[slug].vue`. This closes the
 * finding end to end.
 *
 * The file it replaces hand-rolled all of it: its own `h1` element reading
 * "404", a centred wrapper, a pill button, and a `<style scoped>` block
 * carrying two `hsl()` colour literals. Every one of those is something the
 * token set and the composition layer already own, and the colours were the
 * kind BRIEF §5 rule 2 exists to stop. The stylesheet is gone entirely: this
 * file declares no CSS at all.
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
 * it is not a `NuxtPage`, so the "no page outlet" branch applies and the empty
 * state renders inside `<main id="main">` — which is where a page's only
 * content belongs.
 *
 * ## One `h1`, and it is not in this file
 *
 * `bfEmptyState` defaults `headingLevel` to `1` precisely because this block is
 * what a page shows *instead of* its content: it **is** the page heading. So
 * this file writes no heading element of its own — the spec's acceptance greps
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
 * Nuxt already clears the error on any client-side navigation —
 * `nuxt/dist/pages/runtime/plugins/router.js` does
 * `if (import.meta.client && !nuxtApp.isHydrating && error.value) await nuxtApp.runWithContext(clearError)`
 * on resolve — so a link out of this page works without help, and the file it
 * replaces was a plain `NuxtLink` too. Reaching for `clearError({ redirect: '/' })`
 * would mean a `@click` handler on a slotted control instead of the two props
 * the spec names, for behaviour that is already the behaviour. Recorded in the
 * spec's Decisions.
 */
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
</script>

<template>
  <NuxtLayout name="bf-default">
    <bfEmptyState
      :heading="heading"
      :message="message"
      back-label="Back to home"
      back-to="/"
    />
  </NuxtLayout>
</template>
