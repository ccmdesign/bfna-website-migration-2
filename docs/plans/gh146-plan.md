# gh#146 — 28b Foundation: global `:focus-visible` rule (residual #145)

Spec: the issue body of <https://github.com/ccmdesign/bfna-website-migration-2/issues/146>.
Evidence: <https://github.com/ccmdesign/bfna-website-migration-2/issues/145>.
Epic: <https://app.plane.so/ccm-design/browse/BF-217/>

There is no `docs/ds-epic/issues/` file for this item, so this plan and the PR
body carry the Decisions section.

## The finding, restated from measurement

Grepping `src/public/css/` for `focus` returns exactly one rule set:
`base/forms.css:34-38`, which covers `input`, `textarea` and `select` — and
which writes `outline: none` and paints the ring with `box-shadow` alone.
Nothing in the CUBE stack styles a focused link, `<summary>`, or any other
focusable element. Every `bf-*` atom that renders a focusable control has
therefore had to declare its own ring:

| component | selector | ring colour |
|---|---|---|
| `bfButton` | `.bf-button:focus-visible` | `--_bf-button-focus-color` |
| `bfChip` | `.bf-chip:focus-visible` | `--_bf-chip-focus-color` |
| `bfSkipLink` | `.bf-skip-link:focus-visible` | `--color-text` (literal, no hook) |
| `bfBreadcrumb` | `.bf-breadcrumb__link:focus-visible` | `--_bf-breadcrumb-focus-color` |
| `bfAccordion` (#40) | `.bf-accordion__summary:focus-visible` | `--_bf-accordion-focus-color` |
| `bfFormField` (#43) | `.bf-form-field__control:focus-visible` | `--_bf-form-field-focus-color` |
| `bfLoadMore` (#41) | *(none — it composes `bfButton`)* | — |

All seven converged independently on the same two-ring treatment:
`outline: var(--border-width-medium) solid <colour>` (survives forced-colors
mode, where `box-shadow` is dropped) plus `box-shadow: var(--outline-focus)`
(the halo). Every hook defaults to `--color-text` rather than `currentcolor`,
which is the gh#24-P2-1 finding: a ring in the element's own colour paints
light-on-light when it is drawn *outside* the element, on the page ground.

## Approach

### 1. One rule, in the `defaults` layer

`styles.css:2` declares the order

    reset, defaults, tokens, themes, composition, components, utils, overrides

so `defaults` is the layer that sits **under** `components` — confirmed by
reading the file, not assumed. `base/typography.css`, `base/forms.css` and
`base/tables.css` all open with `@layer defaults { … }` (the `/* Reset Layer */`
comment above the first two in `styles.css` is stale; the files themselves are
the authority).

New file `src/public/css/base/focus.css`, imported under the Defaults Layer
group in `styles.css`:

```css
@layer defaults {
  :focus-visible {
    outline: var(--border-width-medium) solid var(--color-text);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }
}
```

- **Bare `:focus-visible`, not `a:focus-visible`.** The issue title asks for a
  *global* rule and the gap is not links-only — `<summary>`, `[tabindex]` and
  every focusable element the page templates in phases 5–6 emit directly have
  the same hole. Specificity is `(0,1,0)`, the lowest a pseudo-class rule can
  have, and it is in the weakest author layer that carries paint, so every
  component rule wins over it without a specificity fight.
- **Existing tokens only.** `--border-width-medium` (`semantic-misc.css:33`),
  `--color-text` (`semantic-colors.css:28`), `--outline-focus`
  (`semantic-misc.css:24`, the semantic focus token). No new colour, no new
  token name (DoD-6).
- **A separate file rather than a block appended to `typography.css`,** so the
  rule has one obvious home and `styles.css` names it in its import list.

### 2. Remove only the local rule that is a genuine duplicate

`bfSkipLink`'s `.bf-skip-link:focus-visible` hard-codes `--color-text` and
exposes no hook — the global rule is byte-for-byte the same three declarations
applied to the same element (`.bf-skip-link` is always an `<a>`). It goes.

Every other local rule reads a `--_bf-*-focus-color` hook. Those hooks are the
documented public override surface of their components (and `bfButton`'s and
`bfChip`'s filled/selected variants *reassign* them), so the local rule is what
makes the hook work: delete the rule and the hook becomes dead custom-property
declarations. They stay. Additionally, probes 15, 16, 28, 31 and 34 each assert
"a `:focus-visible` rule for this component exists in `@layer components`" —
rows the item is required to leave passing unchanged.

`bfFormField`'s is doubly load-bearing: `base/forms.css`'s `input:focus`
selector is `(0,1,1)` and sits in the **same** `defaults` layer, so it beats the
new `(0,1,0)` rule on specificity and keeps writing `outline: none` for text
controls. Only the components-layer rule can win there.

### 3. Probe 03 gains a keyboard focus row

Probe 03 currently has no focusable element and finalises synchronously in
`onMounted`. It gains:

- a bare `<a href="#focus-ring-target">` as the **first** tabbable element in
  the document;
- the `data-probe-keys="Tab"` handshake (harness support added in gh#28,
  `docs/decisions/probe-harness.md` Decision 4), armed reactively in
  `onMounted` so the attribute's appearance means "listeners attached";
- a `focusin` listener that, on that anchor, records
  `matches(':focus-visible')`, `checkVisibility()`, `outlineStyle` and
  `outlineWidth`;
- rows asserting the trusted Tab landed on the anchor, that it matches
  `:focus-visible`, and that the resolved outline is a real ring
  (`outline-style` ≠ `none` **and** `outline-width` > 0).

A programmatic `.focus()` would not do: `:focus-visible` is a heuristic about
the last input modality, so it matches under a headless `.focus()` and does not
match in a browser pane on identical code — the exact trap probe 28's comment
at :521 documents. The trusted-key handshake is the sound alternative and probe
19 already proves it works in this harness.

`checkVisibility()` is used for the shown/hidden question rather than a bounding
rect (D-31.6).

## Files

| file | change |
|---|---|
| `bfna-website-nuxt/src/public/css/base/focus.css` | new — the one rule |
| `bfna-website-nuxt/src/public/css/styles.css` | one `@import` under Defaults Layer |
| `bfna-website-nuxt/src/components/bf/SkipLink.vue` | drop the duplicated `:focus-visible` rule |
| `bfna-website-nuxt/src/pages/bf-probe/03-composition-gap-api.vue` | focus-ring section + keyboard handshake + rows |
| `docs/plans/gh146-plan.md` | this file, incl. Decisions |

## Test strategy

1. `npx tsx scripts/check-probes.ts --only 03` — exit 0 (the new rows).
2. `npx tsx scripts/check-probes.ts` — full run exit 0 (probes 15, 16, 19, 20,
   28, 31, 32, 34 keyboard/focus rows unchanged).
3. `npx nuxt generate` — exit 0.
4. Typecheck gate: baseline `178` errors on `dev`; after ≤ 178, and zero in
   `src/components/bf|types|composables/bf|content.config`.
5. Wireframe byte-identity vs `f757a64` — empty.

## Risks

- **Blast radius.** A bare `:focus-visible` changes the rendered focus
  appearance of every page that loads `styles.css`, `/wireframes/*` included.
  BRIEF DoD-4 permits this explicitly (wireframe **source** byte-identity is
  the contract, not rendered output), and #145 flags it as wanting a deliberate
  visual check — STEP 6 does that.
- **Unlayered CSS (#116).** Unlayered author styles beat *every* cascade layer.
  Under the `bf-probe` layout the only stylesheet is `/css/styles.css` (the
  layout is the sole injector, `nuxt.config.ts`'s `css: []` is empty and there
  is no `src/app.vue`), so the rule applies cleanly there — but a scoped SFC
  `<style>` block is unlayered, and `layouts/legacy-base.vue`'s `/global.css`,
  `/fixes.css` and `/v2updates.css` are too. Recorded as a caveat below rather
  than fixed here.
- **`box-shadow` replacement.** On a focusable element that carries a
  components-layer `box-shadow` and no focus rule, the layer order means the
  component's shadow wins outright and the halo is not painted. The `outline`
  still is, so the focus indicator survives.

## Decisions

**D-146.1 — the rule lives in `base/focus.css`, inside `@layer defaults`.**
`styles.css:2` puts `defaults` under `components`, which is what makes the rule
a floor rather than a ceiling: every `bf-*` atom's own ring still wins without
needing extra specificity. Confirmed by reading the order statement and the
`@layer defaults {` opening of `base/typography.css`, `base/forms.css` and
`base/tables.css`.

**D-146.2 — bare `:focus-visible`, not `a:focus-visible`.** #145's suggested fix
was scoped to links because a breadcrumb crumb is what surfaced it. The gap is
wider: `bfAccordion` (#40) hit the same hole for `<summary>` and said so in its
own comment. One rule at `(0,1,0)` in the weakest paint-carrying layer covers
every focusable element and is still outranked by everything above it.

**D-146.3 — only `bfSkipLink`'s local rule is removed.** It hard-codes
`--color-text` with no hook, so it is a pure duplicate. The other six read a
`--_bf-*-focus-color` hook; deleting the rule would orphan the hook (which
`bfButton`'s filled variant and `bfChip`'s selected variant actively reassign)
and would break the "a `:focus-visible` rule exists in `@layer components`" rows
in probes 15, 16, 28, 31 and 34. `bfFormField`'s is additionally the only rule
that can beat `base/forms.css`'s same-layer, higher-specificity
`input:focus { outline: none }`.

**D-146.4 — the ring colour is `--color-text`, not `currentcolor`.** The
gh#24-P2-1 finding, and the value every `--_bf-*-focus-color` hook already
defaults to. `outline-offset` draws the ring outside the element, on the page
ground, so the colour that has to contrast is the ground's.

**D-146.5 — probe 03's new row is driven by a trusted Tab, not `.focus()`.**
Substituting a computed-style read after a programmatic focus would be the
unsound check probe 28:521 documents. Using the `data-probe-keys` handshake
makes probe 03's whole verdict wait on a keypress, which is a real cost; it is
paid because the alternative row would be a lie. A 3s fallback finalises the
probe anyway, so a human opening the page without pressing Tab sees a red row
rather than an eternal `PENDING`.

**D-146.6 — cascade caveat, unlayered CSS (#116).** The new rule is layered, so
any unlayered author CSS still outranks it: scoped SFC `<style>` blocks, and
the three legacy sheets `layouts/legacy-base.vue` links. Under the `bf-probe`
layout — the only shell this epic's probes use, and the one the real shell (#55)
must reproduce — `/css/styles.css` is the sole stylesheet, so the rule applies
with nothing above it. Legacy routes are out of this item's scope; #116 owns
them.

**D-146.7 — no vitest.** The harness on `dev` is broken and pre-existing
(residual #86). Acceptance is `npx tsx scripts/check-probes.ts` (`--only 03` and
the full run), per the epic's substitution rule.

**D-146.8 — probe 03 asserts the ring colour twice, declared and resolved.**
Added by the review. One row reads `--color-text` out of the declared rule's
`style.outline`; the other compares the *resolved* `outline-color` on the
focused anchor against the root's computed `color`, which the `bf-probe` layout
paints from that same token. Compared, never typed out, so no colour literal
enters the probe (epic ground rule 2). A third row asserts the ring is not the
anchor's own `currentcolor` — the gh#24-P2-1 failure made checkable rather than
only commented.

**D-146.9 — `base/forms.css` is left alone, and filed.** Its
`input:not(…):focus` selector is (0,1,1) in this *same* `defaults` layer, so it
outranks the new rule and keeps writing `outline: none`; forced-colors drops the
`box-shadow` it substitutes, leaving a focused bare `<input>` with no indicator.
`bfFormField` is unaffected (its rule is in `@layer components`). Fixing it
changes the form baseline of every legacy route and wants its own visual check,
so it is residual #157 rather than a line here.

**D-146.10 — the deliberate visual check #145 asked for was run.** Headless
Chromium against `.output/public`, real `Tab` presses. `/wireframes/` Tab 1
lands on `a.wf-skip-link` with `outline: 2px solid rgb(8, 8, 8)` and the
`--outline-focus` halo; Tab 4 lands on a `<summary>` with the same ring;
`/wireframes/insights` gives a tabbed `<a>` the same. Zero console errors,
layout unchanged. Rendered output gaining focus rings is what BRIEF DoD-4
permits; the wireframe **source** is byte-identical to `f757a64`.
