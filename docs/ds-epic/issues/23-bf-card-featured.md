# 23 — `bfCardFeatured` — featured/highlight insight card

One-line objective: port `wfCardFeatured.vue` to a thin typed `bfCard`
wrapper for the homepage highlights strip.

## Context

Depends on 20 (`bfCard`), 17 (`bfMedia`). Builds from
`src/components/wireframe/wfCardFeatured.vue`. Consumed by 47 (home
"Insights" band, alongside `bfCardProduct`). Provenance: BF-195. Thin by
design (BRIEF §5's "rule of three" — no prop grows until it appears twice
outside the wireframe occurrence).

## Scope

- File: `src/components/bf/CardFeatured.vue` → `<bfCardFeatured>`.
- Props:
  ```ts
  interface Props {
    item: Insight   // zod-inferred type from issue 09 (bfInsights schema)
  }
  ```
  No defaults, no optional props — matches `wfCardFeatured.vue` exactly
  (single required prop).
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Renders: `<h3><NuxtLink :to="\`/insights/${item.slug}\`">{{
  item.heading }}</NuxtLink></h3>`, conditional excerpt `<p>` (already-plain
  text, no truncation in the wf source — port as-is), `#chips` slot with one
  `<bfChip>Featured</bfChip>`, `#media` slot with `<bfMedia :src="item.image"
  alt="" ratio="16/9" />`.
- The eight curated `featured` insights come from `bfInsights().highlights`
  (issue 11) — this component itself never calls it; the **caller** (issue
  47's home page) passes each one in as `item`.

## Out of scope

- The homepage strip/carousel layout — that belongs to the home template
  (issue 47), not this component.
- A "featured" variant flag on `bfCardInsight` — per the inventory these are
  separate wrappers, not a shared component with a mode prop.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables; reuses `bfCard`/`bfChip`/`bfMedia` hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardFeatured.vue
grep -q "item: Insight" src/components/bf/CardFeatured.vue
```
Probe page `src/pages/bf-probe/23-bf-card-featured.vue` renders all eight
curated `featured` insights from `bfInsights` with zero data access inside
the component itself (the probe page calls `useBfInsights().highlights` and
passes each `item` in):
```bash
grep -c "Featured" .output/public/bf-probe/23-bf-card-featured/index.html
```
(expect 8). Fails today (no `bf/CardFeatured.vue`), passes once done.

## Decisions

_Runner appends here._
