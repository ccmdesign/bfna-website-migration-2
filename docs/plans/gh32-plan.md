# Plan — gh#32 / issue 23: `bfCardFeatured`

Spec: [`docs/ds-epic/issues/23-bf-card-featured.md`](../ds-epic/issues/23-bf-card-featured.md)
Epic: https://app.plane.so/ccm-design/browse/BF-217/

## Approach

The third typed wrapper over `bfCard`, after `bfCardInsight` (#30) and
`bfCardProject` (#31). The wrapper contract is already settled — D-21.1
(`inheritAttrs: false`, root `<bfCard v-bind="$attrs">`, entity prop,
presentational-only, no stylesheet), #128 (`headingLevel` from the shared
`CardWrapperProps`), #130 (a blank heading renders no unnamed link) — so this
issue writes no new contract. It ports `wfCardFeatured.vue` and nothing else.

`wfCardFeatured.vue` is the **thinnest** of the three sources: one required
prop, no presentation switches, no truncation, a hard-coded `Featured` chip and
a hard-coded `16/9` media. The spec's "thin by design" (BRIEF §5 rule-of-three)
is therefore load-bearing: the props are `item: Insight` and the inherited
`headingLevel`, full stop. No `media`/`chips`/`excerptLength` flags — none has
appeared twice outside the single wireframe occurrence.

The one deliberate delta from the frozen source, as in the two earlier
wrappers: the heading links to `/insights/<slug>`, not
`/wireframes/insights/<slug>`.

`plain()` is **not** called. `wfCardFeatured.vue:17` strips HTML at render time;
that moved into the build-time normaliser (issue 07) and the helper is retired
(issue 10), so `item.excerpt` already arrives as plain text.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/CardFeatured.vue` | **new** — the wrapper. No `<style>` block. |
| `bfna-website-nuxt/src/pages/bf-probe/23-bf-card-featured.vue` | **new** — probe under the `bf-probe` layout, `#109` DOM convention. |
| `docs/ds-epic/issues/23-bf-card-featured.md` | append to the Decisions section. |

Nothing else. No edit to `bf-contracts.ts` (`Insight` and `CardWrapperProps`
both already exist), no edit to `Card.vue` / `Chip.vue` / `Media.vue`, and
nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` (D2).

## Component shape

```ts
interface Props extends CardWrapperProps {
  item: Insight
}
withDefaults(defineProps<Props>(), { headingLevel: 3 })
```

Template: `<bfCard v-bind="$attrs">` holding
`<component :is="`h${headingLevel}`" v-if="hasHeading">` → `NuxtLink` to
`/insights/${item.slug}`; `<p v-if="excerptText">`; `#chips` with one
`<bfChip>Featured</bfChip>`; `#media` with
`<bfMedia :src="item.image" alt="" ratio="16/9" />`.

`hasHeading` / the dev-time `console.warn` are #130, copied in shape from the
two earlier wrappers (`heading` is `z.string().nullable()` here, so the trap is
latent-but-typed exactly as on `bfCardInsight`).

## Probe / test strategy

`src/pages/bf-probe/23-bf-card-featured.vue`, modelled on probe 22:

- the page queries `bfInsights` and filters `featured` — the same set
  `useBfInsights().highlights()` returns (8 real curated documents, all with a
  heading, an excerpt and an image) — and passes each row in as `item`. The
  **component** queries nothing.
- rendered in a real `<ul class="grid" data-min-width="2xl">` — `2xl` is
  500px, which under the 1200px container and the harness's 1280×1024 viewport
  resolves to exactly **two** columns, the shape the homepage highlights strip
  wants. The probe asserts the resolved track count rather than trusting it.
- assertions, `[data-probe-row][data-ok]` rows under a `[data-probe-verdict]`
  root:
  1. eight cards, each root an `<li class="bf-card">`, wrapper adds no class;
  2. exactly one `Featured` chip per card, on every card, and it is a `bfChip`
     (not a `wf-chip`);
  3. every card renders a `.bf-card__media` whose `bfMedia` resolves
     `aspect-ratio: 16 / 9`, with a declared `alt=""`;
  4. the heading links to `/insights/<slug>` for all eight, no `/wireframes/`
     href anywhere, one anchor per card, heading-first DOM order;
  5. the excerpt is rendered **whole** — no ellipsis, length equal to the
     source field — which is the port-as-is decision made checkable;
  6. `headingLevel` 2 / 3 / 4 render h2/h3/h4 and the stretched link still
     hit-tests over the card at each;
  7. #130: a blank heading renders no heading element and no anchor, and no
     anchor on the page has an empty accessible name;
  8. `$attrs` — a caller `class` merges with `.bf-card`, `data-*` lands on the
     base `<li>`, and `span="full"` is matched as `bfCard`'s **prop**;
  9. the grid resolves to two tracks.

Acceptance commands (the spec's, plus the #109 harness gate):

```bash
cd bfna-website-nuxt
npx nuxt typecheck   # gate is NO NEW ERRORS vs the 178-error baseline on dev
npx nuxt generate
test -f src/components/bf/CardFeatured.vue
grep -q "item: Insight" src/components/bf/CardFeatured.vue
grep -c "Featured" .output/public/bf-probe/23-bf-card-featured/index.html   # ≥ 8
npx tsx scripts/check-probes.ts --only 23
npx tsx scripts/check-probes.ts
```

The vitest harness on `dev` is broken and pre-existing (residual #86); this
issue's acceptance names no vitest test, so nothing is substituted.

## Risks

| Risk | Mitigation |
|---|---|
| The spec writes `useBfInsights().highlights` as a property; it is a **function** on an `async` composable. | The probe does not call the composable at all (it would be a second data path to keep in sync) — it queries `bfInsights` and filters `featured`, which is `highlights()`'s exact body. Recorded as a decision. |
| `grep -c "Featured"` on the prerendered HTML could match the word inside an excerpt rather than a chip. | Kept as the spec's smoke check, but the load-bearing assertion is the probe's per-card chip-set equality, which counts `.bf-chip` elements. |
| Hard-coding a two-column expectation could break on a different viewport. | The harness pins `1280x1024`; the probe states the viewport it assumes in a comment and asserts the resolved `--_grid-min-width` alongside the track count, so a failure names its cause. |
| Adding a card later could make a set-equality check vacuous. | Set equalities are derived from the data (`keysWhere`), #115's hardening, as on probe 22. |
| D-20.5 `:not()` ban / no-new-colour. | Satisfied vacuously: the component ships no `<style>` block, and the probe's scoped stylesheet reuses probe 22's rules verbatim (tokens only, no `:not()`). |
