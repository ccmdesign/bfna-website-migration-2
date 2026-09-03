# 12 — composables-projects-programs

Port the project and program surface of `useWfContent` to `useBfProjects`
and `useBfPrograms`.

## Context

Depends on 11 (project composable follows the same established pattern;
sequenced after so both composables in this family land together, per
issues.md row order). Blocks 13, and every template issue reading
projects/programs (47-48, 51-55). Builds from `useWfContent.ts` (project-
and program-related members, lines 224-254). Provenance: 01 §E.

## Scope

- New `bfna-website-nuxt/src/composables/data/useBfProjects.ts` — wraps
  `queryCollection('bfProjects')`, same `useAsyncData` pattern as issue 11.
  Members (same names/signatures as `useWfContent`):
  - `projects()` — top-level only (`parent_project == null`).
  - `projectsByProgram(program)` — top-level, filtered by `program`.
  - `gridProjectsByProgram(program)` — filtered by the normaliser's stored
    `grid_eligible === true` flag (issue 07), sorted by the stored
    `grid_order` field (also issue 07 — replaces the old runtime
    `GRID_ORDER` lookup + `gridSort`). **No re-derivation of the curated
    order here** — the sort key already exists on the document.
  - `productsByProgram(program)` — filtered by `external_only === true`
    and `program`.
  - `allProducts()` — all items with `external_only === true`.
  - `projectsPendingRetag()` — `program` starting with `'RE-TAG'` and not
    `archived`.
  - `projectBySlug(slug)` — any project incl. children (`parent_project`
    set).
  - `projectChildren(slug)` — items where `parent_project === slug`,
    sorted `heading` desc.
  - `navProjects()` — items where the normaliser's stored `nav === true`
    flag is set (issue 07's materialised `NAV_SLUGS` curation), in stored
    order.
  - `featuredProjects()` — items where `featured === true` (issue 07's
    materialised `FEATURED_SLUGS` curation), in stored order.
- New `bfna-website-nuxt/src/composables/data/useBfPrograms.ts` — wraps
  `queryCollection('bfPrograms')`. Members: `programs()` (all 3),
  `programBySlug(slug)`.
- **Thin wrappers only** — `queryCollection` + `.filter()`/`.sort()`/array
  methods on the returned data. The curation flags (`grid_eligible`,
  `grid_order`, `nav`, `featured`) are read, never recomputed.

## Out of scope

- `people`, `pages`, `announcements`, `menus` (issue 13).
- Any component importing either composable directly (D8 — pages/layout
  only).
- Re-deriving `GRID_ORDER`/`NAV_SLUGS`/`FEATURED_SLUGS` locally — that
  logic lives in the normaliser (issue 07) only.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — composable/data issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/composables/data/useBfProjects.ts
test -f src/composables/data/useBfPrograms.ts
grep -c "queryCollection('bfProjects')" src/composables/data/useBfProjects.ts   # after: >=1
grep -c "queryCollection('bfPrograms')" src/composables/data/useBfPrograms.ts   # after: >=1
```
Plus a probe page showing `gridProjectsByProgram` returning the
client-ordered set for each of the 3 programs (Democracy's 4-slug order,
Future Leadership's 3-slug order, and the unlisted third program's dataset
order) and `projectChildren` sorted desc (per the issues.md `verify`
column — manual/rendered check).

## Decisions

_Runner appends here._

### Appended by the item-runner (gh#21)

- **`FEATURED_SLUGS` / `NAV_SLUGS` live in `useBfProjects.ts`, as ordering keys
  only.** The spec's "no re-derivation of the curated order" rule is written
  against `GRID_ORDER`, which the normaliser *did* materialise (`grid_order`).
  Curation **order** for the homepage strip and the nav was deliberately not
  stored — issue 07's Decisions, verbatim: *"Curation order is not stored.
  `FEATURED_SLUGS`/`NAV_SLUGS` order the homepage and nav lists today; issue
  09's schema declares only `featured`/`nav` booleans, so the ordering
  constants belong to the composables in issue 12."* So the two arrays are
  re-declared here and used **only to sort**: the stored `featured` / `nav`
  flag still selects the set, and a flagged document missing from the array is
  appended rather than dropped. Flag a sixth project `nav` in the normaliser
  and it appears in `navProjects()` with no edit to this file. `GRID_ORDER` is
  not re-declared anywhere in the composable.

- **The third program's grid falls back to collection order, not snapshot
  order.** `GRID_ORDER` places only Democracy (4 slugs) and Future Leadership
  (3). Transatlantic Relations & Global Challenges is unlisted, so all six of
  its grid-eligible projects store `grid_order = Number.MAX_SAFE_INTEGER` and
  the stable sort is a no-op — leaving whatever order `queryCollection` returns
  (file-stem, i.e. alphabetical) where `useWfContent` left wireframe-snapshot
  order. The **set** is identical; the sequence is not:

  | | order |
  |---|---|
  | `useWfContent` | periscope, range, barometer, astropolitics, indo-pacific-nexus, critical-minerals |
  | `useBfProjects` | astropolitics, critical-minerals, indo-pacific-nexus, range, barometer, periscope |

  This is the same class of divergence gh#20's probe already recorded for
  `publish_date` ties ("a tie resolves to input order — snapshot order in the
  wireframe, file-stem order here"), now visible across a whole grid rather
  than one pair. Fixing it means storing a snapshot ordinal on the document,
  which is normaliser scope (issues 07/08) and explicitly out of scope here, so
  it is **handed off as a residual** rather than patched with a local sort that
  the spec forbids. The probe therefore asserts the TR&GC **set** (sorted) plus
  an explicit assertion that the program carries no curated order at all, and
  asserts the full ordered sequence for the two programs that do.

- **Acceptance is the probe page, not vitest** (epic-wide substitution,
  residual #86 — the harness on `dev` is broken and pre-existing). The probe at
  `src/pages/bf-probe/12-composables-projects-programs.vue` runs 36 checks and
  is a *parity* test: every expected value was computed offline from
  `projects.json` / `programs.json` through `useWfContent`'s own predicates
  (`inProjectGrid`, `gridSort` + `GRID_ORDER`, the two slug arrays, the
  `heading`-desc child comparator) and hard-coded, so a passing row means
  agreement with the wireframe rather than with the implementation. Verified
  against the prerendered output of `npx nuxt generate`: **36/36 PASS**, with
  probes 09 and 11 still green.

- **The `projectsAll` / `topProjects` split is reproduced, not invented.** The
  collection holds all 38 documents; 18 are top-level and 20 are cohort/year
  children hanging off `parent_project`. Every *list* member (`projects`,
  `projectsByProgram`, `gridProjectsByProgram`, `productsByProgram`,
  `allProducts`, `projectsPendingRetag`) reads the 18; `projectBySlug` and
  `projectChildren` read all 38 — exactly the split `useWfContent` keeps.

- **`projectsPendingRetag()` is empty today and that is correct.** The only
  `RE-TAG (was fake category: Archives)` row is `100-questions`, which is
  archived, and the member excludes archived rows (Claudio, Aug 5). The probe
  asserts `0` rather than skipping the member.

- Gates: typecheck **178** `error TS` = the 178 baseline, **0** in the scoped
  paths and **0** in the three new files; `npx nuxt generate` exits 0 (747
  routes); both wireframe byte-identity diffs — `dev...HEAD` and against the
  pre-epic base `f757a64` — print nothing, as does the wider DoD-4 set
  (`useWfContent.ts`, `assets/wireframe-data`, `public/css/wireframe.css`).

- **The TR&GC ordering divergence recorded above is fixed upstream, not here** (gh#89).
  This spec put re-deriving curated order out of scope for the composable — "that logic lives
  in the normaliser (issue 07) only" — so `useBfProjects` is unchanged; the normaliser now
  emits `GRID_ORDER_FALLBACK (1_000_000) + <snapshot index>` in place of the
  `Number.MAX_SAFE_INTEGER` sentinel (issue 07 Decisions). Probe 12's TR&GC row is
  correspondingly tightened from a sorted-**set** assertion to the full **ordered sequence** —
  `transatlantic-periscope, range, transatlantic-barometer, astropolitics, indo-pacific-nexus,
  critical-minerals`, i.e. `useWfContent`'s own `gridProjectsByProgram(TRGC)` output — plus two
  supporting checks: the TR&GC ordinals are strictly ascending fallbacks, and no project
  anywhere still carries the sentinel. Acceptance stays the probe rendered by a real
  `npx nuxt generate` (vitest harness broken, residual #86): **37/37 PASS**, with probes 09,
  11 and 13 still green at 18/18, 21/21 and 34/34.

- **`useBfProjects.ts:117-124`'s doc comment still describes the removed
  `Number.MAX_SAFE_INTEGER` sentinel.** gh#89's brief forbids touching the composable, so the
  comment is left stale deliberately and raised as a residual rather than edited in passing.
