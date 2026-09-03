# 47 — page-home — Home `/`

One-line objective: build `src/pages/index.vue` on `bf-default`, replacing
the legacy home page with the four wireframe-order bands.

## Context

Depends on #46 (`bf-default`), #37 (`bfHero`), #25 (`bfCardProgram`), #22
(`bfCardProject`), #23 (`bfCardFeatured`), #26 (`bfCardProduct`), #42
(`bfGridInsights`). Descends from `src/pages/wireframes/index.vue`.
Provenance: BF-196. **Review checkpoint 2** (brief §8) fires when this
merges. Retires exactly one file: `src/pages/index.vue` (the legacy home,
today reading `workstreams`/`highlights`/`publications`/`videos`/
`infographics`/`docs` collections per `02-legacy-retirement-inventory.md`
§A row 1) — no other legacy file. `pages/wireframes/index.vue` itself is
never touched (D2).

## Scope

- `src/pages/index.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, verbatim from `pages/wireframes/index.vue`:
  1. Announcement band — **layout-owned** (#46), not repeated here.
  2. `<bf-hero :heading="home?.heading" :description="home?.description">` with a primary CTA (`bfButton` `variant="primary"` `to="/democracy"`, label "Explore our work") in the actions slot.
  3. Programs — `<bf-section label="Programs" heading="Our Programs" layout="switcher">` wrapping `<bf-card-program v-for="a in programs()" :program="a" />` (pass the real `Program` type per component-inventory-v2 §2 fix — no ad-hoc `{slug,name,short,tagline}` object; `tagline` derivation, if still wanted, moves to the normaliser (#07), not this page).
  4. Featured projects — `<bf-section label="Featured projects" heading="Projects">` wrapping a `.grid[data-min-width]` `<ul>` of `<bf-card-project v-for="p in featuredProjects()" :project="p" media :chips="false" excerpt-length="160" />` — `bfCardProject` cards rendered directly inside the grid (mirroring the wf homepage, which uses `wf-card-project` with `media :chips="false"`), **not** via `bf-grid-projects` (no inline `grid-template-columns`, replaces `index.vue:29`'s hand-pinned 2-col style, D9) + trailing "All projects →" link to `/projects`.
  5. Insights — `<bf-section label="Insights" heading="Insights">` wrapping a grid of `<bf-card-product v-for="prod in allProducts()" />` + `<bf-card-featured v-for="h in highlights().slice(0,4)" />` (same `.grid[data-min-width]`, replaces `index.vue:39`'s inline style), then `<bf-grid-insights :insights="active.slice(0,6)" excerpt-length="160" :extra-chips="…" />`, then trailing "All insights →" link to `/insights`.
- Data: `const { active, highlights, featuredProjects, programs, announcement, allProducts } = useBfHome()`-equivalent composables from #11/#12 (`useBfInsights`, `useBfProjects`, `useBfPrograms`), plus `homePage` from `useBfPages()` (#13) for the hero's heading/description — **this page is a data reader, permitted under D8 (pages, not components, may call composables)**.
- Composable → prop map: `useBfPages().homePage` → `bfHero.heading`/`bfHero.description`; `useBfPrograms().programs` → `bfCardProgram.program`; `useBfProjects().featuredProjects` → `bfCardProject.project` (v-for); `useBfProjects().allProducts` → `bfCardProduct.product`; `useBfInsights().highlights` → `bfCardFeatured.item`; `useBfInsights().active` → `bfGridInsights.insights`.
- Consumes collections: `bfPrograms`, `bfProjects`, `bfInsights`, `bfAnnouncements` (announcement via the layout, not this page).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Any legacy file other than `src/pages/index.vue` (the rest is #57/#58).
- New sections beyond the four wireframe bands.

## Styling

- Tokens: existing semantic tokens only, no new colour.
- Primitives: `.switcher` (Programs), `.grid[data-min-width]` (Featured
  projects, Insights) — no hand-pinned `grid-template-columns` anywhere on
  this page (D9).
- `bfSection`/`bfHero`/`bfCard*` own their `--_bf-*` variables; this page
  passes no style overrides.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/index.html                          # `/` prerendered
! grep -q "grid-template-columns" bfna-website-nuxt/src/pages/index.vue      # no inline column styles remain (D9)
test ! -f bfna-website-nuxt/src/pages/index.vue.legacy                       # legacy content is gone, not archived
diff <(git show HEAD~1:bfna-website-nuxt/src/pages/wireframes/index.vue) bfna-website-nuxt/src/pages/wireframes/index.vue   # empty — wf source untouched (DoD-4)
```

## Decisions

_Runner appends here._
