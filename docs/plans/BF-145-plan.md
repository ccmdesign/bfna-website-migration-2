# BF-145 — TR&GC page: prune to 6 projects, Transponder as product

## Aug 4 call decisions
- TR&GC program grid = 6 active projects: Periscope, Barometer, RANGE, Astropolitics, Indo-Pacific Nexus, Critical Minerals.
- Remove from grid: Bridging the Atlantic, Wisdom of the Crowd (podcasts → nav Podcasts button, no page).
- The Transponder = a distinct PRODUCT within TR&GC (external-only), rendered as its own band, not a grid card.

## Data state (BF-149, already merged into dev)
projects.json TR&GC top-level rows:
- KEEP (archived:false): transatlantic-periscope, range, transatlantic-barometer, astropolitics, indo-pacific-nexus, critical-minerals
- bridging-the-atlantic: kind:podcast, exclude_from_grid:true
- wisdom-of-the-crowd: kind:podcast, exclude_from_grid:true
- transponder-magazine: kind:podcast, external_only:true, external_url:null (copy/URL pending Q6)
- bfna-documentaries: archived:true (Documentaries → external nav button, BF-142)

## Approach (data-driven, no slug hardcoding)
### useWfContent.ts
1. Extend `WfProject` interface with the BF-149 flags: `archived?`, `exclude_from_grid?`, `external_only?`.
2. Add `KIND_LABELS['podcast'] = 'Podcast'` (kind `podcast` had no label).
3. Add a grid-eligibility predicate `inProjectGrid(p)` = `!archived && !exclude_from_grid && !external_only && kind !== 'podcast'`.
4. New method `gridProjectsByProgram(program)` = topProjects in program AND `inProjectGrid`. Used by the program-page grid.
5. New method `productsByProgram(program)` = topProjects in program AND `external_only` (the Transponder band, data-driven).
6. Leave `projectsByProgram` UNCHANGED so the all-projects index (`projects/index.vue`) keeps showing every project (podcasts, archived, products) — no regression there.

### [area].vue (dynamic route for ALL program pages)
- Grid uses `gridProjectsByProgram(area.name)` → TR&GC resolves to exactly the 6.
- Add a "Product" band after the grid, iterating `productsByProgram(area.name)`:
  - reads real dataset fields (heading, excerpt, image);
  - renders external CTA only when `external_url` is set; otherwise an obvious "external link pending (Q6)" status note (matches existing "Copy pending Qx" wireframe convention). No fabricated copy/URL.
  - band renders only when the program actually has an external-only product (so Democracy / Future Leadership are unaffected unless data flags one).

## Cross-page effect (noted, not a bug)
`[area].vue` is one shared route, so the active-only grid applies to every program page. Consequence: Democracy grid drops `how-to-fix-democracy` (archived podcast-series) and Future Leadership drops `summer-enrichment-series` (archived) from their program grids. This is correct "active projects" behavior and is driven by the `archived` flag in data (toggle data, not code). Reusable by BF-146. Flag in Plane comment.

## Verification
- Reason over the filter row-by-row: TR&GC grid = 6, products = [transponder].
- Re-read diff; confirm no fabricated copy, CTA omitted when external_url null.
- Browser test skipped (orchestrator runs consolidated UI verification).
