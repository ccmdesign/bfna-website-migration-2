# 41 — `bfNotice` — notice/banner

One-line objective: componentise the raw `.wf-note` box as `bfNotice`,
replacing three raw `<p class="wf-note">` usages.

## Context

Depends on 02 (`bf-scaffold`). Builds from `.wf-note` (`public/css/
wireframe.css` L114-121, "monospace reviewer/system-note box") used raw at
`search.vue` (×2, the semantic-search caveat + "No records matched") and
`insights/[slug].vue` (the archive banner). Consumed by 46 (site
announcement band — but see Out of scope below), 50 (insight-detail archive
banner), 54 (search empty-state note, via `bfSearchShell`/`bfEmptyState`
composition — record which). Provenance: BF-170.

## Scope

- File: `src/components/bf/Notice.vue` → `<bfNotice>`.
- Props:
  ```ts
  interface Props {
    variant?: 'note' | 'info' | 'warning'   // drawn only from existing semantic tokens
  }
  ```
  Default slot.
- Renders `<div class="bf-notice" :data-variant="variant" :role="
  announced ? 'status' : undefined"><slot /></div>` — `role="status"` when
  the message is announced dynamically (i.e. it can appear/disappear at
  runtime in response to user action, like the search "no results"
  message), a plain block otherwise (like a static archive banner that's
  present at initial render and never toggles). Since this distinction is
  behavioural, not prop-driven from the wf source, expose it as a prop
  (`announced?: boolean`, default `false`) rather than inferring it, and
  document in Decisions which of the three real call sites set it `true`.
- Three variants render **distinguishably using only existing semantic
  tokens** (no new colour) — note/info/warning map to whichever of
  `--color-primary`/`--color-warning`/`--color-neutral` etc. already exist
  post-issue-06 token cleanup; if a genuinely distinct "warning" semantic
  token does not exist yet, record that gap in Decisions rather than
  inventing one.

## Out of scope

- New colours for the variants (existing tokens only).
- Dismissal behaviour, toasts (no wireframe evidence).
- The site announcement band's own layout — issue 46's layout shell decides
  *whether* to wrap its announcement in `bfNotice` and how it's positioned;
  this issue only ships the notice component itself.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-notice-bg`, `--_bf-notice-border`, `--_bf-notice-
  color`, one triplet per variant, all referencing existing semantic
  tokens. Monospace font family is a stylistic choice ported from `.wf-
  note` — keep or drop per Decisions (the wf-* monospace look is
  deliberately "review note" styling, likely not appropriate for
  production chrome; record the call).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Notice.vue
grep -q "variant" src/components/bf/Notice.vue
grep -Lq "#[0-9a-fA-F]\{3,6\}" src/components/bf/Notice.vue
```
Probe page `src/pages/bf-probe/41-bf-notice.vue` renders all three variants
side by side:
```bash
grep -q 'data-variant="warning"' .output/public/bf-probe/41-bf-notice/index.html
```
Contrast passes AA in light and dark modes (manual/axe check, documented in
Decisions if no automated contrast tool is wired in). Component adds no
colour literal. Fails today (no `bf/Notice.vue`), passes once done.

## Decisions

