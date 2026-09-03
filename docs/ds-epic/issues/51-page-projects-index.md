# 51 — page-projects-index — Projects index `/projects`

One-line objective: build `src/pages/projects/index.vue` on `bf-default`,
one project band per program in curated order plus a conditional
pending-retag band.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #42 (`bfGridProjects`),
#12 (`useBfProjects`/`useBfPrograms`). Descends from
`src/pages/wireframes/projects/index.vue`. Provenance: BF-203. No legacy
file retired (nearest legacy analog is the `[...slug].vue` product branch,
retired by #58/#57).

## Scope

- `src/pages/projects/index.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/projects/index.vue`:
  1. `<bf-page-header label="Projects index" :crumbs="[{label:'Home',to:'/'}]" :heading="indexPage?.heading ?? 'All Projects'" :tagline="indexPage?.description" />`.
  2. One `<bf-section :label="program.name">` per `useBfPrograms().programs()` entry (`v-for`), each with an `<h2>` link to `/${program.slug}` then `<bf-grid-projects :projects="gridProjectsByProgram(program.name)" excerpt-length="120" />`.
  3. Conditional "Pending re-tag (Q3)" — `<bf-section v-if="retag.length" label="Pending re-tag (Q3)" heading="Pending re-tag">` wrapping `<bf-grid-projects :projects="retag" excerpt-length="120" />`.
- Ordering: **never re-derive** — consume `gridProjectsByProgram` and
  `projectsPendingRetag` exactly as `useBfProjects` (#12) returns them; the
  curated `GRID_ORDER` lives in the normaliser (#07/D3), not this page.
- Composable → prop map: `useBfPrograms().programs` → the per-program
  `bfSection` loop; `useBfProjects().gridProjectsByProgram(program.name)` →
  `bfGridProjects.projects`; `useBfProjects().projectsPendingRetag()` →
  the pending band's `bfGridProjects.projects`.
- Consumes collections: `bfProjects`, `bfPrograms`.

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Filters or search on this page (that's #54).
- The project detail route (#52).
- Product-only listings (products render on `/` via `bfCardProduct`, #47).

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `.grid[data-min-width]` inside `bfGridProjects` — no
  hand-pinned columns on this page.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/projects/index.html               # /projects prerenders
grep -c "bf-section" bfna-website-nuxt/src/pages/projects/index.vue        # >= 3 (one per program) + conditional pending band
grep -q "pending" bfna-website-nuxt/src/pages/projects/index.vue           # pending band present, gated by retag.length
```

## Decisions

**D-51.1 — the breadcrumb gets a second crumb (residual
[#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188)).**
The spec above quotes the frozen source's one-entry trail
`[{ label: 'Home', to: '/' }]`. That is a defect against `bfBreadcrumb` as
built in #20, whose rule is positional: *the last crumb is never a link*,
`to` or no `to`. A one-entry trail therefore renders Home as
`<span aria-current="page">Home</span>` — a breadcrumb that claims the reader
is on the homepage and contains no link at all. The page ships
`[{ label: 'Home', to: '/' }, { label: 'Projects' }]`; Home is a real
`<a href="/">` and `aria-current="page"` lands on *Projects*. The fix is at the
call site, not in the component — the component's rule is right, and this is
the same two-then-current shape `insights/[slug].vue` already builds for the
same reason. `/insights` (#49) still carries the one-entry trail and is left to
#188.

**D-51.2 — the per-program `<h2>` is slot content, and the band is named by
`aria-labelledby`.** `bfSection`'s `heading` prop renders plain text and cannot
carry a link, so the linked heading goes in the default slot exactly as the
frozen source puts it there. The band would then be an unnamed `<section>`
rather than a named `region` landmark, so the page passes
`:aria-labelledby="bandHeadingId(program.slug)"` and gives the `<h2>` the
matching `id` — `bfSection`'s attribute allowlist forwards `aria-*`, and
`v-bind="rootAttrs"` is last, so a call-site value wins over the prop-derived
one.

**D-51.3 — the band ids are slug-derived, not `useId()`.** `useId()` returns
one value per *component instance*; this page is a single instance rendering
three bands, so one `useId()` call would give all three the same id and the
second and third `aria-labelledby` would both resolve to the first band's
heading. The program slug is unique by construction (it is the `/{program}`
route segment) and identical across the server render and hydration, which is
the other property `useId()` is normally relied on for.

**D-51.4 — no legacy file retired, and none needed to be.** BRIEF §5 rule 7
asks a template issue to delete the one *page file* that owned its route.
`pages/projects/` did not exist; `/projects` was answered, if at all, by the
legacy catch-all `pages/[...slug].vue`, which vue-router ranks below a static
route segment. Adding this file takes the route without deleting anything, and
the catch-all's product branch is retired by #58/#57.

**D-51.5 — verification is on the generated HTML, not vitest.** The vitest
harness on `dev` is pre-existing broken (residual
[#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)) and is
not repaired here. The spec's own greps are kept, and the real acceptance is a
diff of the `<h3>` card titles in `.output/public/projects/index.html` against
`.output/public/wireframes/projects/index.html` — **13 titles, identical
strings in identical order** (see the parity note below). No probe page is
added: probes stop at #46 and this is a template issue; the full
`npx tsx scripts/check-probes.ts` is run as a regression gate instead (38
probes, 1635 rows, 0 failures).

**Parity note — 13 here, not 14.** The epic's parity figure of 14 project links
counts `transponder-magazine`, which is `external_only` with
`grid_eligible: false`. `gridProjectsByProgram` prunes it, on both the wireframe
and here, and it renders as a `bfCardProduct` band on `/` (#47). The measured
split is Democracy 4 / Transatlantic Relations & Global Challenges 6 / Future
Leadership 3 = 13, and the wireframe's own `/wireframes/projects` output
contains exactly the same 13.

**Pending-retag band renders nothing today.** `projectsPendingRetag()` returns
0 rows — 100 Questions, its only historical member, is archived. That is why
the band is `v-if`'d rather than unconditional, and the acceptance asserts its
*absence* from the generated HTML as the correct gated state.

**D-51.6 — the bands are resolved once at setup, not from the template.**
Self-review, P3. `gridProjectsByProgram()` called from inside a `v-for` re-runs
on every render — three `.filter().sort()` passes over the 18 top-level
projects, handing `bfGridProjects` three freshly-allocated arrays each time.
The content is build-time static, so one pass is all it can ever need. The page
builds a `bands` array of `{ program, headingId, projects }` in `<script
setup>` instead, which is the shape `[program].vue` already uses. No ordering
is re-derived by this: both orders still arrive sorted from the composables.

**D-51.7 — the slotted `<h2>` carries `bf-section__heading`.** Self-review, P3.
`bfSection` puts that class on the heading it renders itself; a slotted heading
is still that band's heading, so it carries the same hook. The class holds no
declarations today — it is a selector hook, and a hook that is absent from
three bands is a skin bug waiting for whoever writes the first
`.bf-section__heading` rule.

### Verification record (gh#60)

| gate | result |
|---|---|
| typecheck baseline (before) | 176 `error TS` |
| typecheck (after) | 176 — no new errors |
| `error TS` in `src/(components/bf\|types\|composables/bf)` / `content.config` | 0 |
| `npx nuxt generate` | exit 0, 1130 routes |
| `.output/public/projects/index.html` | present |
| `<h3>` card titles vs. wireframe | 13 / 13, identical and in order |
| bands rendered | 3 (`data-label` = Democracy, Transatlantic Relations & Global Challenges, Future Leadership) + the header |
| pending band | absent (set is empty) — correctly gated |
| breadcrumb | `<a href="/">Home</a>` + `<span aria-current="page">Projects</span>` |
| `<h1>` count | 1 |
| `grid-template-columns` in the page | 0 |
| `npx tsx scripts/check-probes.ts` | PASS — 38 probes, 1635 rows, 0 failures |
| wireframe byte-identity (epic base → HEAD) | empty |
