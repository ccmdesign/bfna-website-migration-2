# Plan — gh#35 / issue 26: `bfCardProduct`

**Spec:** [`docs/ds-epic/issues/26-bf-card-product.md`](../ds-epic/issues/26-bf-card-product.md) ·
**Issue:** [gh#35](https://github.com/ccmdesign/bfna-website-migration-2/issues/35) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Objective

Port `components/wireframe/wfCardProduct.vue` as `src/components/bf/CardProduct.vue`
(`<bfCardProduct>`) — the **sixth typed wrapper** over `bfCard`, and the only one
that is *external-only*: the full-width "special" card that leads the homepage
Insights grid (today exactly one row, `transponder-magazine`).

## Approach

Same contract as the five wrappers before it (D-21.1, unchanged, not re-decided):

- `inheritAttrs: false`, root is `<bfCard v-bind="$attrs">`, wrapper owns no DOM
  and ships **no `<style>` block** — so BRIEF §5 rule 2 (no new colour) and
  D-20.5 (no `:not()` with a complex selector) hold vacuously.
- Prop is the **entity**: `product: Project` from `~/types/bf-contracts`
  (zod-inferred, issue 09). Products are `Project` rows with
  `external_only: true`; there is no separate schema and none is invented.
- `headingLevel?: 2 | 3 | 4` (default 3) from the shared `CardWrapperProps`
  (#128); heading rendered as `<component :is="`h${headingLevel}`">`.
- `excerptLength?: number`, default **220** (the frozen source's value).
- Presentational-only (BRIEF D8): no `queryCollection`, no store, no composable.

### The three things that make this wrapper different

1. **`span="full"` is the wrapper's own default, not caller-controlled.** The
   root is `<bfCard span="full" v-bind="$attrs">`, mirroring the frozen source's
   hardcoded `data-span="full"`. `$attrs` is merged *after*, so a caller can still
   override it — but nobody has to ask for it. The `data-span` mechanism itself
   is `bfCard`'s (issue 20 / #29): this issue **consumes** it and restates
   nothing. `bfCard[data-span="full"]` already resolves `grid-column: 1 / -1`.
2. **No `NuxtLink` branch exists.** Products are external-only by definition, so
   the heading is either an external `<a :href="product.external_url">` or —
   when there is no URL — plain heading text with **no anchor at all**, the
   pending chip carrying that status. `transponder-magazine.json` has
   `external_url: null` and `pending: "Q6"` today, so the *unlinked* branch is
   the one the real data exercises.
3. **21/9 media at full width.** `<bfMedia … ratio="21/9" />`, which lands as
   the `--_bf-media-ratio` inline custom property (#26's override path) rather
   than a hard `aspect-ratio`. Load-bearing, per the frozen source's own
   comment: twice as wide as a featured card and about as tall, so the card
   reads as the "1" in a 2×1 slot. Not the `3/2` of `bfCardProject`.

### Deliberate divergence from the spec's literal text

The spec writes `data-external` unconditionally on the anchor. This wrapper
instead binds `:data-external="isExternal(product.external_url) || undefined"`,
using `utils/link.ts`'s shared rule — the same reasoning `bfCardProject` recorded
as D-22.3, applied in the opposite direction. Issue 19's convention is that
`isExternal()` decides and the attribute renders; an `external_url` pointing at
`www.bfna.org` would otherwise sprout a `↗` promising a departure that does not
happen. In practice every real product URL is off-site, so the rendered output is
identical; the probe asserts both halves. Recorded as **D-26.1** in the spec's
Decisions.

## Files

| File | Change |
|---|---|
| `src/components/bf/CardProduct.vue` | **new** — the wrapper |
| `src/pages/bf-probe/26-bf-card-product.vue` | **new** — probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/26-bf-card-product.md` | append Decisions |
| `docs/plans/gh35-plan.md` | this file |

Nothing else. No edit under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` (D2).

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86) — not
fixed here, and acceptance does not depend on it. The probe **is** the test.

`src/pages/bf-probe/26-bf-card-product.vue`, following the #109 DOM convention
(`[data-probe-verdict]` root, `[data-probe-row][data-ok]` rows) and running under
`layouts/bf-probe.vue` (#116). It queries `bfProjects`, filters
`external_only === true`, and renders:

- **The real band** — the Transponder document leading a two-column
  `.grid[data-min-width="xl"][data-gap="m"]` with four real featured
  `bfCardFeatured` cards below it, which is `pages/wireframes/index.vue:39-42`
  minus its hand-pinned `grid-template-columns` (D9).
- **Contract variants** — a linked (off-site `external_url`) card, an
  internal-host `external_url` card, heading levels 2 and 4, a blank heading
  (#130), a `pending`-less card falling back to `Q6`, and a `$attrs` card.

Assertions, in the band:

1. the product card resolves `grid-column: 1 / -1` and its measured width equals
   the grid's content width, while a featured card's does not;
2. the grid really is multi-column — the track count derived from the measured
   container width (probe 03's viewport-agnostic arithmetic) is ≥ 2 and equals
   the count `getComputedStyle().gridTemplateColumns` reports;
3. the card is roughly **one featured row tall** — its height sits inside a band
   around the tallest featured card, so it is the "1" of a 2×1 slot rather than
   two rows;
4. `--_bf-media-ratio` resolves to `21/9` on the product card's media and `16/9`
   on a featured card's;
5. **no anchor** anywhere in the real card when `external_url` is null, and the
   "External link pending Q6" chip is present instead;
6. the linked variant's anchor carries `[data-external]` and its `href` is the
   external URL verbatim — never `/wireframes/…`, never `/projects/…`;
7. the `Magazine` chip is always present; the pending chip only on the unlinked
   branch;
8. excerpt truncated at `excerptLength` with an ellipsis, `excerpt ?? description`
   with `??` not `||`;
9. `headingLevel`, `#130` blank-heading guard, wrapper-owns-no-DOM and `$attrs`
   rows, as in probes 21–25.

Commands, all run in `bfna-website-nuxt/`:

```bash
npx nuxt typecheck   # gate: ≤178 total (baseline), 0 in src/components/bf|types|composables/bf|content.config
npx nuxt generate    # never `npm run generate`
npx tsx scripts/check-probes.ts --only 26
npx tsx scripts/check-probes.ts          # full suite, no regressions in probes 03–25
grep -q 'data-external' .output/public/bf-probe/26-bf-card-product/index.html
grep -q 'External link pending' .output/public/bf-probe/26-bf-card-product/index.html
```

Plus the epic's wireframe byte-identity check from the pre-epic base SHA — must
print nothing.

## Risks

| Risk | Mitigation |
|---|---|
| The "one row tall" assertion is a measurement, and a tolerance chosen by guess is either vacuous or flaky. | Measure it first in the harness, then pin a band that would still catch a 2-row card. The contract is "not two rows", not a pixel. |
| Forcing a 2-column grid tempts a hand-pinned `grid-template-columns`, which D9 forbids and the wireframe source does exactly that. | `data-min-width="xl"` (400px floor) in the 1200px container resolves to 2 tracks on its own; the probe derives the expected count from the measured width rather than pinning it. |
| `data-external` on an internal URL would make the marker lie. | `isExternal()` decides; asserted both ways. Recorded as D-26.1. |
| A null `heading` plus a null `external_url` could produce a card-sized anchor with no name. | #130 guard: blank heading renders no heading element, and with no `external_url` there is no anchor at all either way. |
