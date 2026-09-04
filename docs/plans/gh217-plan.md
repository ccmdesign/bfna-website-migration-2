# gh#217 — `lang` is a config default (a11y row 92, DoD-A9)

## Problem

`htmlAttrs: { lang: 'en' }` is set in two layouts —
`bfna-website-nuxt/src/layouts/bf-default.vue:218` and
`bfna-website-nuxt/src/layouts/wireframe.vue:43` — and nowhere else.
`src/nuxt.config.ts` `app.head` (lines 147-161) carries `meta`, `link` and `script`
but no `htmlAttrs`. Any route that renders neither of those two layouts ships
`<html>` with no `lang` at all. `src/layouts/docs-layout.vue`, `default.vue` and
`demo.vue` contain no `useHead` call, so `/docs/**` is exactly that case.

WCAG 3.1.1 (Language of Page) is a Level A criterion; a missing `lang` also
leaves every assistive technology to guess the pronunciation dictionary.

## Approach

Structural only (D23/D32) — no colour, type, radius or shadow anywhere in the diff.

1. **`src/nuxt.config.ts`** — add `htmlAttrs: { lang: 'en' }` to `app.head`, with a
   comment naming DoD-A9 and the reason it lives here rather than in a layout.
   Nuxt merges `app.head` into the root `useHead` call, so it applies to every
   route regardless of which layout (or none) renders.
2. **`src/layouts/bf-default.vue`** — delete the `htmlAttrs` line from its `useHead`.
3. **`src/layouts/wireframe.vue`** — delete the same line. `wireframe.vue` is a
   `wf-*` file by association but the BF-217 D2 freeze covers `wf-*` **components
   and their markup**; this is a one-line head declaration whose rendered output is
   byte-identical (`lang="en"` still lands on `<html>`, just from a different
   source). No wireframe markup, class or style changes.
4. **`scripts/check-routes.ts`** — add a whole-build gate (brief §5: every issue adds
   at least one assertion). The existing per-route loop only visits the nine §7
   routes, which is too narrow for an acceptance criterion phrased over *every*
   prerendered route. So the new gate walks every `*.html` file under
   `.output/public` and asserts each one's `<html>` element carries a non-empty
   `lang` attribute. That is the only form of the assertion that actually covers
   `/docs/**`, `/wireframes/**` and the 200/404 SPA fallbacks.

## Files

- `bfna-website-nuxt/src/nuxt.config.ts` (add `app.head.htmlAttrs`)
- `bfna-website-nuxt/src/layouts/bf-default.vue` (remove `htmlAttrs`)
- `bfna-website-nuxt/src/layouts/wireframe.vue` (remove `htmlAttrs`)
- `bfna-website-nuxt/scripts/check-routes.ts` (new `langRows()` build gate)
- `docs/plans/gh217-plan.md` (this file)

## Verification

- `npx nuxt generate` (**never** `npm run generate` — it runs the Directus importer).
- `npx tsx scripts/check-routes.ts` — the new build gate must report 0 HTML files
  without a `lang`, and the number of files it scanned must be > the 9 routes.
- Before/after grep over `.output/public` for `<html` without `lang=`, to show the
  `/docs/**` files that were failing and now are not.
- Browser: `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`, then read
  `document.documentElement.lang` on a bf route, a `/wireframes/` route and a
  `/docs/**` route.
- `npx tsx scripts/check-links.ts` and the typecheck signature gate (baseline 90,
  `.github/typecheck-baseline.txt`) via CI.

## Risks

- **Unhead precedence.** `app.head` is the lowest-priority source; a later
  `useHead` could still override it. Nothing overrides `lang` after this change
  (grep for `htmlAttrs` returns only the two lines being deleted), so the risk is
  future drift, not present breakage — which is exactly what the new gate catches.
- **The new gate is broader than the old loop** and could surface a pre-existing
  `lang`-less file unrelated to this row (an SPA fallback, a generated demo page).
  If one appears, it is in scope: DoD-A9 is phrased over every prerendered route.
- **`check-routes.ts` runs only under `--only`-less invocations** for build gates;
  the new row sits inside the same `if (only === undefined)` block as the cascade
  and reachability gates, so a `--only` run stays fast.
