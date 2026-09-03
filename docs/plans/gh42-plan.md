# Plan — gh#42 / issue 33: `bfEmptyState` + `bfNotFound` alias

**Spec:** [`docs/ds-epic/issues/33-bf-empty-state.md`](../ds-epic/issues/33-bf-empty-state.md) ·
**Issue:** [gh#42](https://github.com/ccmdesign/bfna-website-migration-2/issues/42) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Approach

One presentational molecule, two names. `src/components/bf/EmptyState.vue` holds the
implementation; `src/components/bf/NotFound.vue` is a **script-only SFC that re-exports
that component's default export**, so Nuxt's `components/bf` scanner registers a second
auto-import name (`bfNotFound`) pointing at the same component object. No second
implementation, no duplicated template, no runtime wrapper.

The markup is the wireframe block, lifted verbatim in structure and given props:

```vue
<div class="center | stack" style="padding-block: var(--space-xl);">
  <h1>Unknown program</h1>
  <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
</div>
```

- `center | stack` survives as-is — the layout is the composition layer's job, not the
  component's (spec § Scope). `data-gap="s"` is written explicitly; `s` is what
  `.stack`'s own default already resolves to, so the rendered gap is unchanged and the
  value is now declared rather than inherited by accident.
- The inline `style` is replaced by a component-local hook,
  `--_bf-empty-state-padding-block`, defaulting to `var(--space-xl)` — the same length.
  `bfSection`'s `padded` convention (issue 39) has **not** landed on `dev`
  (`src/components/bf/Section.vue` does not exist), so the spec's fallback applies.
  Declared **in the rule**, not bound inline, so a consumer can outrank it with an
  ordinary rule — the `bfMedia` lesson (gh#26).
- The back link stays a plain `NuxtLink`, not `bfButton` — wf-source parity (the wf block
  writes a bare `<NuxtLink>` with no `.wf-button`), and a "back to safety" link on a
  not-found page is a navigation, not a primary call to action.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | add `EmptyStateProps` (4 props, all documented) |
| `src/components/bf/EmptyState.vue` | new — the component |
| `src/components/bf/NotFound.vue` | new — 3-line alias re-export |
| `src/pages/bf-probe/33-bf-empty-state.vue` | new — probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/33-bf-empty-state.md` | append Decisions |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue` or
`public/css/wireframe.css` is touched (D2).

## Render contract

`<h1>{{ heading }}</h1>` always; `<p>{{ message }}</p>` when `message`; `<p><NuxtLink
:to="backTo">{{ backLabel }}</NuxtLink></p>` **only when both `backTo` and `backLabel`
are given**; then the default slot. Exactly one `h1`, always, in every configuration.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so acceptance is
the probe under `npx tsx scripts/check-probes.ts --only 33` plus the full suite, per the
#109 harness decision.

**One instance at a time.** The probe cycles a `form` ref through six configurations —
`heading`, `message`, `link`, `partial-to`, `partial-label`, `slot`, plus an `alias` case
rendering `<bfNotFound>` — snapshotting the DOM at each, rather than rendering them side
by side. Two reasons, and both are the spec's own:

1. BRIEF §5 rule 9 is **one `h1` per page**. Six instances would put six on the probe.
2. The spec's static check is
   `[ "$(grep -c '<h1' .output/public/bf-probe/33-bf-empty-state/index.html)" = "1" ]`.
   With one instance mounted, the prerendered page holds exactly one `<h1` — the
   component's — and the check passes **as written**, with no amendment. The probe's own
   title is an `<h2>` below the demo for the same reason; the spec asks for the component
   "as the sole content on the page", so the page's `h1` is the component's `h1`.

Cycling is strictly stronger than a static grep: each form is asserted in the live DOM
(text, presence, order, computed style), and "exactly one `h1` in the document" is
re-asserted after **every** switch.

Rows asserted: h1 count/identity/text per form · message present-and-absent · back link
present only with both props, correct `href`/text, plain `<a>` not `.bf-button` · slot
content renders **after** the built-ins · DOM order `h1 → message → link → slot` ·
`class="center | stack"` + `data-gap` on the root · layout comes from the composition
layer (computed `display:flex`, `flex-direction:column`, a `max-inline-size` from
`.center`) · `padding-block` resolves to `--space-xl` · the hook overrides it · the
component's own rule declares **only** the hook and `padding-block` (no bespoke layout) ·
`.bf-empty-state` is inside `@layer components` in the live CSSOM · no inline `style`
from the component · `$attrs` reaches the root and merges `class` · `bfNotFound` is the
same component · no `bf-*` rule uses `:not()` with a complex selector (D-20.5).

## Gates

- Typecheck: **no new errors**. Baseline on this branch = **178** `error TS`, of which
  **0** match `src/(components/bf|types|composables/bf)|content.config`. Both re-measured
  after the change.
- `npx nuxt generate` exits 0 (never `npm run generate`).
- `npx tsx scripts/check-probes.ts --only 33` and the full run both exit 0.
- The wireframe-source diff against the pre-epic base prints nothing.

## Risks

| Risk | Handling |
|---|---|
| Nuxt's scanner may not register a script-only re-export SFC as a component | The probe renders `<bfNotFound>` and asserts it produces a `.bf-empty-state` root; a failed registration fails the build or the probe, never passes silently. Fallback if it does not resolve: a `.ts` module in the same directory re-exporting the default. |
| A future `bfSection` `padded` prop (issue 39) duplicating the padding convention | The hook is namespaced `--_bf-empty-state-padding-block` and is a plain custom property; #39 can adopt it without a breaking change. Recorded in Decisions. |
| Cycling forms could leave the page on an unrepresentative state for a human reader | The cycle ends on the richest form and radio controls let a reader switch by hand. |
