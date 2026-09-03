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

_Runner appends here._
