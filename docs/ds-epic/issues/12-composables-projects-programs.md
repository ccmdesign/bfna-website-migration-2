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
