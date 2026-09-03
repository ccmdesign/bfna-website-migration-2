# 32 — `bfLoadMore` — feed pagination control

One-line objective: new molecule `bfLoadMore`, replacing the inline
load-more button in the insights feed, with an accessible live-region
count announcement.

## Context

Depends on 02 (`bf-scaffold`), 15 (`bfButton`). Builds from the inline
button in `src/pages/wireframes/insights/index.vue:30-32`: `<button
class="wf-button" @click="visible += 24">Load more ({{ filtered.length -
visible }} remaining)</button>`. Consumed by 49 (`/insights` template).
Provenance: BF-213.

## Scope

- File: `src/components/bf/LoadMore.vue` → `<bfLoadMore>`.
- Props/emits:
  ```ts
  interface Props {
    hasMore: boolean
    loading?: boolean
    label?: string    // default 'Load more'
  }
  // emits
  (e: 'load'): void
  ```
- Renders `<bfButton v-if="hasMore" :disabled="loading" @click="$emit
  ('load')">{{ label }}</bfButton>` — renders **nothing** (not even an
  empty wrapper) when `hasMore` is false, matching the wf source's implicit
  "button just isn't there once everything's loaded" behaviour (the
  wireframe's `v-if="filtered.length > visible"` on the whole `<p>`).
- A visually-hidden `aria-live="polite"` region announcing the current
  count, e.g. "Showing N of M items" — driven by props the caller passes
  (this component does not know the total/visible counts itself; add
  `visibleCount?: number` and `totalCount?: number` props feeding the live
  region text, defaulting to no announcement when either is omitted).
- Owns **no** pagination state or array slicing — the caller (issue 49's
  page) tracks `visible`/`filtered` exactly as the wireframe does today and
  simply increments its own ref in the `@load` handler.

## Out of scope

- Owning pagination state or slicing arrays (the template owns that).
- Infinite scroll (no wireframe evidence — this is a manual "load more"
  click pattern only).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond what `bfButton` already exposes. The live
  region uses the standard visually-hidden clip-rect pattern, no new
  colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/LoadMore.vue
grep -q "hasMore" src/components/bf/LoadMore.vue
grep -q 'aria-live="polite"' src/components/bf/LoadMore.vue
```
Probe page `src/pages/bf-probe/32-bf-load-more.vue` renders it with
`hasMore=true` and toggles to `hasMore=false` on click, confirming the
component disappears and the announced count updates when the caller
changes `visibleCount`/`totalCount` — verified as a manual interactive
check plus:
```bash
grep -q "Load more" .output/public/bf-probe/32-bf-load-more/index.html
```
Fails today (no `bf/LoadMore.vue`), passes once done.

## Decisions

_Runner appends here._
