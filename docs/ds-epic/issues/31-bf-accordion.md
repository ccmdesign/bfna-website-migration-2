# 31 — `bfAccordion` — styled skin over native `<details>`

One-line objective: new molecule `bfAccordion`, a styled skin over native
`<details>`/`<summary>`, replacing the hand-rolled `<details>` per year in
`archive.vue`.

## Context

Depends on 02 (`bf-scaffold`). Builds from raw `<details>` in
`src/pages/wireframes/archive.vue:14-23` (one per year, `:open="y ===
years[0]"`, `<summary><strong>{{ y.year }}</strong> ({{ y.items.length
}})</summary>`). Consumed by 55 (`/archive` template, one accordion per
year). Provenance: BF-211.

## Scope

- File: `src/components/bf/Accordion.vue` → `<bfAccordion>`.
- Props:
  ```ts
  interface Props {
    label: string     // summary text
    open?: boolean     // initial open state, maps to <details open>
  }
  ```
- Root: `<details class="bf-accordion" :open="open"><summary>{{ label
  }}</summary><div class="bf-accordion__body"><slot /></div></details>` —
  **native** semantics only, no custom ARIA disclosure re-implementation
  (`aria-expanded`, `role="button"`, etc. are all handled for free by the
  browser's own `<details>`/`<summary>` behaviour and must not be
  duplicated by hand).
- Styling is purely cosmetic (marker glyph, spacing, border) via CSS on
  `summary::marker` or a custom marker if the design calls for one — never
  by replacing `<summary>`'s default disclosure behaviour with a `<button>`
  + `v-show`.
- `label` is a plain string prop, not a slot — matches the wf source's
  `<summary><strong>{{ y.year }}</strong> ({{ y.items.length
  }})</summary>` closely enough that the caller (issue 55) can compose the
  "Year (count)" string before passing it in as `label`. If a richer
  summary (e.g. a count badge with its own markup) turns out to be needed,
  add a `summary` slot as a **second** occurrence per the rule-of-three —
  do not add it speculatively here.

## Out of scope

- Exclusive/single-open accordion-group behaviour (each `<details>` is
  independent — matches the wireframe, which allows multiple years open
  at once).
- Animating `height` on open/close (no wireframe evidence, adds
  complexity for a first version).
- Editing the hand-rolled `<details>` blocks in `archive.vue` (D2 — frozen;
  issue 55 builds the new page that uses `bfAccordion` instead).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-accordion-marker-color`, `--_bf-accordion-gap`
  (Utopia space token). No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Accordion.vue
grep -q "<details" src/components/bf/Accordion.vue
grep -Lq "aria-expanded" src/components/bf/Accordion.vue
```
Probe page `src/pages/bf-probe/31-bf-accordion.vue` renders one open and one
closed accordion, nested inside a `bfSection` (issue 39) to prove no layout
breakage:
```bash
grep -q "<summary" .output/public/bf-probe/31-bf-accordion/index.html
```
Opens/closes by mouse and keyboard (native `<details>` guarantees this);
content is reachable in the tab order only when open (native behaviour).
Fails today (no `bf/Accordion.vue`), passes once done.

## Decisions

