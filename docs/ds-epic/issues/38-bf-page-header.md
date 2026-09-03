# 38 — `bfPageHeader` — inner-page hero unit

One-line objective: evolve `wfPageHeader.vue` into `bfPageHeader`, the
inner-page hero composing `bfBreadcrumb` and `bfChip`, used by eight
templates.

## Context

Depends on 28 (`bfBreadcrumb`), 16 (`bfChip`). Builds from
`src/components/wireframe/wfPageHeader.vue` (as-built A: 8 files, the
single most-reused wf-* component after `wfSection`). Consumed by 48, 49,
50, 51, 52, 53, 54, 55 (every Phase 6 template except home and 404).
Provenance: BF-167.

## Scope

- File: `src/components/bf/PageHeader.vue` → `<bfPageHeader>`.
- Props:
  ```ts
  interface Props {
    label?: string             // default 'Page header' (wf-slot annotation label — record whether bf-* keeps this dev-only label at all, or drops it as wireframe-only chrome; if kept, it should not render visible in bf-*'s finished chrome — see Decisions)
    crumbs?: Crumb[]            // from src/types/bf-contracts.ts (issue 02)
    chips?: string[]
    heading?: string | null
    tagline?: string | string[] | null
  }
  ```
  Slots: `default` (by-lines, meta rows, header actions — matches the wf
  source's own slot usage for e.g. the search input on `/search`), `chips`
  (rich chip content beyond plain strings).
- Renders, in order: `<bfBreadcrumb v-if="crumbs?.length" :items=
  "crumbs" />`, a `.cluster` of `<bfChip>` for each string in `chips` **plus**
  the `#chips` slot content (both render together when both are present —
  matches `v-if="chipList.length || $slots.chips"` in the wf source), the
  page's single `<h1>{{ heading }}</h1>`, one `<p data-measure="normal">`
  per tagline paragraph (string or array, normalised the same way the wf
  source's `taglines` computed does), then the default slot.
- Composes `bfSection` internally (not a literal slot-fill — same
  base+specialization shape the as-built inventory documents for
  `wfPageHeader`/`wfCtaSection`/`wfContactSection`), passing through
  `gap="s"` and `padded` as `wfPageHeader.vue` does (`<wf-section :label=
  "label" gap="s" padded>`).

## Out of scope

- Page-specific content such as the search input or filters — templates
  add those into the default slot, this component does not know about
  search/filters.
- Deriving crumbs from the route (pages pass them in, per every wf-*
  call site).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfSection`'s, `bfBreadcrumb`'s and
  `bfChip`'s existing hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/PageHeader.vue
grep -q "crumbs?: Crumb\[\]" src/components/bf/PageHeader.vue
```
Probe page `src/pages/bf-probe/38-bf-page-header.vue` renders all five prop
permutations (crumbs-only, chips-as-strings, chips-via-slot, tagline-as-
string, tagline-as-array):
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/38-bf-page-header/index.html)" = "5" ]
```
A page using it has exactly one `h1` per instance. Fails today (no
`bf/PageHeader.vue`), passes once done.

## Decisions

_Runner appends here._
