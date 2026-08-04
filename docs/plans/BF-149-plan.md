# BF-149 — Apply the Aug 4 call mapping to wireframe data

## Scope
Data-only edits to the wireframe dataset. No page/component/composable code changes
(rendering changes are noted for the page sub-items). Files are mirrored, so both copies
stay in sync:

- Source (per `useWfContent.ts` header, sync direction is inventory → wireframe):
  `_process/scoping/inventory/data/projects.json`
- Served copy:
  `bfna-website-nuxt/src/assets/wireframe-data/projects.json`

`programs.json` needs no change (3 programs already correct; Democracy already active).

## Discovered conventions
- `archived`: `false` = explicitly active (5 rows today), `true` = archived (22),
  `null` = unclassified super/irene-docx rows (11). Active set → use `archived: false`.
- Grid membership: `useWfContent.projectsByProgram(program)` filters top-level projects
  (`!parent_project`) by `program`. There is **no** archived filter on projects and **no**
  existing "exclude from grid" or "external-only" flag. New flags introduced here must be
  consumed by the page sub-items.
- `kind`: free-string classifier (e.g. `podcast-series`, `research-initiative`).
  Task says flag `kind: podcast`; `KIND_LABELS` has no `podcast` entry yet (page/label map
  gap — noted).

## Edits (projects.json items)

1. **Disrupting Democracy** (`graphic-images`) — reinstate ACTIVE under Democracy:
   `archived: null → false`. Program already `Democracy`. ✓

2. **TR&GC active projects** → `archived: false`:
   - `transatlantic-periscope` (true → false)
   - `transatlantic-barometer` (true → false)
   - `range` (true → false)
   - `astropolitics` (null → false)
   - `indo-pacific-nexus` (null → false)
   - `critical-minerals` (null → false)

3. **Bridging the Atlantic** (`bridging-the-atlantic`) + **Wisdom of the Crowd**
   (`wisdom-of-the-crowd`) — keep rows, flag as podcasts, exclude from the TR&GC grid:
   - `program: "RE-TAG (was fake category: Podcasts)" → "Transatlantic Relations & Global Challenges"`
   - `kind: null → "podcast"`
   - add `"exclude_from_grid": true` (NEW flag — page sub-item must honor it so these do
     not render in the TR&GC project grid; no Podcasts page exists, nav links out)

4. **The Transponder** (`transponder-magazine`) — TR&GC product, podcast external-only:
   - `program` already `Transatlantic Relations & Global Challenges` ✓
   - `kind: null → "podcast"`
   - add `"external_only": true` (NEW flag — links out to the platform; stays visible in
     the grid as a TR&GC product)

5. **Future Leadership** — unchanged (Fellowship + cohorts, SES + cohorts,
   Leadership in Action already correct).

## Not applied (noted, no fabrication)
- **Indo-Pacific in Focus**: no standalone row exists anywhere in the dataset
  (grep found only `Indo-Pacific Nexus`). The mapping says it is NOT standalone and should
  attach to Indo-Pacific Nexus — since no standalone row exists, that end-state already
  holds. No placeholder created (would fabricate content). Noted in Plane.
- **Transponder external_url** is `null` (copy pending Q6). `external_only: true` records
  intent; URL left untouched (no fabrication).
- **KIND_LABELS** lacks a `podcast` entry; new `exclude_from_grid` / `external_only` flags
  are not yet read by any page. Flagged for the page sub-items.
- Metadata (`count`, `note`, `pending_copy`) untouched — no rows added/removed.

## Verification
- `python3 -m json.tool <file> > /dev/null` on both copies (valid JSON).
- `diff` the two copies (must stay identical / mirrored).
- Re-read edited rows to confirm each mapping bullet applied.
- No `npm run generate` / `build` (would overwrite from Directus).
