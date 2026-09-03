# Plan — gh#29 / issue 20: `bfCard` base (+ `data-span="full"`)

**Spec:** [`docs/ds-epic/issues/20-bf-card.md`](../ds-epic/issues/20-bf-card.md) ·
**Issue:** [gh#29](https://github.com/ccmdesign/bfna-website-migration-2/issues/29) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Objective

Evolve `src/components/wireframe/wfCard.vue` (frozen, D2) into the public
`src/components/bf/Card.vue` — the slot-based inheritance root that the six
typed wrappers (#30–#35) and the row variant (#36) will each render as their
own root — and add the `span="full"` grid-slot modifier.

## Approach

1. **Contract.** `CardBaseProps { span?: 'full' }` already exists in
   `src/types/bf-contracts.ts` (landed by issue 02). Import it; declare no
   type inline (BRIEF §5 rule 11).
2. **Markup**, structurally identical to `wfCard.vue`:
   `<li class="bf-card">` → default slot → `.bf-card__chips | cluster`
   (`data-gap="xs"`) → `.bf-card__media`. Heading stays first in the DOM so
   screen-reader heading navigation lands at the card's start; chips and media
   are pulled ahead **visually** with CSS `order: -1` / `order: -2`.
3. **`span`** renders `:data-span="span"` — the attribute appears only when the
   prop is passed. No `inheritAttrs: false`: this is the base, so `$attrs`
   (`class`, `style`, `data-*`, and a wrapper's own raw `data-span`) falls
   through to the `<li>` untouched.
4. **Styling** in `@layer components`, `--_bf-card-*` hooks declared **in the
   rule** (not bound inline) so a consumer can outrank them — the gh#26
   `bfMedia` lesson. `[data-span="full"]` gets `grid-column: 1 / -1` plus a
   heavier border, exactly as `.wf-card[data-span="full"]` does; never
   `span 2`, never an inline `grid-template-columns` (D9 / #13).
5. **Stretched link + focus.** `:is(h2,h3,h4) a::after { inset: 0 }` makes the
   whole card the heading link's hit area; every non-heading link is raised
   above that overlay with `position: relative; z-index`. Because the ring
   would otherwise be drawn round the heading text only, the visible focus
   indicator moves to the card via `:has(… a:focus-visible)`, using the same
   two-ring treatment (`outline` + `--outline-focus`) gh#24 established.
6. **Probe** at `src/pages/bf-probe/20-bf-card.vue` under the `bf-probe`
   layout: a real `<ul class="grid" data-min-width="s" data-gap="m">` holding
   several three-slot cards and one `<bfCard span="full">`, with the harness
   DOM convention from `docs/decisions/probe-harness.md`.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/Card.vue` | **new** — the component |
| `bfna-website-nuxt/src/pages/bf-probe/20-bf-card.vue` | **new** — the probe |
| `docs/ds-epic/issues/20-bf-card.md` | append to **Decisions** |
| `docs/plans/gh29-plan.md` | this file |

Nothing else. No edit under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` (D2 — checked).

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the gh#20–#28 precedent:

- `npx tsx scripts/check-probes.ts --only 20` → exit 0
- `npx tsx scripts/check-probes.ts` (full run, regression) → exit 0
- `npx nuxt generate` → exit 0
- typecheck gate: no new `error TS` (baseline **178** on `dev`), and zero in
  `src/components/bf`, `src/types`, `src/composables/bf`, `content.config`
- the spec's own greps: the file exists, mentions `span`, contains no
  `grid-template-columns`, and `data-span="full"` is in the prerendered
  `/bf-probe/20-bf-card/index.html`
- wireframe byte-identity diff prints nothing

Probe rows, grouped:

1. three slots render, in DOM order heading-first
2. media `order: -2`, chips `order: -1` (computed, not markup)
3. chips wrapper is a `.cluster[data-gap="xs"]` and resolves `--space-xs`
4. `span="full"` → `data-span="full"`, computed `grid-column: 1 / -1`,
   measured width == the grid's content width, and the grid really has ≥2
   columns (otherwise the span assertion is vacuous)
5. a card without the prop carries no `data-span` and is one track wide
6. no inline `style` on any card — the modifier is CSS, not a pinned column
7. `$attrs` (`class`, `data-*`) reach the `<li>`; a raw `data-span="full"`
   passed through `$attrs` works too (the `wfCardProduct` call shape)
8. stretched link: `elementFromPoint` on empty card space returns the heading
   anchor, and a click dispatched there fires the anchor's handler
9. non-heading link stays reachable above the overlay
10. `.bf-card` rules are inside `@layer components` in the live CSSOM

## Risks

| Risk | Mitigation |
|---|---|
| `<style scoped>` cannot reach slotted DOM — slot content carries the **parent's** scope id, so `.bf-card h3 a::after` would never match | the SFC style block is **unscoped**, every selector `.bf-card`-prefixed, inside `@layer components`; the probe asserts layer membership in the live CSSOM |
| The `:has()`-based focus ring silently degrades to no visible indicator | the link keeps its own ring; it is suppressed only inside `@supports selector(:has(*))` |
| Spec asks for a computed `cssVars` binding, but the component has no styling props — an always-empty inline binding also re-creates the gh#26 un-overridable-inline defect | hooks declared in the `.bf-card` rule instead; recorded in the spec's Decisions |
| `--color-surface` / `--color-border` named in the spec do not exist as tokens, and BRIEF §5 rule 2 forbids adding one | reuse the existing semantic pair `--color-base-light` (the `#999` border) and `--color-text` (the `#222` hover/emphasis); no new colour, no primitive |
