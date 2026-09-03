# Plan — gh#30 / issue 21 · `bfCardInsight`

**Spec:** [docs/ds-epic/issues/21-bf-card-insight.md](../ds-epic/issues/21-bf-card-insight.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Base:** `dev` · **Branch:** `feature/gh30-bfcardinsight`

## Approach

The first **typed wrapper** over the `bfCard` base (gh#29). Whatever shape this
file takes is the shape #31–#36 copy, so the wrapper contract is written down
here once rather than re-decided six times:

1. `inheritAttrs: false`, root is `<bfCard v-bind="$attrs">`. The wrapper owns
   no DOM of its own; a caller's `class`, `data-*`, `style` and listeners land
   on the base's `<li>` exactly as they would on a bare `bfCard`. Without
   `inheritAttrs: false` a multi-root wrapper would warn and a single-root one
   would apply them twice.
2. **Props are the entity, not its fields.** `insight: Insight`, imported
   `from '~/types/bf-contracts'` — never redeclared, never re-inlined. The
   remaining props are presentation switches only (`extraChips`, `excerpt`,
   `excerptLength`).
3. **Presentational-only (BRIEF D8).** No `queryCollection`, no store, no data
   composable, no `useAsyncData`. The only import beyond the type is
   `formatLabel` from `~/utils/format.ts`.
4. **Markup parity with `wfCardInsight.vue`**, one deliberate delta: the route
   target moves from `/wireframes/insights/:slug` to `/insights/:slug`.
5. `bfTime` replaces the wireframe's bare `<time>` (which carries no
   `datetime`); `bfChip` replaces `<span class="wf-chip">`.
6. **No new CSS.** The wrapper is presentation-thin — heading, `<p>`, `bfTime`,
   chips — all styled by `bfCard`'s own `@layer components` block and by the
   atoms' hooks. No `<style>` block at all, therefore no `:not()` and no token
   or layer question to get wrong (D-20.5 is satisfied vacuously).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/CardInsight.vue` | **new** — the wrapper |
| `bfna-website-nuxt/src/pages/bf-probe/21-bf-card-insight.vue` | **new** — probe under `layouts/bf-probe.vue`, #109 DOM convention |
| `docs/ds-epic/issues/21-bf-card-insight.md` | append Decisions |
| `docs/plans/gh30-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` is touched (D2).

## Truncation

Ported from `wfCardInsight.vue` minus the `plain()` call, which is retired
(issue 10): the normaliser already stores plain text in `excerpt`.

```ts
const t = props.insight.excerpt ?? ''
t.length > props.excerptLength ? t.slice(0, props.excerptLength).trimEnd() + '…' : t
```

`excerpt` is `string | null` in `bfInsightSchema`, and 195 of the 371 rows are
null/empty — hence the `?? ''` and the `v-if="excerpt && excerptText"` guard
the wireframe already carries.

## Test strategy

Vitest is out (broken on `dev`, residual #86). Acceptance is the probe under
the #109 harness plus the spec's own greps.

`src/pages/bf-probe/21-bf-card-insight.vue`, `definePageMeta({ layout: 'bf-probe' })`,
root `<main class="probe container" data-probe="21" :data-probe-verdict>`, rows
`[data-probe-row][data-ok]`. It queries **three real `bfInsights` documents**
(the page may query; the component may not) and renders them in a real
`<ul class="grid" data-min-width>` — a card is an `<li>` and `bfCard` warns
outside a list.

Asserted:

- format chip text equals `formatLabel(insight.format)` for a pipe-delimited
  real value (`'article|report'` → `Article`);
- the `Archive` chip is present on the archived document and **absent** on the
  other two — the issue's named acceptance, asserted as a set, not a count;
- `extraChips` render in order between the format chip and `Archive`;
- the heading link's `href` is `/insights/<slug>`, i.e. **not** `/wireframes/`;
- `bfTime` rendered a `<time datetime>` (the wf source rendered none) and it is
  a direct child of `.bf-card`, so `> time { margin-block-start: auto }` bites;
- the excerpt truncates at `excerptLength` with an ellipsis, and does **not**
  truncate when it is shorter;
- **no overflow** for a long real excerpt: `scrollWidth <= clientWidth` on the
  card and `scrollHeight <= clientHeight`, measured, at `excerptLength` large
  enough to leave the text untruncated;
- `$attrs` reach the base `<li>` (a caller class merges with `.bf-card`) and
  `span="full"` still works through the wrapper;
- heading-first DOM order survives the wrapper.

Commands, all of which must pass before the PR:

```bash
cd bfna-website-nuxt
npx nuxt generate
npx tsx scripts/check-probes.ts --only 21
npx tsx scripts/check-probes.ts
grep -q "insight: Insight" src/components/bf/CardInsight.vue
grep -c "plain(\|queryCollection" src/components/bf/CardInsight.vue   # 0
```

Plus the epic gates: typecheck no-new-errors (baseline **178**) with **0** in
`src/components/bf|src/types|src/composables/bf|content.config`, and the
wireframe byte-identity diff printing nothing.

## Risks

| Risk | Mitigation |
|---|---|
| The issue says "a real **980-character** insight" but the longest real `excerpt` after the issue-07 normaliser is **500** chars (`dual-vocational-training`); 980 is BRIEF §5 rule 10's *upper bound* of the pre-normalisation range. | Use the longest real excerpt untruncated for the overflow measurement, and additionally build a ≥980-char case from a real document's own `content` field (real prose from the same collection, not lorem). Record as a Decision rather than silently redefining the acceptance. |
| Nuxt Content adds `id`/`stem`/`meta` to a queried row, so the queried type is wider than `Insight`. | Structural assignability — a wider object satisfies an `Insight` prop. The probe adds an explicit `const x: Insight = doc` assignability check so a schema drift fails typecheck. |
| `bfChip` renders a `<span>` by default; the wireframe chip is also a `<span class="wf-chip">`. | No branch prop passed, so the span branch is what renders. Asserted. |
| A wrapper that grows a `<style>` block would have to re-answer the layer/`:not()` questions. | It ships none; the probe asserts the wrapper contributes no `.bf-card-insight` class or rule. |
| `ce-plan` / `ce-work` detaching past the turn. | Both run in the documented inline-fallback form; every verification command is run here. |
