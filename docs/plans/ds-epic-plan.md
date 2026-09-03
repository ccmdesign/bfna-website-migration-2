# Plan — DS epic: bf-* components + templates at `/` (BF-217)

**Epic:** https://app.plane.so/ccm-design/browse/BF-217/
**Brief (what every run obeys):** [docs/ds-epic/BRIEF.md](../ds-epic/BRIEF.md)
**Ordered issue index:** [docs/ds-epic/issues.md](../ds-epic/issues.md)
**Per-issue specs:** `docs/ds-epic/issues/<NN>-<slug>.md` (59 files)
**Groundwork:** `docs/ds-epic/00-guidelines-digest.md`, `01-data-layer-audit.md`, `02-legacy-retirement-inventory.md`
**Inventory it implements:** `_process/scoping/component-inventory-v2/component-inventory-v2.md`

## Objective
Build the `bf-*` design-system components (iteration-2 inventory, 46 components) and the page
templates so the new site lives at `/`, fed by the wireframe content snapshots through
`@nuxt/content` collections. `/wireframes/*` and every `wf-*` source file stay byte-identical.
Base styling only: existing Utopia space/type + colour tokens, CUBE composition, no art direction.

## Ground rules (full text in BRIEF.md)
- Base branch `dev`, auto-merge on green. No CI is configured, so "green" = no failing checks.
- Never edit `pages/wireframes/**`, `components/wireframe/**`, `layouts/wireframe.vue`,
  `public/css/wireframe.css`. Never add a colour. Components are presentational-only.
- Build verification is `npx nuxt generate` (never `npm run generate` — it runs the Directus
  importer and needs absent secrets).
- Shared types live only in `src/types/bf-contracts.ts`.

## Phases
| Phase | Issues | Gate |
|---|---|---|
| 0 Docs | 1 | amends app CLAUDE.md/AGENTS.md to bf-* — nothing runs before it |
| 1 Composition | 5 | `data-gap`, `data-min-width`, `data-measure` fixed |
| 2 Data | 7 | normaliser → `content/` → 6 zod collections → thin composables |
| 3 Atoms | 6 | |
| 4 Molecules | 15 | `bfCard` base before six typed wrappers |
| 5 Organisms | 11 | nav/footer take `menus` prop |
| 6 Templates | 11 | in nav order; program hub has `validate` guard |
| 7 Cutover | 3 | redirects, legacy retirement, config touchpoints — last |

## Unit decomposition
59 units, one per row of [issues.md](../ds-epic/issues.md), **execution order = dependency
order** (no unit depends on a higher-numbered one). Each unit's title, scope paragraph,
acceptance test and `depends-on` are in that table; the full spec is its `issues/<NN>-*.md` file.
GitHub Issues are created from those rows with `Blocked-by:` lines derived from `depends-on`.

## Human checkpoints (Plane review tasks, not issues)
- after Phase 2 (composable layer) — Claudio
- after the first template (issue 47, homepage) — Aline on the deploy preview
- Plane epics E0–E5 (BF-150…215) are cancelled as superseded by BF-217.
