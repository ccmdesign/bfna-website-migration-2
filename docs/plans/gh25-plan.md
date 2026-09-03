# Plan — gh#25 / issue 16: `bfChip` (incl. the new `toggle` variant)

Spec: [`docs/ds-epic/issues/16-bf-chip.md`](../ds-epic/issues/16-bf-chip.md) ·
Brief: [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) ·
Pattern set by gh#23 (`bfLogo`) and gh#24 (`bfButton`).

## 1. Approach

One presentational atom, four modes, resolved from the props rather than
chosen by the caller — the rule `bfButton` already established:

| props | element | `data-element` |
|---|---|---|
| `toggle` | `<button type="button" aria-pressed>` — **whatever else is set** | `toggle` |
| `to` | `<NuxtLink :to>` | `link` |
| `href` (no `to`) | `<a :href>`, `[data-external]` when `external` | `anchor` |
| none of those | `<span>` | `span` |

`toggle` outranking `to`/`href` mirrors `bfButton`'s `disabled` rule and for
the same reason: a chip that emits `update:modelValue` must be a real,
focusable, keyboard-activatable control. `NuxtLink` navigates on activation
and `<span>` is not focusable at all, so neither can carry the toggle
contract. Pairing `toggle` with `to`/`href` is a caller mistake, not a case to
render; it is ignored rather than warned about.

**Space/Enter needs no handler.** A native `<button>` is defined by HTML's
activation behaviour to fire `click` on both keys, so the single `@click`
handler is the whole keyboard story. Anything else — a `keydown` listener on a
`<div role="button">` — would be re-implementing what the platform gives for
free and is exactly what this issue exists to avoid.

## 2. Active state is a CSS rule, not an inline style

The spec's acceptance is explicit and machine-checkable:

```
grep -c ":style=" src/components/bf/Chip.vue   # after: 0
```

So this component ships **no** style binding at all, and therefore no
`cssVars` computed. The `--_bf-chip-*` hooks are declared with their defaults
in `@layer components` and re-pointed by a `.bf-chip[data-active]` rule in the
same layer. `data-active` is driven by `modelValue` in toggle mode and by
`active` in the other three.

