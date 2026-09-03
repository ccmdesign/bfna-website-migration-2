# gh#140 — 09b Data: boolean flags are never null in `content/bf/**`

Promoted residual: [#139](https://github.com/ccmdesign/bfna-website-migration-2/issues/139) (D-26.4).
Epic: https://app.plane.so/ccm-design/browse/BF-217/

## Problem

`queryCollection('bfProjects').where('external_only', '=', true).all()` returns **zero rows**
although `content/bf/projects/transponder-magazine.json` carries `"external_only": true`.
The column is a *nullable* boolean (`z.boolean().nullable()`), and `@nuxt/content`'s SQLite
store does not round-trip a nullable boolean in a shape the `= true` predicate matches.
Non-nullable flags (`featured`, `nav`, `board`, `retired_news`, `grid_eligible`) work — probe
23 already filters on `featured`.

Every consumer so far (`useBfInsights`, `useBfProjects`, `bfCardRow`, `bfCardInsight`) filters
with a **truthiness** test in JS after `.all()`, which hides the trap. Templates from #55 on
will push the filter into the query and silently render an empty section.

## Approach — fix it at the data layer, not in components

`archived: null` and `archived: false` mean the same thing to every consumer, so the null
state carries no information. Collapse it in the normaliser.

### 1. Normaliser (`bfna-website-nuxt/scripts/normalise-wireframe-data.ts`)

Replace the `boolOrNull()` helper with `boolFlag()` — `null | undefined → false`, anything
else `Boolean(v)` — at every boolean-flag emission site:

| collection | field | current shape | new shape |
|---|---|---|---|
| `bfInsights` | `archived` | 256 true / 95 false / **20 null** | 256 true / 115 false |
| `bfInsights` | `evergreen` | 371 false (schema nullable) | 371 false |
| `bfProjects` | `archived` | 17 true / 14 false / **7 null** | 17 true / 21 false |
| `bfProjects` | `exclude_from_grid` | 2 true / **36 null** | 2 true / 36 false |
| `bfProjects` | `external_only` | 1 true / **37 null** | 1 true / 37 false |
| `bfPages` | `archived` | 7 false (schema nullable) | 7 false |
| `bfPages` | `evergreen` | 7 true (schema nullable) | 7 true |

Already non-nullable and untouched: `featured`, `retired_news` (insights), `featured`, `nav`,
`grid_eligible` (projects), `board` (people).

`isGridEligible()` reads the **raw snapshot** row with `!p.archived && !p.exclude_from_grid &&
!p.external_only`; `null` and `false` are both falsy there, so `grid_eligible` and the derived
`menus.json` are provably unchanged. Same for `boolFlag` on the `nav` project prune.

Update the `InsightDoc` / `ProjectDoc` / `PageDoc` interfaces to `boolean`.

### 2. `--check` mode on the normaliser

`npx tsx scripts/normalise-wireframe-data.ts --check` reads the **already-emitted**
`content/bf/**` files (writes nothing) and exits `1` if any field named in a per-collection
`BOOLEAN_FIELDS` table is missing or not a JS boolean. The same assertion runs automatically
at the end of a normal (writing) run, so the two paths cannot drift.

### 3. Schemas (`bfna-website-nuxt/content.config.ts`)

`bfInsightSchema.archived/evergreen`, `bfProjectSchema.archived/exclude_from_grid/external_only`,
`bfPageSchema.archived/evergreen` → `z.boolean()`. The entity types in
`src/types/bf-contracts.ts` are `z.infer` re-exports and follow automatically.

### 4. Probe 09 (`src/pages/bf-probe/09-data-collections.vue`)

Add rows that exercise the previously-broken query form against the built content DB:

- `.where('external_only', '=', true).count()` → **1**
- that row's slug → `transponder-magazine`  ← the exact #139 repro
- `.where('exclude_from_grid', '=', true).count()` → **2**
- `.where('archived', '=', false).count()` on `bfProjects` → **21**
- `.where('archived', '=', false).count()` on `bfInsights` → **115**
- `.where('evergreen', '=', true).count()` on `bfPages` → **7**

### 5. Regenerate

`npx tsx scripts/normalise-wireframe-data.ts` → commit the `content/bf/**` diff.

## Out of scope

Composable behaviour (they keep the `.all()`-and-filter form — probes 11/12/13 must pass
**unchanged**), components, wireframes. Only stale doc-comments in `bfCardRow` /
`bfCardInsight` that assert "`archived` is `boolean | null`" are corrected — comment text only,
no code.

## Verification

1. `npx tsx scripts/normalise-wireframe-data.ts --check` → exit 0
2. `npx nuxt generate` → exit 0 (a schema/normaliser mismatch fails here)
3. `npx tsx scripts/check-probes.ts --only 09` → exit 0
4. `npx tsx scripts/check-probes.ts` (full sweep, 11/12/13 included) → exit 0
5. typecheck gate: total `error TS` count ≤ **178** (baseline recorded on `dev`), and 0 in
   `src/(components/bf|types|composables/bf)` / `content.config`
6. wireframe byte-identity vs `f757a64` → empty diff

## Risks

- **Probe 11/12/13 drift.** All three assert counts derived from truthiness filters; `null → false`
  cannot move a truthiness result. Full `check-probes.ts` sweep is the guard.
- **`menus.json` churn.** Derived from raw snapshot predicates, not from the emitted docs.
  A non-empty `src/assets/bf-data/menus.json` diff would mean the port is not equivalent —
  treat as a stop condition.
- **Typecheck fallout** from narrowing `boolean | null → boolean`: an `=== null` comparison
  would become a TS error. Grepped: every consumer uses truthiness. The gate catches any miss.
