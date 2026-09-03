# 20 — `bfCard` — slot-based card base

One-line objective: evolve `wfCard.vue` into the public `bfCard` shell — the
inheritance root for all seven typed card wrappers — adding the `span="full"`
grid-slot modifier.

## Context

Depends on 02 (`components/bf/` scaffold, `bf-contracts.ts`), 03 (`data-gap`
honoured on `.cluster`, used by the chips slot). Builds from
`src/components/wireframe/wfCard.vue` (base + typed-wrapper pattern, as-built
A). Descends to: 21–27 (`bfCard*` wrappers all render this as their root),
42 (`bfGridInsights`/`bfGridProjects` grids consume `span="full"` via
`bfCardProduct`). Provenance: BF-190; D8 §1a. As-built confirms `wfCard` is
slot-only with **no props today** — `span` is new (D4), previously set only
by `wfCardProduct` writing the raw attribute `data-span="full"` by hand.

## Scope

- File: `src/components/bf/Card.vue` (auto-imports as `<bfCard>`).
- Root element: `<li class="bf-card">` — cards are list items; every card
  group is rendered inside a `<ul>` by its caller.
- Props:
  ```ts
  interface CardBaseProps {
    span?: 'full'
  }
  ```
  `span` sets `data-span="full"` on the root `<li>` when present, nothing
  otherwise. This is the **only** prop — everything else is `$attrs`
  fallthrough (no `inheritAttrs: false` here; this is the base, not a
  wrapper).
- Slots: `default` (card body — heading first per `wfCard.vue`'s own
  comment), `chips`, `media`. Same slot names and order as `wfCard.vue`.
- Visual order: chips render after body in the slot but are pulled to
  `order: -1`, media to `order: -2`, via CSS — never by reordering markup
  (matches `.wf-card__chips`/`.wf-card__media` in `wireframe.css`).
- `$attrs` (class, style, `data-*`) forwarded to the root `<li>` — this is
  what lets `bfCardInsight` etc. compose `class="bf-card | stack"` etc. from
  outside without `bfCard` knowing about it.
- No entity props, no data access, no `queryCollection`.

## Out of scope

- Any entity-specific markup or typed prop (issues 21–27 own that).
- No edits under `pages/wireframes/` or `components/wireframe/` — touching
  either fails the epic (D2).
- Grid-column pinning: `bfCard` sets `grid-column: 1 / -1` for `span="full"`
  via CSS keyed off `[data-span="full"]` — it never writes an inline
  `grid-template-columns` or `grid-column` style attribute.

## Styling

- CSS variables: `--_bf-card-{property}` (e.g. `--_bf-card-padding`,
  `--_bf-card-border`) bound via a computed `cssVars`, sourced from existing
  semantic tokens (`--color-surface`, `--color-border`, Utopia space scale)
  — no new colour.
- `@layer components` for `.bf-card` base rules; `[data-span="full"]` rule
  lives alongside it in the same layer.