This is a deliberate, recorded departure from BRIEF §5 rule 4's "style binding
via a computed `cssVars`": that rule exists for **prop-derived overrides**
(`bfButton`'s `variant`/`size`), and `bfChip` has none — its only variable
input is a *state*, which CSS expresses natively and an inline style expresses
worse (an inline style cannot be outranked by a consumer's rule). The hooks
themselves are unchanged, and `$attrs` fallthrough still lets a caller pass
`style` to override any of them, so the documented escape hatch survives.
Recorded in the spec's Decisions.

This one rule replaces `wfChip.vue:12`'s inline-style branch **and** the two
hand-rolled duplicates at `search.vue:23-27` / `:31-35`, so `bfFilterBar`
(gh#39 / issue 30) composes `bfChip[toggle]` and never re-decides any of it.
Neither frozen file is edited (D2).

## 3. Colour and box metrics — existing tokens only

No new colour (BRIEF §5 rule 2 / DoD-6), no primitive. The frozen wireframe
chip rule's literals map onto tokens that already exist:

| | wireframe | here | why |
|---|---|---|---|
| default ground | *none* | `none` | paints no ground, as `bfButton` does |
| default text | inherited | `--color-text` | |
| default border | `1px solid #666` | `--border-width-thin solid --color-text` | the lo-fi grey is a placeholder; `bfButton` mapped its border the same way, and consistency across the two atoms beats matching a mid-grey with no semantic name |
| active ground | `#222` | `--color-surface-inverse` | the semantic layer's own comment: "the ground an inverted block sits on … use this one in an inverted context" |
| active label | `#fff` | `--color-text-inverse` | the gh#101 alias |
| radius | `999px` | `--radius-pill` | resolves to exactly `999px` |
| padding | `0.1em 0.6em` | same, em-relative | parsed back out of `wireframe.css` by the verify script, not typed twice |

`--color-text-inverse` on `--color-surface-inverse` is ≈21:1.

Type: `--size--2` (the existing Utopia step nearest the frozen `0.7rem`),
`text-transform: uppercase`, `letter-spacing: 0.05em`. `font-family` is
**inherited**, not `monospace`: the mono face is the wireframe's lo-fi tell,
there is no mono token, and D5 puts `bf-*` on the real type scale.

**Focus ring.** `--_bf-chip-focus-color`, default `currentcolor`, re-pointed
to `--color-text` under `[data-active]`. This mirrors gh#24's
`--_bf-button-focus-color` and the WCAG 1.4.11 defect it fixed: `outline-offset`
draws the ring outside the box, on the page ground, so left on `currentcolor`
an active chip would paint a white ring on a white page — no visible focus
indicator at all.

## 4. Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | **add** `ChipProps` (BRIEF §5 rule 11 — no inline shared types) |
| `src/components/bf/Chip.vue` | **new** — the component |
| `src/pages/bf-probe/16-bf-chip.vue` | **new** — probe, kept (only gh#68 removes `bf-probe/`) |
| `scripts/verify-bf-chip.ts` | **new** — the acceptance script |
| `docs/ds-epic/issues/16-bf-chip.md` | append to **Decisions** only |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue`, `composables/useWfContent.ts`,
`public/css/wireframe.css` or `assets/wireframe-data/` is touched (D2 / DoD-4).

## 5. Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so — as
in gh#20–gh#24 — acceptance is **a probe page plus a `tsx` script**, and the
substitution is recorded in the spec's Decisions.

**`npx tsx scripts/verify-bf-chip.ts`** — static/relational, mirrors
`verify-bf-button.ts` section for section: the spec's own literal
`test`/`grep` expressions run as written (including `:style=` → 0); box
metrics parsed out of the frozen stylesheet and compared with what the
component declares; no colour literal and no primitive in either new file;
`ChipProps` declared in `bf-contracts.ts` and imported, not re-declared;
`@layer components` present in the source **and** in the emitted stylesheet
(the gh#101 guard — brace-matched "delete every layer block, then look for
what is left", not a naive prefix match); frozen paths byte-identical to the
pre-epic base SHA; and the prerendered probe carries the expected instance
counts. Exit `0` only when every check ran *and* passed — a skip is
`INCOMPLETE` and exits `1`.

**`/bf-probe/16-bf-chip`** — runtime, in a real browser: all four modes render
the right element; `[data-external]` marks only the external anchor;
`aria-pressed` starts `"false"`, flips to `"true"` on activation, and
`[data-active]` tracks it; `update:modelValue` reached the parent (a `v-model`
bound to a live counter); **no chip carries a `style` attribute**, i.e. the
active state really is CSS; every interactive chip takes focus and the span
does not; the `:focus-visible` rule is read back out of the live CSSOM with a
real outline plus the `--outline-focus` halo; the ring colour contrasts ≥3:1
with the page ground in both states; computed colours equal the resolved
tokens; the em-normalised padding and the border width equal the frozen
wireframe chip's, measured rather than asserted; and `@layer components`
survived into the live CSSOM.

**Keyboard, twice over.** (a) A deterministic assertion in the probe's own
check table: a `MouseEvent('click', { detail: 0 })` — which is precisely what
a UA dispatches for keyboard activation of a button — flips `aria-pressed`;
plus the root really is `<button type="button">`, the element whose
Space/Enter activation is a platform guarantee. (b) A live keyboard panel with
its own `data-testid="probe-16-keyboard"` verdict cell, `pending` until a real
Enter **and** a real Space arrive as untrusted-free UA clicks (`detail === 0`)
— driven for real in the browser-test step. The panel is reported separately
so that opening the probe without touching the keyboard reads `pending`, never
a misleading `FAIL`.

## 6. Gates

- Typecheck gate is **no new errors**: `dev` baseline is **178** `error TS`
  lines; after must be ≤ 178, and 0 of them may match
  `src/(components/bf|types|composables/bf)|content\.config`.
- `npx nuxt generate` exits 0 (never `npm run generate` — Directus secrets).
- `git diff --stat <pre-epic SHA> HEAD -- <frozen paths>` prints nothing.

## 7. Risks

| Risk | Mitigation |
|---|---|
| BRIEF §5 rule 4 (`cssVars`) vs the spec's `:style=` → 0 acceptance | Resolved in favour of the spec's machine-checkable rule; rationale in §2 and recorded in the spec's Decisions. Hooks + `$attrs` keep the override path open. |
| `toggle` + `to`/`href` passed together | `toggle` wins, documented; a link cannot carry the toggle contract. |
| Synthetic `KeyboardEvent` does not produce a click in any browser | Not used. The deterministic check uses `detail: 0` click (what the UA itself dispatches); the real key presses happen in the browser-test step against a separate verdict cell. |
| The frozen chip's `0.7rem`/monospace vs the token type scale | Padding is compared **em-normalised**, so the metrics check is about the declaration, not the inherited font size. |
| `postcss-preset-env` flattening `@layer` (gh#101 / residual #98) | Asserted in both the emitted CSS (script) and the live CSSOM (probe). |
