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