- Composition primitives used internally: `.cluster` with `data-gap="xs"` on
  the chips wrapper (matches `wfCard.vue`'s own `wf-card__chips | cluster`).
- Layer order: `reset, defaults, tokens, themes, components, utils,
  overrides` (no change to the declared order).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Card.vue
grep -q "span" src/components/bf/Card.vue
grep -Lq "grid-template-columns" src/components/bf/Card.vue
```
Plus a hand-authored probe page at `src/pages/bf-probe/20-bf-card.vue`
(outside `pages/wireframes`, not touching `components/wireframe`) that
renders `<bfCard>` with all three slots filled inside a `.grid[data-min-width]`
alongside one `<bfCard span="full">`; after `npx nuxt generate`:
```bash
grep -q 'data-span="full"' .output/public/bf-probe/20-bf-card/index.html
```
All commands fail today (no `src/components/bf/` directory exists yet) and
must pass once the issue is done.

## Decisions

**D-20.1 — the SFC style block is unscoped.** `bfButton`, `bfMedia`, `bfChip`
and `bfSkipLink` each style only their own root element and use
`<style scoped>`. `bfCard` cannot: the stretched link (`:is(h2,h3,h4) a::after`),
the `> time` baseline and the raised non-heading links all style **slotted**
DOM, and slot content is compiled in the *parent's* scope — it carries the
parent's `data-v-…` id, never the child's. A `scoped` block would emit
`.bf-card h3 a[data-v-card]::after`, a selector that cannot match a heading the
caller passed in, which is every heading this component will ever hold.
`:slotted()` was considered and rejected: it reaches only *direct* slot
children, and the heading link is a grandchild in every wrapper. The block is
therefore global, every selector is `.bf-card`-prefixed, and it stays inside
`@layer components`; probe 20 asserts layer membership in the live CSSOM so it
cannot silently become unlayered.

**D-20.2 — `--_bf-card-*` hooks are declared in the rule, not bound through a
computed `cssVars`.** The spec's Styling section sketches a `cssVars` binding.
`bfCard` has no styling props to source one from, so the binding would always
be empty — and an always-inline custom property is exactly as un-overridable as
the inline `aspect-ratio` this epic removed from `wfMedia.vue` in gh#26. The
hooks (`--_bf-card-padding`, `-gap`, `-border-width`, `-border-color`,
`-border`, `-focus-color`, `-link-z-index`) are declared on `.bf-card` in
`@layer components`, where a consumer outranks any of them with an ordinary
rule. The `--_bf-{component}-{property}` naming (BRIEF §5 rule 4) is unchanged.

**D-20.3 — border colours.** The spec names `--color-surface` and
`--color-border`. Neither exists in `tokens/semantic-colors.css`, and BRIEF §5
rule 2 forbids adding a `--color-*` token or a literal. `.wf-card`'s `#999`
border becomes the existing semantic `--color-base-light`, and its `#222`
hover/emphasis becomes `--color-text` — the same pair `bfButton` and
`bfSkipLink` already use. No card paints a ground: the wireframe card has none
either, so no surface token is needed at all.

**D-20.4 — heading levels are `:is(h2, h3, h4)`, not the frozen skin's bare
`h3`.** Heading level is a function of the page outline (BRIEF §5 rule 9 —
sequential levels, one `h1` per page), so the same card correctly holds an `h3`
under an `h2` section and an `h4` under an `h3` one. `:is()` takes the
specificity of its most specific argument, so the selectors score exactly what
`.wf-card h3 a::after` scored.

**D-20.5 — the focus ring is on the card, and `:not()` with a complex selector
is banned here.** An `outline` is painted around an element's own boxes and not
around its `::after`, so a ring left on the heading anchor would mark a line of
text as the focus target of a card-sized hit area. The ring therefore moves to
`.bf-card:has(:is(h2,h3,h4) a:focus-visible)` with the two-ring treatment gh#24
established (`outline` + `--outline-focus`), and the anchor's own ring is
dropped **only** inside `@supports selector(:has(*))`, so a browser that cannot
evaluate `:has()` keeps the indicator it already had.

Raising the non-heading links was first written the obvious way,
`.bf-card a:not(:is(h2, h3, h4) a)`. It shipped broken: `postcss-preset-env`
lowers a `:not()` holding a **complex** selector and lowered this one to
`a:not(h2):not(h3):not(h4)`, which every anchor satisfies. The heading link
became `position: relative`, took over as the containing block for its own
`::after`, and the card-sized hit area collapsed to the width of the heading
text — caught by probe 20's `elementFromPoint` row, invisible to any source
grep. The shipped form is raise-every-link then exempt the heading
(`.bf-card :is(h2,h3,h4) a { position: static }`, winning on specificity), and
the probe now asserts the heading anchor's computed `position` is `static`.
**No `bf-*` file should put a complex selector inside `:not()` in this build.**

**D-20.6 — `span` stays a one-member union and the raw attribute stays valid.**
`span="full"` renders `data-span="full"`; absent, nothing is rendered, so the
default card's markup is byte-for-byte `wfCard.vue`'s. `inheritAttrs` is left
at its default, so a wrapper may keep writing the raw `data-span="full"`
attribute the way `wfCardProduct.vue:23` does — probe 20 asserts both paths
produce the same layout. `grid-column: 1 / -1` comes from a stylesheet rule
keyed off the attribute; no inline `style` is written by this component at all
(asserted), and no column template is authored anywhere (D9 / #13).

**D-20.7 — acceptance substitution (residual #86).** The vitest harness on
`dev` is broken and pre-existing, so the spec's acceptance is met by the probe
at `src/pages/bf-probe/20-bf-card.vue` under the #109 harness:
`npx tsx scripts/check-probes.ts --only 20` (41 rows) and the full
`npx tsx scripts/check-probes.ts` (12 probes, 442 rows) both exit 0. The spec's
own shell greps were run as written, except `npm run typecheck`, which is
replaced by the epic's no-new-errors gate: baseline **178** `error TS` on `dev`,
**178** after, **0** in `src/components/bf`, `src/types`, `src/composables/bf`
or `content.config`.