Recorded by the item-runner for [gh#40](https://github.com/ccmdesign/bfna-website-migration-2/issues/40).

### D-31.1 — `bfSection` does not exist yet; the probe builds the band by hand

The spec above asks the probe to nest the accordion "inside a `bfSection`
(issue 39)". That reference cannot be honoured at this point in the epic:
`issues.md` row 39 (`bf-section`) is **gh#48**, which runs *after* this one —
this issue's only `Blocked-by` is #11 (issue 02, `bf-scaffold`).

Substituted, per the test-harness rule: each probe case sits in a plain
`<section class="probe__band"><div class="center | stack" data-gap="s">`, which
is precisely the element `wfSection.vue` renders today and that `bfSection` will
evolve. The claim the spec is making — *"no layout breakage when nested in a
band"* — is a claim about the CUBE primitives, and those are what the probe
measures against: no accordion wider than its band, no band with a horizontal
scrollbar, no document-level horizontal scrollbar, no overlap between stacked
accordions, and a closed accordion measurably shorter than an open one holding
the same 980-character body.

**Follow-up for gh#48:** when `bfSection` lands, its own probe should render a
`bfAccordion` inside it, closing this gap from the other side. No change to
`bfAccordion` is expected.

### D-31.2 — acceptance is probe 31, not vitest

The spec's acceptance block names `npm run typecheck`. The vitest harness on
`dev` is broken and pre-existing (residual
[#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)), and
`npm run typecheck` cannot be green — `dev` carries 178 legacy `error TS` lines.

The gate applied instead, per the orchestrator decision after #10 (residual
[#71](https://github.com/ccmdesign/bfna-website-migration-2/issues/71)):

| Gate | Result |
|---|---|
| `npx nuxt typecheck` total `error TS` | **178**, equal to the pre-change baseline — no new errors |
| …restricted to `src/components/bf`, `src/types`, `src/composables/bf`, `content.config` | **0** |
| `npx nuxt generate` | exits 0, 911 routes |
| `npx tsx scripts/check-probes.ts --only 31` | **PASS — 51/51 rows** |
| `npx tsx scripts/check-probes.ts` (full suite) | **PASS — 23 probes, 1078 rows, 0 failures** |
| `grep -q "<summary" .output/public/bf-probe/31-bf-accordion/index.html` | 6 occurrences |
| wireframe-source diff (`dev...HEAD` and cumulative from the pre-epic base) | prints nothing |

The `grep -Lq "aria-expanded"` line in the acceptance block is run over
**comment-stripped source** — the #115 hardening rule. The component's block
comment names `aria-expanded` in the table of things it deliberately does not
write, so a grep over the raw file would be a check on the prose rather than on
the code. Comment-stripped, the source contains no `aria-expanded`,
`role="button"`, `aria-controls`, `v-show`, `:style=` or `addEventListener`.

### D-31.3 — the marker is a border, not a glyph

The spec allows "`summary::marker` or a custom marker". A glyph — `▸`, `⌄` — is
generated content, and generated content is concatenated into the accessible
name computation: the `bfBreadcrumb` separator defect (gh#37) at a different
pseudo-element. The alt-text form `content: "▸" / ""` fixes that, but it fixes
it in a way a build step can silently drop, and it depends on the glyph existing
in the loaded font.

So the marker here is `content: ""` — the **empty string** — on a `::after` box
drawn with two borders and rotated. There is no text to reach the accessibility
tree, no alternative-text half to lose, and no font to fail. Probe 31 asserts
the resolved `::after` content is `""`, that the borders have real width and a
resolved colour, that the `[open]` transform differs from the closed one, and
that `summary.textContent` is exactly the `label`.

Both UA markers are removed rather than one: `list-style: none` (plus the
`display: flex` that already drops the `list-item` box) for Chromium/Firefox,
and `::-webkit-details-marker { display: none }` for WebKit — neither engine's
marker is reachable through the other's selector.

### D-31.4 — the keyboard is pressed, not simulated

The issue's acceptance is *"it opens and closes by mouse and keyboard"*. The
unusual thing about that claim here is that it is a claim about code that **does
not exist**: `bfAccordion` writes no key handler, and asserts the browser's own
one is intact because nothing was done to break it. A scripted
`summary.click()` would pass on a `<button>` + `v-show` rewrite that had
silently lost Space, which is exactly the regression this component is designed
to prevent.

Probe 31 therefore declares `data-probe-keys="Enter,Space"`
(`docs/decisions/probe-harness.md` Decision 4) and asserts, from real trusted
CDP key events on a focused `<summary>`: Enter opened it, Space closed it, both
events were `isTrusted`, exactly two `toggle` events fired, and the element
ended closed with nothing having re-rendered it back open.

Per the gh#39 rule about the sequential-focus starting point, every `.focus()`
in the probe runs **inside `finalise()`**, after the key sequence — the one
exception being the deliberate `labSummary.focus()` that says where the keys are
to be delivered. A 6-second safety net finalises with a `timedOut` row of its
own rather than leaving the harness to report an uninformative PENDING timeout.

### D-31.5 — `open` is an initial state, and the component holds none

`<details :open="open">` binds the **content attribute**. Vue writes it on the
first render and never touches that node again, so the `open` *property* the
browser flips on every toggle is left alone: no `ref`, no `v-model`, no
`@toggle`, no emit. After the user has interacted, the prop and the DOM disagree
— and that is correct, because the interaction is the source of truth.

A caller wanting *controlled* disclosure wants a different component. This one
declines to become one, because the entire value of native `<details>` is that
its keyboard contract and its tab-order behaviour belong to the browser.

`AccordionProps` is exported from `src/types/bf-contracts.ts` rather than
declared in the SFC — the majority atom precedent (`LogoProps`, `ButtonProps`,
`ChipProps`, `MediaProps`, `TimeProps`, `BylineProps`, `SkipLinkProps`,
`FilterBarProps`), and what issue 55's archive template will import.

### D-31.6 — `checkVisibility()`, not `getClientRects()`

The tab-order row initially asserted that a link inside a closed accordion has
**no layout box** (`getClientRects().length === 0`). It failed on a correct
component. Chrome no longer hides a closed `<details>`'s content with
`display: none` but with `content-visibility: hidden`, so the subtree is skipped
for rendering while its elements still report a locked box.

`checkVisibility()` is the API that answers the question actually being asked —
*is this painted?* — across both mechanisms, and it is what the probe uses.
Worth knowing for any later issue that reasons about closed-`<details>` content:
**do not** infer disclosure state from a rect.

### D-31.7 — no `:not()`, no new colour

D-20.5 (gh#29): the open and closed branches are `details[open]` and the base
rule. No negation pseudo-class appears in the file, so there is nothing for
`postcss-preset-env` to mis-lower.

Every colour is an existing semantic token: `--color-neutral-tint-60` (marker),
`--color-neutral-tint-20` (rule line), `--color-text` (focus ring) and
`--outline-focus` (halo). The ring is `--color-text` and never `currentcolor` —
the gh#24-P2-1 finding: it is painted outside the control on the page ground,
where a ring in the control's own colour can go light-on-light (WCAG 1.4.11).

### D-31.8 — review finding P2-1: the body gap is padding, not margin

`.bf-accordion__body` first used `margin-block-start` for the gap between the
summary row and the disclosed content. There is no border or padding between
that margin and the body's first child, so the two collapse: the gap becomes
`max(--_bf-accordion-body-gap, whatever the caller's first paragraph declares)`,
and the custom property governs the spacing only for content that happens to
carry no top margin of its own.

A hook that silently stops working depending on what is slotted into it is worse
than no hook. Both edges of the body are now padding, which does not collapse.

Findings from the inline diff review of PR #149: **P1 0 · P2 1 · P3 2**, all
three applied in `fix(review)`. Nothing was left unapplied, so no residual issues
were opened.
