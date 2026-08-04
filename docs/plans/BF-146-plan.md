# BF-146 — Democracy page: 4 projects, reinstate Disrupting Democracy

## Decision source
Aug 4 call decisions for the Democracy program page.

## Required end state
Democracy program page (`/wireframes/democracy`) grid resolves to **exactly 4** projects:
1. Disrupting Democracy: Graphic Images
2. City Solutions Series
3. Election Analysis
4. How to Fix Democracy ↗ (external)

## What was already satisfied by earlier sub-items
- **BF-149** reinstated *Disrupting Democracy: Graphic Images* (`graphic-images`) to
  `archived: false`. Verified — the data-side reinstatement is done.
- **BF-145** added the reusable grid filter `gridProjectsByProgram()` in
  `useWfContent.ts` with predicate `!archived && !exclude_from_grid && !external_only
  && kind !== 'podcast'`. The `/wireframes/[area]` route is a single shared page, so the
  Democracy page already uses the same grid logic — no page/component change needed.

## Gap found and fixed (this ticket)
The grid was yielding only **3** projects. `how-to-fix-democracy` was still
`archived: true` (BF-149 reinstated only Disrupting Democracy; it did not touch How to
Fix Democracy). That is a stray archived flag on a row the Aug 4 call requires to be
active — corrected to `archived: false`.

- `how-to-fix-democracy` is `kind: podcast-series` (NOT `kind: podcast`), so it is not
  pruned by the grid predicate — unlike the real podcasts `bridging-the-atlantic` and
  `wisdom-of-the-crowd` (`kind: podcast` + `exclude_from_grid: true`). This distinction
  is the existing convention for a flagship project that happens to be a podcast.
- External ↗ affordance: `how-to-fix-democracy` already carries
  `external_url: https://www.howtofixdemocracy.org/`. The project card
  (`wfCardProject.vue`) renders the trailing ` ↗` and the "External platform" chip
  whenever `external_url` is set — consistent with every other ↗ project. No further
  data change needed for the external affordance.

## City Solutions — "don't feature prominently"
No-op by design. The program-page grid renders all cards uniformly via `v-for` with no
featured/hero treatment. `city-solutions-series` is not in `FEATURED_SLUGS` or
`NAV_SLUGS` (those only affect the homepage/nav, not this grid). Nothing elevates City
Solutions, so there is nothing to de-emphasise. No new de-emphasis feature was added
(would be over-engineering). Irene's note that it may archive later is a future-data
change, not a wireframe change now.

## Change set
- `bfna-website-nuxt/src/assets/wireframe-data/projects.json`:
  `how-to-fix-democracy.archived` `true → false` (single line).

## Verification
Simulated the grid predicate against the dataset — Democracy resolves to exactly the 4
required projects, How to Fix Democracy carrying the external ↗. No fabricated rows.
