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

### Appended by the item-runner (gh#16)

- **`content/` was fully gitignored.** `bfna-website-nuxt/.gitignore:26` ignored `/content/`
  wholesale and no file under `content/` was tracked. `npx nuxt generate` (DoD-1) runs no npm
  script, so an uncommitted `content/bf/**` leaves issue 09's collections empty on a fresh
  checkout. The rule is now `/content/*` + `!/content/bf/`: the Directus importer's output stays
  ignored, the normaliser's output is committed. **Issues 08 and 09 inherit this** — anything
  written outside `content/bf/` will still be ignored.

- **Insight document count is 371, not 354.** `insights.json.featured` (8) and
  `.retired_news` (9) are **not** slugs of existing items — they are separate Directus-highlight
  records (`bucket: "highlight"`) with **zero** slug overlap with the 354 `items`; that is the
  set `useWfContent.highlights()` renders in the homepage featured strip. Flag-matching alone
  would emit `featured: false` on all 354 documents and drop the strip's content entirely.
  BRIEF §6 requires them to become "boolean/bucket fields on the item, **not separate
  collections**", so they are emitted as 17 additional `content/bf/insights/` documents carrying
  `featured: true` / `retired_news: true`. This applies the same rule the spec already sets for
  `projects.json` (declared `count: 37`, 38 actual): the actual data beats the declared count.
  **Issue 09's probe should assert 371, not 354.**

- **Two duplicate slugs inside `insights.json.items`.** `graphic-images-autocrats-and-the-use-of-power`
  and `uncivil-war` each appear twice (352 unique slugs across 354 items; the snapshot's own
  `note` calls them "2 cross-collection duplicates marked `duplicate_of`"). All 354 rows are
  kept. File stems disambiguate in snapshot order — first `<slug>.json`, nth `<slug>-<n>.json`,
  skipping any stem a real slug already occupies — while the `slug` **field** keeps its real
  value. Consumers that need one row per slug should de-duplicate on `slug`.

- **`plain()` is applied to display strings only.** Insight `heading`/`subheading`/`excerpt` and
  project `heading`/`excerpt`/`description`. `content` and `intro` pass through byte-identical:
  they are markdown-or-legacy-HTML body copy that `wfProse` block-parses itself, and `plain()`
  would collapse `</p>` boundaries into run-on text.

- **No content-derived excerpt fallback.** 195 of the 354 insight items have a null/empty
  `excerpt`; they stay `null`. `wfCardInsight` renders `plain(insight.excerpt)` and shows nothing
  when it is empty, and BRIEF ground rule 10 requires `bf-*` to render the same data as its
  `wf-*` counterpart. The project-side `excerpt ?? description` fallback likewise stays
  presentational — both fields are emitted, `plain()`-cleaned.

- **Emitted field lists follow issue 09's zod schemas, not `items[].*` verbatim.** Issue 09 is
  what validates this output, so source keys 09 does not declare are dropped: insights lose
  `copy_source`, `legacy`, `duplicate_of`, `slug_note`, `featured` (always `false` in the source);
  projects lose `aka`, `authors`, `content`, `copy_source`, `download`, `evergreen`, `format`,
  `legacy`, `publish_date`, `subheading`; programs lose `copy_source` and `legacy_workstreams`.

- **Curation order is not stored.** `FEATURED_SLUGS`/`NAV_SLUGS` order the homepage and nav lists
  today; issue 09's schema declares only `featured`/`nav` booleans, so the ordering constants
  belong to the composables in issue 12.

- **`Program.tagline`** is the first sentence of `plain(intro)`'s first paragraph, with a
  common-abbreviation guard (`U.S.`, `e.g.`, `Dr.`, …) so it does not cut early. Resulting
  values: Democracy — "Democracies around the world are facing profound challenges, …
  economic conditions."; Future Leadership — "Strong transatlantic leadership has never been more
  important."; Transatlantic Relations & Global Challenges — "The transatlantic community is
  undergoing profound change."

- **Verified parity with `useWfContent`**: `grid_eligible` true for the same 18 projects as
  `inProjectGrid`; `grid_order` reproduces `gridSort` output for all three programs (checked
  against the composable's own ordering); `pending` on exactly `transponder-magazine` (Q6) and
  `bfna-documentaries` (Q7); `featured`/`nav` sets equal `FEATURED_SLUGS`/`NAV_SLUGS`. Idempotent
  across two runs (412 files, identical sha256 sweep). Typecheck 178/178 (baseline, no new
  errors, 0 in scoped paths); `npx nuxt generate` exits 0; both wireframe byte-identity diffs
  print nothing.

