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

**D-47.1 — the Programs band is `bfSection` at its default `stack` layout with
a `<ul class="switcher">` inside it, not `<bfSection layout="switcher">`.**
The spec's §Scope item 3 asks for the prop, and the prop is not buildable as
written. `bfSection` renders its `heading` as an `<h2>` **inside the same inner
box as the slot** (`Section.vue`, `<div :class="innerClass">`), so
`layout="switcher"` makes the band's own heading a flex item beside the three
cards rather than a heading above them. Independently, `bfCard` renders an
`<li>` and warns at dev time unless its parent is a `<ul>`, an `<ol>` or a
`[role="list"]` (#29), which a `<div class="center | switcher">` is not — the
card group would lose its list semantics and stop being announced as "list, 3
items". The frozen wireframe's own shape is a `<ul class="switcher"
data-gap="m">` inside a default band, and that is what is built. `layout`
values stay useful for bands whose slot is a single non-list composition; a
band of cards is not one.

**D-47.2 — `Program` carries no short name, so the insight chip's relabelling
stays on the page.** `pages/wireframes/index.vue` shortens *Transatlantic
Relations & Global Challenges* to *Transatlantic Rel.* for the insight chips
and to *Transatlantic Relations* for the programme cards. Issue 09's
`bfProgramSchema` declares `slug`, `name`, `tagline`, `intro`, `image` — no
`short` — and `Insight.program` is the display **name**, not a relation, so
there is no field to read one from. The card-level short name is therefore
**dropped** (`bfCardProgram` takes the whole entity and renders `program.name`,
which is the point of #25's "no ad-hoc `{slug,name,short,tagline}` object"), and
the chip-level one is kept on the page as `shortProgram()`, ported verbatim.
Deriving a short name on the page would be the user-visible synthesis BRIEF §5
rule 10 forbids. **Gap recorded, not closed**: if the client wants the short
label back on the programme cards, it is a `short` field on `bfProgramSchema`
and a normaliser change (#07/#09), not a page change.

**D-47.3 — both hand-rolled bands take `data-min-width="xl"`.** The wireframe
pins two columns inline on the Featured-projects and Insights `<ul>`s. D-42.2's
measured table gives a 400px track floor **2 tracks at a desktop width**,
1 below — the pinned intent plus the reflow it never had. `bfGridInsights` is
left at its own `l` default (3 columns) rather than forced to match the band
above it: it is THE insights grid and must not drift from `/insights`.

**D-47.4 — the page renders a fragment, not a wrapper `<div>`.**
`layouts/bf-default.vue`'s `<main class="stack" data-gap="xl">` is the page's
stack. A single wrapper element would make the four bands *one* stack child and
collapse the `xl` rhythm between them to nothing.

**D-47.5 — residual #162 closed component-side, option 2.** `bfHero`'s actions
wrapper is now guarded on what the default slot **renders**
(`hasRenderedContent`, the vnode walk `bfPageHeader` adopted in gh#47) rather
than on `$slots.default`. This page's CTA is unconditional, so the bug cannot
fire here — the guard is adopted anyway because #162 asked for the decision to
be taken at the first real consumer and because the next `bfHero` call site
(#57–#60's hubs) is the one that will pass a conditional CTA. Regression row
added to probe 37, mounting the passed-but-empty-slot case for one tick and
withdrawing it, so the page's "exactly three `<h1>`s" assertion and issue 37's
own static grep both stay true. Deliberately **not** extracted into a shared
helper: two components is not a pattern.

**D-47.6 — no vitest.** Per the epic's test-harness decision (#86) the broken
vitest harness is not used. Acceptance is the spec's own greps, the full
`check-probes` run (38 probes, 1632 rows), and a smoke assertion on the
prerendered `/` HTML — all recorded in the issue journal.
