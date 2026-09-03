# gh#56 / issue 47 — Home `/` — implementation plan

Spec: `docs/ds-epic/issues/47-page-home.md`. Written inline by the item runner
(ce-plan skipped — the spec is already a plan-grade document and the pipeline
mode would only restate it).

## Approach

Replace the **whole content** of `bfna-website-nuxt/src/pages/index.vue` — the
legacy home reading `workstreams` / `highlights` / `publications` / `videos` /
`infographics` / `docs` — with a `bf-default` template composed of the four
wireframe bands, in `pages/wireframes/index.vue` order. No `.legacy` copy is
kept (the spec's own acceptance greps for its absence).

The page is a **data reader** (D8 permits pages, not components, to call
composables). Five awaited composable calls, all resolved at setup:

| band | data |
|---|---|
| hero | `useBfPages().homePage()` → `heading` / `description` |
| programs | `useBfPrograms().programs()` → `Program` entities, passed whole |
| featured projects | `useBfProjects().featuredProjects()` |
| insights (products) | `useBfProjects().allProducts()` |
| insights (featured strip) | `useBfInsights().highlights().slice(0, 4)` |
| insights (grid) | `useBfInsights().active.slice(0, 6)` |

The announcement band is **layout-owned** (`layouts/bf-default.vue`, gh#55) and
is deliberately not repeated here.

## Files

- `bfna-website-nuxt/src/pages/index.vue` — rewritten end to end.
- `bfna-website-nuxt/src/components/bf/Hero.vue` — one-line-scope fix for
  residual #162 (vnode-based slot guard, the shape `PageHeader.vue` adopted in
  gh#47). Sanctioned by the runner brief.
- `bfna-website-nuxt/src/pages/bf-probe/37-bf-hero.vue` — one new row proving
  the #162 case, mounted transiently so the page's "exactly three `<h1>`s"
  assertion (and issue 37's static grep) stay true.
- `docs/ds-epic/issues/47-page-home.md` — Decisions appended.

No new probe page: `/` **is** the probe for this issue, and the acceptance
curls its prerendered HTML.

## Layout policy (D9 — zero `grid-template-columns` in the page)

The wireframe pins `repeat(2, 1fr)` inline on both the Featured-projects and
the Insights `<ul>`. Both become `.grid[data-min-width="xl"][data-gap="m"]`:
per D-42.2's measured table, a 400px track floor resolves **2 tracks at a
desktop width** and collapses to 1 below — the pinned intent, reflowing.

## Test strategy

1. `npx nuxt typecheck` — gate is **no new errors** against the recorded
   baseline of **178** (scoped `src/components/bf|types|composables/bf|content.config`
   count must stay **0**). The legacy home contributes 2 of the 178 and its
   removal should lower the total.
2. `npx nuxt generate` exits 0 and emits `.output/public/index.html`.
3. Spec acceptance greps: no `grid-template-columns` in the page, no
   `index.vue.legacy`, wireframe source byte-identical.
4. `npx tsx scripts/check-probes.ts --only 37` **and** the full
   `check-probes` run — both exit 0 (probe harness rule since #109).
5. Smoke: curl the generated `/` HTML and assert nav, footer, one `<h1>`,
   three programme cards, the featured-projects band and the insights bands
   all carry real data.

The vitest harness on `dev` is broken and pre-existing (#86); nothing here
depends on it.

## Risks

- **`layout="switcher"` on the Programs band** (spec §Scope item 3) is not
  buildable as written — see D-47.1 in the spec's Decisions. Resolved in favour
  of wireframe parity plus the `bfCard` list contract.
- **`bfHero` slot guard.** The #162 fix is a behaviour change to a shared
  component. It is strictly narrowing (a slot that renders content still
  renders content), regression-covered by probe 37, and every existing consumer
  is a probe.
- **Prerender crawl.** Legacy routes still 500 during `nuxt generate` on `dev`;
  that is pre-existing and #68's to clean up. Only `/` is this issue's.
