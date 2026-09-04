# gh#65 — 56 404 / error page — implementation plan

Spec: `docs/ds-epic/issues/56-error-404.md` · Issue: #65 · Branch: `feature/gh65-404-error-page`

## Approach

`src/error.vue` is Nuxt's error-page convention: it lives outside `pages/`, is
rendered by `nuxt-root` in place of the whole app on any unhandled error, and
therefore gets **no layout automatically** — the layout has to be invoked
explicitly with `<NuxtLayout name="bf-default">`.

The rewrite is a straight substitution of composition for hand-rolled markup:

- `<NuxtLayout name="bf-default">` supplies skip link → nav → announcement →
  `<main id="main">` → footer, plus the `@layer` order statement and the
  `/css/styles.css` link (residual #103 — without the layout this page would
  ship unlayered legacy CSS outranking every `bf-*` rule).
- The body becomes one `<bfEmptyState>` with `heading`, `message`,
  `back-label="Back to home"` and `back-to="/"`. `bfEmptyState` defaults
  `headingLevel` to `1`, so the page's single `h1` lives inside the component
  and `error.vue` itself contains no `<h1` (the spec greps for exactly that).
- `isNotFound = computed(() => props.error.statusCode === 404)` drives the
  heading/message split. 404 → "Page not found"; anything else (500, thrown
  `createError`, a chunk failure) → "Something went wrong".
- The whole `<style scoped>` block goes. It carried two `hsl()` colour literals
  (`hsl(199,84%,20%)` / `hsl(0,0%,100%)`) and re-implemented centring, a measure
  and a pill button — all of which the tokens + composition layer already own.
  Removing it is also a DoD-6 improvement (two colour literals leave the tree).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/error.vue` | rewritten (only source file touched) |
| `docs/plans/gh65-plan.md` | this plan |
| `docs/ds-epic/issues/56-error-404.md` | Decisions appended |

No new component, no new type, no probe page: `error.vue` is not a route, so a
`bf-probe/*` page cannot exercise it. The generated `404.html` is the artefact
under test instead.

## Contract kept

- `defineProps<{ error: { statusCode: number; statusMessage?: string; message?: string } }>()`
  stays exactly as today — Nuxt passes the error object as that single prop.
- `useHead({ title })` still keys off `statusCode`; `bf-default`'s
  `titleTemplate` appends the site name, which the old file (layout-less) never
  got. That is a gain, not a behaviour change to preserve.
- The back link stays a plain `NuxtLink` (via `backTo`), **not**
  `clearError({ redirect: '/' })`. Rationale in Decisions: Nuxt already clears
  the error on any client navigation
  (`nuxt/dist/pages/runtime/plugins/router.js:101` —
  `if (import.meta.client && !nuxtApp.isHydrating && error.value) await nuxtApp.runWithContext(clearError)`),
  and today's file is a plain `NuxtLink` too, so this is behaviour-equivalent.

## Test strategy

1. **Typecheck gate** (epic rule, residual #71): baseline recorded before any
   edit = **176** `error TS` lines on this worktree. After: count ≤ 176 and zero
   errors matching `src/(components/bf|types|composables/bf)|content\.config`.
2. `npx nuxt generate` exits 0 (never `npm run generate`).
3. Spec greps: `grep -c "<h1" src/error.vue` = 0; `bf-default` present;
   `bfEmptyState` present.
4. Generated-output assertions on `.output/public/404.html`: exactly one `<h1`,
   `.bf-empty-state` present, `bf-shell`/nav/footer landmarks present.
5. **Preview**: serve `.output/public`, request an unknown route, confirm HTTP
   **404** and that the served body is the error page with nav + footer. Confirm
   `/not-a-program` (which `[program].vue`'s `validate` now 404s, #182) lands on
   the same page.
6. **500 path**: a throwaway route calling `createError({ statusCode: 500 })`
   under `nuxt dev`, checked and then **reverted — never committed**.
7. Probe harness: `npx tsx scripts/check-probes.ts` full run exits 0 (no
   `--only`; this issue adds no probe).
8. Wireframe byte-identity: cumulative diff against the pre-epic SHA prints
   nothing.
9. a11y: axe against the built error page (brief §5.9). Substituted/degraded
   form recorded in the journal if axe is unavailable offline.

## Risks

- **`NuxtLayout` inside `error.vue`**: `bf-default` `await`s `useBfSite()`.
  `NuxtLayout` renders its child inside `<Suspense>`, so the await is legal —
  but if `useBfSite()` were itself the source of the error being rendered, the
  error page would re-throw. `useBfSite` reads a prerendered `data` collection
  and a static JSON module; on a prerendered 404 the payload is baked in. Watch
  `npx nuxt generate` for a failure to prerender `/404.html`.
- **Slot partitioning**: `bf-default` hoists non-`NuxtPage` slot roots out of
  `<main>`. From `error.vue` the slot holds only `bfEmptyState`, which is not a
  page outlet, so the fallback branch applies and everything renders inside
  `<main>` — the intended behaviour, exercised here for the first time. Assert
  the empty state is inside `#main` in the generated HTML.
- **Static hosting status code**: `nuxt generate` emits `404.html`; the 404
  status is the host's to return. Verified under `npx serve`, which honours it.
