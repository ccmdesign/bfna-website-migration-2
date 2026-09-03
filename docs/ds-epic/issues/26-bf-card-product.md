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

### D-26.1 — the external marker is decided by `isExternal()`, not asserted

The Scope above writes a bare, unconditional `data-external` on the anchor,
which is what `wfCardProduct.vue` does. The component binds it through
`utils/link.ts`'s `isExternal()` instead — the shared rule issue 19 exists to
state once, so five call sites stop re-deciding whether a string leaves the
site.

This is `bfCardProject`'s **D-22.3 applied in the opposite direction**. There
the marker was *dropped* from a heading that links to `/projects/…`, because an
attribute meaning "this href goes off-site" would lie on an internal route.
Here the href is off-site in every real row, so the marker is honest — but
`external_url` is a bare `z.string().nullable()`, so an entry pointing at
`www.bfna.org` is permitted by the schema and would make it lie again. One
rule, asked rather than assumed.

The rendered output is identical for every product the data actually carries.
Probe 26 asserts both branches: an off-site URL renders the marker, a
`www.bfna.org` URL renders the link **without** it.

### D-26.2 — what the marker paints on a card heading: nothing, by cascade

Recorded because it is genuinely surprising, and because the next issue to read
`[data-external]` as "the arrow is visible" would be wrong.

`external-link.css` paints the `↗` through `a[data-external]::after` —
specificity (0,1,1). `bfCard`'s stretched link is
`.bf-card :is(h2, h3, h4) a::after { content: ""; position: absolute; inset: 0 }`
— (0,1,2), since `:is()` takes the specificity of its most specific argument.
Same layer, so the more specific rule wins and the arrow's `content` is
overwritten by the empty string that makes the whole card clickable.

**This is parity with the frozen skin**, whose `.wf-card h3 a::after` scores
identically against `.wireframe a[data-external]::after`, so it is not a
regression and no visible marker the wireframe never showed is invented here.
Probe 26 **measures** the resolved `content` rather than trusting this
paragraph. Raised as a residual for #47 to decide whether the home band wants
an explicit `<span aria-hidden> ↗</span>` inside the anchor, the way
`bfCardProject` renders one.

### D-26.3 — `span="full"` is the wrapper's default, and `$attrs` still wins

The root is `<bfCard span="full" v-bind="$attrs">` — the one place this wrapper
differs from its five siblings, which leave `span` entirely to `$attrs`
(D-21.2). It is a straight port of the frozen source's hardcoded
`data-span="full"`: a product card is *always* the double-width 2×1 slot, and
that is the component's decision, not the caller's.

Because `v-bind="$attrs"` is merged **after** the prop, a caller who really
wants a normal slot can still say so with a fallthrough `data-span`. The probe
asserts that merge order with a `data-span="row"` card, which the prop form
could not test — a fallthrough `span` would be matched against `bfCard`'s own
prop and the two would agree by construction.

The `data-span` **mechanism** stays issue 20's (#29) and nothing about it is
restated here.

### D-26.4 — the probe filters `external_only` in the page, not in the query

`queryCollection('bfProjects').where('external_only', '=', true)` matches **zero
rows** — verified, while the row is plainly in the collection. `external_only`
is `z.boolean().nullable()`, and the nullable column does not round-trip through
the content SQLite store in a shape `= true` matches; `featured` on
`bfInsights` is a non-nullable `z.boolean()` and does match, which is why probe
23 can push its filter into the query and probe 26 cannot. The probe therefore
reads `.all()` and filters in the page, and asserts that products are a real
*subset* of all projects so the filter cannot be vacuous. Raised as a residual —
it is a data-layer question (issue 09's schema nullability), not this card's.

### D-26.5 — the probe's band drops the wireframe's hand-pinned column count

`pages/wireframes/index.vue:39` writes
`style="grid-template-columns: repeat(2, 1fr)"` on the Insights `ul`. D9 forbids
authoring a column count in the `bf-*` layer, so the probe's band is
`.grid[data-min-width="xl"][data-gap="m"]`, whose 400px track floor resolves to
exactly two tracks in the 1200px container on its own. The probe **derives** the
expected count from the measured container width (probe 03's viewport-agnostic
arithmetic) rather than pinning `2`, and asserts it is ≥ 2, so "full width" is a
claim about a genuinely multi-column grid.

Measured at the harness's 1280×1024 viewport: band content 1140px, product card
1140px wide × 665.3px tall, featured cards 555px × 649.6px — a height ratio of
**1.024**, which is the frozen source's comment ("646px against the featured
cards' 636px") reproduced almost exactly at a different width. The probe's band
is `0.6 < ratio < 1.5`: the contract is *one grid row, not two*, and two rows
plus a gap cannot be under 2×.

### D-26.6 — the vitest substitution (residual #86)

The vitest harness on `dev` is broken and pre-existing. No test was added to it
and acceptance does not depend on it. The equivalent-strength check is
**probe 26** — 65 runtime assertions read by
`npx tsx scripts/check-probes.ts --only 26`, which exits non-zero on any failing
row and treats a still-`PENDING` verdict as a failure.
