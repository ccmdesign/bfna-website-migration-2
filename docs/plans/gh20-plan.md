# Plan — gh#20 / issue 11 · `useBfInsights`

Spec: [`docs/ds-epic/issues/11-composables-insights.md`](../ds-epic/issues/11-composables-insights.md)
Branch: `feature/gh20-usebfinsights` off `dev`.

## Approach

A thin read-only wrapper over the `bfInsights` collection created by gh#18
(issue 09). One `queryCollection('bfInsights').all()` inside `useAsyncData`
— the house pattern already used by `src/composables/data/useHighlights.ts`
— then filter/sort in JS to reproduce `useWfContent`'s insight surface
member-for-member. No synthesis: `featured`, `retired_news`, `archived`,
`program` and `projects` are stored fields emitted by the normaliser (gh#16).

### The 371 / 354 split (the one real design decision)

`bfInsights` holds **371** documents: the 354 body items plus 17 Directus
highlight records (8 `featured`, 9 `retired_news`, no slug overlap — issue
07's Decisions). `useWfContent`'s `items` is *only* the 354; its
`highlights()` is *only* the 8. So:

- `items` = documents with `!featured && !retired_news` → 354
- `active` / `archived` derive from `items` → 98 / 256, sum 354 (the
  spec's acceptance number)
- `highlights()` = documents with `featured === true` → 8
- the 9 `retired_news` documents belong to neither set and are not exposed
  (no `useWfContent` member exposes them; adding one would be out of scope)

### Return shape

Plain arrays and plain functions, not refs — `await useAsyncData(...)` has
already resolved by the time the composable returns, and the collection is
build-time static content, so unwrapping gives literal signature parity with
`useWfContent` ("a one-line swap", per the spec) with no `.value` churn in
page code.

### Sort parity

`active` / `archived` reproduce `useWfContent` exactly:
`(b.publish_date ?? '').localeCompare(a.publish_date ?? '')`, done in JS
rather than via `.order()` so null `publish_date` sorts identically to the
wireframe (SQLite NULL ordering differs). `items` keeps collection order —
no ordinal is stored on the documents, and the only wireframe consumer of
`items` (`search.vue`) re-sorts by score.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/composables/data/useBfInsights.ts` | new — the composable |
| `bfna-website-nuxt/src/pages/bf-probe/11-composables-insights.vue` | new — probe page, kept (BRIEF §Probe pages) |
| `docs/ds-epic/issues/11-composables-insights.md` | append Decisions |
| `docs/plans/gh20-plan.md` | this file |

Nothing else. No component, page, layout or CSS is touched; no `wf-*` file
is read at runtime.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe page rendered by `npx nuxt generate`, asserting
against the real content database:

1. `items.length === 354`, `active.length === 98`, `archived.length === 256`,
   `active.length + archived.length === 354` (the spec's own number)
2. `highlights().length === 8` and its first slug is
   `latest-issue-transponder-the-future`
3. `bySlug('how-german-elections-work')` resolves to a defined item
4. `active[0].slug === 'the-nuclear-option'` and
   `archived[0].slug === 'there-and-back-again'` — sort-order parity with
   `useWfContent`, verified against the wireframe snapshot offline
5. `activeByProgram('Democracy').length === 13`,
   `archivedCountByProgram('Democracy') === 60`
6. `insightsForProject('election-analysis').length === 3`

Every expected number was computed from `src/assets/wireframe-data/insights.json`
through `useWfContent`'s own predicates, so the probe is a parity test, not a
restatement of the implementation.

Gates: typecheck baseline **178** — after must be ≤ 178 and 0 errors in
`src/(components/bf|types|composables/bf)|content.config`; `npx nuxt generate`
exits 0; the two wireframe byte-identity diffs print nothing.

## Risks

- **Collection order for `highlights()`** — the 8 featured slugs happen to be
  alphabetical in the snapshot, so file-stem order should match, but this is
  asserted in the probe rather than assumed. If it does not hold, sort by
  slug and record it.
- **Duplicate slugs** — two slugs appear twice among the 354 (issue 07).
  `bySlug` returns the first match, exactly as `useWfContent`'s `.find()` does.
- **`program` is a display name, not a slug** (`'Democracy'`, not
  `'democracy'`) — `activeByProgram` / `archivedCountByProgram` take the name,
  matching `[area].vue`'s `activeByProgram(area.name)`.