Appended by the item-runner for [gh#50](https://github.com/ccmdesign/bfna-website-migration-2/issues/50).

### D-41.1 — Which call sites set `announced`

`announced` is a prop, never inferred, because nothing in the markup
distinguishes a message that appears at runtime from one that is simply
present. Of the three raw `.wf-note` usages the successors will replace,
**exactly one sets it `true`**:

| wf source (frozen — read, never edited) | successor sets `announced` | why |
|---|---|---|
| `pages/wireframes/search.vue:13` — `[semantic ranking simulated — real vector search is Front 4]` | `false` | present at first render, never toggles |
| `pages/wireframes/search.vue:48` — `No records matched — try fewer or different words.` | **`true`** | `v-if="!results.length"` — it appears in response to the user typing, which is precisely what a polite live region is for |
| `pages/wireframes/insights/[slug].vue:18` — the archive banner | `false` | static for the life of the page |

Consumers 46, 50 and 54 inherit this table. A live region that is never
updated is noise in the accessibility tree (and, on some screen readers, is
re-announced on unrelated DOM mutations inside it), so the default is `false`.

`search.vue:59` also carries `class="wf-note"`, but with
`style="border: 0; background: transparent; padding: 0"` — it borrows the type
scale for a per-result score chip and unpaints everything a notice *is*. It is
`bfChip`'s shape, not this component's, and it is **not** one of the three
usages this issue replaces.

### D-41.2 — The "warning" semantic token gap does not exist

The spec asked that a missing distinct warning semantic be recorded rather
than invented. Checked against `tokens/semantic-colors.css` and
`tokens/semantic-colors-shades-and-tints.css` as they stand after issue 06's
cleanup: **nothing is missing.** `--color-warning` (yellow), `--color-info`
(navy) and the neutral `--color-base-*` family are all present, each with the
generated `-super-light` (tint-11) and `-dark` (shade-40) steps. Every one of
the six names below is already used by at least one merged `bf-*` component
(`Media.vue` uses four of them), so this issue introduces no token, no
primitive reference and no colour value (BRIEF §5 rule 2, DoD-6).

| variant | `--_bf-notice-bg` | `--_bf-notice-border` | `--_bf-notice-color` |
|---|---|---|---|
| `note` (default) | `--color-base-super-light` | `--color-base-light` | `--color-text` |
| `info` | `--color-info-super-light` | `--color-info` | `--color-info-dark` |
| `warning` | `--color-warning-super-light` | `--color-warning-dark` | `--color-warning-dark` |

`warning`'s border is the `-dark` step rather than the mid-tone, and that is a
measurement rather than a preference: `--color-warning` on its own tint-11
ground measures **1.84:1**, below the 3:1 WCAG 1.4.11 floor for a boundary
that carries meaning. `info`'s mid-tone measures 9.55:1 and is kept.

### D-41.3 — Contrast: the measured ratios, and what "dark mode" means here

No contrast tooling is wired into this repo (no axe, no jest-axe, and the
vitest harness is broken — residual #86). The ratios were therefore computed
two independent ways and agree to the second decimal: by hand from the token
definitions (`color-mix(in srgb, …)` is a plain interpolation in gamma-encoded
sRGB), and **at runtime inside probe 41**, which parses the resolved computed
`background-color` / `border-inline-start-color` / `color` and applies the
WCAG 2.1 relative-luminance formula.

| variant | ground | border | text | text ÷ ground | border ÷ ground |
|---|---|---|---|---|---|
| `note` | base tint-11 | base tint-73 | `--color-text` | **15.73:1** | **6.88:1** |
| `info` | info tint-11 | `--color-info` | info shade-40 | **14.87:1** | **9.55:1** |
| `warning` | warning tint-11 | warning shade-40 | warning shade-40 | **8.31:1** | **8.31:1** |

All three clear WCAG 1.4.3 AA (4.5:1) for text and 1.4.11 (3:1) for the
boundary, with the smallest margin at 8.31:1 — nearly double the floor.

**On "light and dark modes".** The acceptance line asks for AA in both. This
design system ships **one colourway**: there is no `prefers-color-scheme`
block anywhere under `src/public/css/`, `themes/theme.css` is commented out in
its entirety, and `layouts/bf-probe.vue` pins `color-scheme: light`. The
honest form of the check is therefore that the resolved paint is *invariant*
under the colour scheme — the notice paints its own ground, border and text
from scheme-independent tokens, so a dark-scheme UA canvas cannot leave it
dark-on-dark. Probe 41 asserts exactly that: a second, `aria-hidden` group of
the same three variants renders inside a wrapper forced to
`color-scheme: dark`, and the rows assert that all nine resolved colours are
**identical** to the light group's and that the ratios above still clear their
floors. If a dark theme is ever added, that row fails and this component is
re-examined — which is the outcome worth having.

### D-41.4 — The monospace "reviewer note" look is dropped

`.wf-note` sets `font-family: monospace` and `font-size: 0.8rem`. Its own
comment in `public/css/wireframe.css` calls it a "margin note for reviewers",
and the `[data-pending]` chip beside it uses the same monospace to flag
unresolved decisions — it is deliberately *scaffolding* typography, meant to
read as not-the-design.

`bfNotice` is production chrome: it carries a search result count and an
archive banner to real readers. It therefore **inherits the body font at the
body size**, and probe 41 asserts the negative (resolved `font-family` equals
the body's, and names no monospace family) so that a later "restore wf parity"
edit fails a row rather than landing quietly.

Everything else about the box is kept: the 4px inline-start rule
(`--border-width-thick`, the same length with the literal gone), the
`--space-2xs` / `--space-xs` padding pair, and the tinted ground. Logical
properties replace `border-left`: identical in `ltr`, correct in `rtl`.

### D-41.5 — Acceptance substitutions (test-harness rule, D-37.5)

Two lines of the acceptance block above are unrunnable as literally written;
both are replaced with equivalent-or-stronger checks, per the epic's
test-harness rule and the #109 probe-harness decision.

| spec line | substitution | why |
|---|---|---|
| `npm run typecheck` | the epic's **typecheck gate**: baseline `178` `error TS` on `dev` before the change; `178` after (**≤ baseline**), and **0** of them under `src/(components/bf\|types\|composables/bf)` or `content.config` | `dev` carries ~178 pre-existing legacy errors, so "exits 0" is unreachable by construction (orchestrator decision after #10, residual #71) |
| `grep -Lq "#[0-9a-fA-F]\{3,6\}" src/components/bf/Notice.vue` | a real negative assertion over the **comment-stripped** source: block/HTML comments removed, then a match on `#rgb`-style literals, `rgb(`, `hsl(`, `oklch(` or `color-mix(` **fails** | `-L` prints files *without* the match and `-q` suppresses output, so the two flags cancel and the line exits 0 on any input — matching or not. It would have passed a file made entirely of hex. Stripping comments first is the #115 precedent (`grep -c ":style="` in `verify-bf-chip.ts`): run over the whole file, the check is on the prose, not the code — the source legitimately names `gh#101` and quotes the wireframe's own literals in its rationale |
| *(no vitest test named)* | probe 41 under `npx tsx scripts/check-probes.ts --only 41`, plus the full suite | the vitest harness on `dev` is broken and pre-existing (residual #86); this is the gh#20–#41 precedent |

The rest of the block is run verbatim: `npx nuxt generate` exits 0,
`test -f src/components/bf/Notice.vue`, `grep -q "variant" …`, and
`grep -q 'data-variant="warning"' .output/public/bf-probe/41-bf-notice/index.html`.

### D-41.6 — Evidence

- `npx nuxt generate` → exit 0, 935 routes prerendered.
- `npx tsx scripts/check-probes.ts --only 41` → **PASS, 30/30 rows**.
- `npx tsx scripts/check-probes.ts` (full) → **PASS — 33 probes, 1460 rows, 0 failures**.
- Typecheck gate → 178 total (= baseline), 0 in `bf`/`types`/`content.config` scope.
- Frozen wireframe source, cumulative from the pre-epic base
  `f757a649` → `git diff --stat` prints **nothing** (DoD-4).
