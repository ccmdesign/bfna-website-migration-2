# 07 — data-normaliser-core

Write the build-time normaliser script for the three largest snapshots —
insights, projects, programs — moving every synthesis `useWfContent.ts`
does today into the script.

## Context

Depends on 01. Blocks 08 (extends the same script), 09 (collections read
this script's output), 10–13 transitively. Builds from
`bfna-website-nuxt/src/assets/wireframe-data/{insights,projects,programs}.json`
(read-only) and the synthesis logic in
`bfna-website-nuxt/src/composables/useWfContent.ts` (lines 96–181).
Provenance: D3 (BRIEF §6); 01 §D (data-layer-audit.md), 01 §F recommendation.

## Scope

- New `bfna-website-nuxt/scripts/normalise-wireframe-data.ts`, npm script
  `"data:normalise": "tsx scripts/normalise-wireframe-data.ts"` added to
  `package.json` (same `tsx scripts/<name>.ts` pattern as
  `validate:tokens`/`generate-search-index`).
- Reads `src/assets/wireframe-data/insights.json`,
  `projects.json`, `programs.json` **read-only** (no write-back to
  `assets/wireframe-data/`).
- Writes one JSON document per item to `content/bf/insights/<slug>.json`
  (354 files), `content/bf/projects/<slug>.json` (38 files —
  `projects.json` declares `count: 37` but has 38 `items`; the normaliser
  writes the actual 38, not the declared count), `content/bf/programs/<slug>.json`
  (3 files).
- Normaliser input → output mapping:

  | Source field(s) | Output field | Transform |
  |---|---|---|
  | `insights.json.items[].*` | same name | HTML strip/entity-decode via `useWfContent.ts`'s `plain()` logic (lines 272-277), ported here — strips tags, decodes `&amp; &nbsp; &rsquo; &lsquo; &ldquo; &rdquo; &#8217; &#8220; &#8221; &quot;` |
  | `insights.json.items[].excerpt` | `excerpt` | `plain()`-derived if missing, else `plain(excerpt)` |
  | `insights.json.featured[]` (8 slugs) | `featured: boolean` on the matching insight item | bucket → boolean field |
  | `insights.json.retired_news[]` (9 slugs) | `retired_news: boolean` on the matching insight item | bucket → boolean field |
  | `insights.json.items[].archived` | `archived` | passthrough (already boolean\|null) |
  | `projects.json.items[].*` | same name | `plain()` on `excerpt`/`description` |
  | `projects.json.items[].slug` (2 slugs: `transponder-magazine`, `bfna-documentaries`) | `pending: 'Q6'\|'Q7'` | `PENDING` map ported verbatim from `useWfContent.ts:114` |
  | `projects.json.items[].archived`/`exclude_from_grid`/`external_only`/`kind` | `grid_eligible: boolean` | materialise `useWfContent.ts`'s `inProjectGrid` predicate (line 127-128: `!archived && !exclude_from_grid && !external_only && kind !== 'podcast'`) as a stored field, not a runtime filter |
  | `projects.json.items[].program` + slug | `grid_order: number` | materialise `GRID_ORDER` (lines 132-135) as a per-item rank; unlisted slugs get `Number.MAX_SAFE_INTEGER` so they sort after ranked ones |
  | (curation list, not in JSON) | `featured: boolean`, `nav: boolean` | `FEATURED_SLUGS`/`NAV_SLUGS` (lines 144, 148) ported as boolean flags on the matching project |
  | `programs.json.items[].heading` | `name` | rename (`useWfContent.ts:110`) |
  | `programs.json.items[].legacy_workstreams` | — | dropped, not emitted |
  | `programs.json.items[].{slug,intro,image}` | same name | passthrough |
  | `programs.json.items[].intro` | `tagline: string` | derived, not sourced — first sentence of `intro` (see Decisions) |

- Placeholder-programme value convention: `program` values starting with
  `RE-TAG` or `PENDING` mark unresolved items; `projectsPendingRetag()`
  (issue 12) filters on `startsWith('RE-TAG')`.
- Idempotency: running the script twice produces byte-identical output
  (`git status` clean after a second run) — no timestamps, no random IDs in
  the written JSON.

## Out of scope

- `people.json`, `pages.json`, `announcements.json`, menus (issue 08).
- Registering any `@nuxt/content` collection (issue 09) — this issue only
  writes files under `content/bf/`.
- Any Directus/importer touch — `contentImporter.js` is untouched.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — data/script issue, no CSS or component.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
npm run data:normalise
find content/bf/insights -name '*.json' | wc -l   # today: dir absent, fails; after: 354
find content/bf/projects -name '*.json' | wc -l   # after: 38
find content/bf/programs -name '*.json' | wc -l   # after: 3
find content/bf -name '*.json' | sort | xargs sha256sum > /tmp/normalise-run-1.txt
npm run data:normalise
find content/bf -name '*.json' | sort | xargs sha256sum > /tmp/normalise-run-2.txt
diff /tmp/normalise-run-1.txt /tmp/normalise-run-2.txt   # empty: idempotent across two runs
```

## Decisions

- **Program.tagline**: the canonical `Program` shape gains a `tagline: string`
  field, derived by this normaliser as the first sentence of `intro`. Same
  decision recorded in issues 09 (zod schema) and 25 (`bfCardProgram`).

_Runner appends here._
