# 26 — `bfCardProduct` — external-only product/magazine card (7th wrapper)

One-line objective: port `wfCardProduct.vue` — the full-width, external-only
"product" card (e.g. Transponder) — as the 7th typed `bfCard` wrapper (no
existing BF-id; proposed in v2 §4 E3).

## Context

Depends on 20 (`bfCard`, owns the `span` mechanism this wrapper defaults
to), 17 (`bfMedia`), 16 (`bfChip`). Builds from
`src/components/wireframe/wfCardProduct.vue`. Consumed by 47 (home
"Insights" band, alongside `bfCardFeatured`). Provenance: v2 §4 E3, no
Plane BF-id — this is a net-new component vs v1, confirmed by the
component-inventory-v2 delta ("Added: `bfCardProduct`").

## Scope

- File: `src/components/bf/CardProduct.vue` → `<bfCardProduct>`.
- Props:
  ```ts
  interface Props {
    product: Project        // zod-inferred type from issue 09 (bfProjects schema) — products are Projects with external_only=true
    excerptLength?: number  // default 220
  }
  ```
- `inheritAttrs: false`, `<bfCard span="full" v-bind="$attrs">` root — the
  `span="full"` is the wrapper's own **default**, set unconditionally by
  this component (not caller-controlled), matching `wfCardProduct.vue`'s
  hardcoded `data-span="full"` on its `<wf-card>` root.
- Heading: `<h3>` containing either a linked external anchor (`<a :href=
  "product.external_url" data-external>{{ product.heading }}</a>`, marked
  per issue 19's `[data-external]` convention) when `product.external_url`
  is set, or the plain heading text with no link when it is not — the
  pending chip carries that status instead (matches the wf source exactly;
  no `NuxtLink` branch exists here, unlike other cards, because products
  are external-only by definition).
- Excerpt: `product.excerpt ?? product.description`, truncated to
  `excerptLength`, already-plain text (no `plain()` call — retired, issue
  10).
- `#chips` slot: `<bfChip>Magazine</bfChip>` always, plus `<bfChip>External
  link pending {{ product.pending ?? 'Q6' }}</bfChip>` only when there is no
  `external_url`.
- `#media` slot: `<bfMedia :src="product.image" alt="" ratio="21/9" />` —
  the 21/9 ratio is load-bearing (matches the wf source's comment on why:
  keeps the card visually consistent with a 2x1 grid slot) and must not be
  changed to the `bfCardProject` default of `3/2`.

## Out of scope

- Changing `bfCard`'s `span` mechanism itself — issue 20 owns that
  contract; this issue only **consumes** it.
- A dedicated products index route (none exists in the epic's route list,
  brief §7).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables; reuses `bfCard`/`bfMedia`/`bfChip` hooks. No inline
  `grid-template-columns` or `grid-column` — the `span="full"` prop is the
  only layout signal this component emits, and it is expressed as a
  `data-span` attribute consumed by `bfCard`'s own CSS, never as an inline
  style on this component.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardProduct.vue
grep -q 'span="full"' src/components/bf/CardProduct.vue
grep -q "21/9" src/components/bf/CardProduct.vue
grep -Lq "grid-template-columns" src/components/bf/CardProduct.vue
```
Probe page `src/pages/bf-probe/26-bf-card-product.vue` renders it full-width
inside a multi-column `.grid[data-min-width]`, plus a linked and a pending
(no `external_url`) variant:
```bash
grep -q "data-external" .output/public/bf-probe/26-bf-card-product/index.html
grep -q "External link pending" .output/public/bf-probe/26-bf-card-product/index.html
```
Fails today (no `bf/CardProduct.vue`), passes once done.

## Decisions

_Runner appends here._
