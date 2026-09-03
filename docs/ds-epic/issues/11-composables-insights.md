# 11 — composables-insights

Port the insight surface of `useWfContent` to a thin `queryCollection`
wrapper, `useBfInsights`.

## Context

Depends on 09 (needs `bfInsights` collection), 10 (needs `format.ts` types
available, though this composable mostly re-exports data, not formats it).
Blocks 12 (`insightsForProject` cross-reference), 13, and every template
issue reading insights (48-50, 54-55). Builds from
`bfna-website-nuxt/src/composables/useWfContent.ts` (the insight-related
members of the 34-member return object, lines 213-222, 250-251).
Provenance: 01 §E.

## Scope

- New `bfna-website-nuxt/src/composables/data/useBfInsights.ts`. Pattern:
  `queryCollection('bfInsights')` wrapped in `useAsyncData`, same shape as
  the existing live composable `src/composables/data/useProducts.ts`
  (`queryCollection('products').order(...).all()` inside `useAsyncData`) —
  reuse that pattern, do not invent a new data-fetching idiom.
- Exported members, **same names and signatures as `useWfContent`** so page
  code is a one-line swap:
  - `items` — all insights, snapshot order.
  - `active` — non-`archived`, sorted `publish_date` desc.
  - `archived` — `archived === true`, sorted `publish_date` desc.
  - `bySlug(slug)` — single-item lookup.
  - `activeByProgram(program)` — `active` filtered by `program`.
  - `archivedCountByProgram(program)` — count of `archived && program`.
  - `highlights()` — items where `featured === true` (the normaliser's
    materialised flag from issue 07, replacing the old `insights.json.featured`
    array lookup).
  - `insightsForProject(slug)` — `active` filtered by `projects.includes(slug)`.
- **No synthesis** — every rename, flag, and curated order this composable
  exposes already exists as a stored field on the normalised document
  (issue 07's `featured`/`retired_news`/`archived` fields). This composable
  is filter/sort over `queryCollection` output, nothing else.
- Probe page assertion: `active.length + archived.length === 354`
  (matches the total item count from issue 07), `bySlug('<a known real
  slug from insights.json>')` resolves to a defined item.

## Out of scope

- `projects`, `programs`, `people`, `pages`, `announcements`, `menus`
  (issues 12-13).
- Any component importing this composable directly — per D8, only
  pages/layouts call data composables; components take resolved data as
  props.
- Re-deriving `formatLabel`/`kindLabel`/`monthYear`/`paragraphs` here —
  those live in `utils/format.ts` (issue 10), called by pages, not by this
  composable.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — composable/data issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/composables/data/useBfInsights.ts
grep -c "queryCollection('bfInsights')" src/composables/data/useBfInsights.ts   # after: >=1
```
Plus a probe page reporting `active.length + archived.length === 354` and
`bySlug` resolving a known slug (per the issues.md `verify` column —
build-time query result, manual/rendered check).

## Decisions

_Runner appends here._

### Appended by the item-runner (gh#20)

- **`items` is the 354 documents carrying neither highlight flag, not all
  371.** The `bfInsights` collection holds 371 rows: the 354 body items plus
  17 Directus highlight records (8 `featured`, 9 `retired_news`, zero slug
  overlap — issue 07's Decisions, asserted by probe 09). `useWfContent` keeps
  the two apart — its `items` is `insights.json.items`, its `highlights()` is
  `insights.json.featured` — so this composable filters
  `!featured && !retired_news` for `items`, which is what makes this spec's
  own acceptance number (`active.length + archived.length === 354`) true:
  98 active + 256 archived. `highlights()` is `featured === true` (8).
  Reading all 371 into `items` would have silently inflated every count and
  put highlight records into the insights index.

- **The 9 `retired_news` records are exposed by no member.** No `useWfContent`
  member surfaces them either, and this issue's scope is "same names and
  signatures". They remain queryable directly from the collection for
  whichever later issue needs them (the archive template, 55, is the likely
  consumer).

- **Members are plain arrays and plain functions, not refs.** `await
  useAsyncData(...)` has resolved by the time the composable returns and the
  collection is build-time static content, so the values are unwrapped. This
  is what makes the port a literal one-line swap
  (`useWfContent()` → `await useBfInsights()`) with no `.value` introduced
  into page code. One query per call, not one per member: the composable
  fetches `.all()` once and derives all eight members from it.

- **Sorting is done in JS, not with `.order()`.** `active`/`archived` reuse
  `useWfContent`'s exact comparator,
  `(b.publish_date ?? '').localeCompare(a.publish_date ?? '')`. Three active
  documents have a null `publish_date`; SQLite's NULL ordering differs from
  the empty-string coercion the wireframe does, so delegating the sort to the
  query would have changed their position.

- **Snapshot order is not recoverable, and one probe assertion was relaxed
  because of it.** The documents carry no ordinal, so `items` is in collection
  (file-stem) order rather than snapshot order. That only shows up on a
  `publish_date` tie, where a stable sort falls back to input order: two
  archived rows tie at the maximum `2023-07-20`
  (`there-and-back-again` and
  `the-21st-century-space-race-geopolitical-competition-or-cooperation-4`),
  and the wireframe heads that list with the first, the collection with the
  second. The probe therefore asserts `archived[0].publish_date` plus
  membership in the tied pair, and asserts monotonic descent across the whole
  array, instead of pinning a slug that would encode an ordinal the data does
  not have. `active[0]` is pinned by slug because `2026-07-21` is held by one
  row. The only wireframe consumer of `items` (`search.vue`) re-sorts by
  relevance score, so nothing downstream depends on the tie-break.

- **`highlights()` order matches the wireframe by luck, and that is
  asserted rather than assumed.** The 8 featured slugs happen to be
  alphabetical in `insights.json.featured`, so file-stem order reproduces the
  homepage strip's order exactly; the probe pins `highlights()[0]` so a
  regression is caught rather than discovered visually.

- **`activeByProgram` / `archivedCountByProgram` take the program display
  name, not the slug** (`'Democracy'`, not `'democracy'`) — `program` is
  stored as the name and `[area].vue` calls `activeByProgram(area.name)`.
  Signature parity, so the swap stays one line.

- **Acceptance substitution (residual #86).** The vitest harness on `dev` is
  broken and pre-existing, so acceptance is the probe page at
  `/bf-probe/11-composables-insights` rendered by `npx nuxt generate`, not a
  unit test. It is a parity test: all 21 expected values were computed offline
  from `src/assets/wireframe-data/insights.json` through `useWfContent`'s own
  predicates, then hard-coded, so a passing row means agreement with the
  wireframe composable rather than with this implementation. The probe is
  kept in place per the BRIEF's probe-page rule.

- **Verification.** Probe renders **PASS — 21/21** in the prerendered HTML.
  Typecheck 178/178 (baseline, no new errors; 0 in the scoped paths, 0
  mentioning either new file). `npx nuxt generate` exits 0 (745 routes). Both
  wireframe byte-identity diffs — against `dev` and against the pre-epic base
  `f757a64` — print nothing. No colour literal is introduced: the probe's
  `var(--color-error, #b00)` fallback is copied verbatim from the already
  merged probe 09, same value, no new token.
