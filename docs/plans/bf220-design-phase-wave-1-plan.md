# Design phase, wave 1 — programme colour, hero/scrim, article flagship

> **Runs as an `/lfg-ccm` epic.**
> Epic: [BF-220](https://app.plane.so/ccm-design/browse/BF-220/) · Plane project **BF — CCM - BFNA** ·
> repo `ccmdesign/bfna-website-migration-2` · base branch `dev` (auto-merge on green CI) ·
> docs root `docs/` · six subtask issues, sequential, decomposition at the end of this file.

## Context

`/impeccable critique` on production `www.bfna.org` scored **19/36** and produced a
salvage ledger (`.impeccable/critique/2026-09-04T18-23-07Z__www-bfna-org.md`). The brief
for v2 is *evolution, not rebrand*: "better, bolder, more modern, still the same
branding", where **bolder = typography, colour, and rethinking decorative images and
elements**.

Three findings drive this wave:

1. **Production's defining mechanism has no hook in v2.** Colour-by-topic recoloured
   every component from one custom property. v2 assigns colour to interface roles
   instead, and the programme system survives only in dead code
   (`css-legacy/global.css:274-289`). `types/directus.ts:75` still carries the old
   four-value `theme` enum with nothing consuming it.
2. **The topic colours fail contrast**, measured: production orange 2.43:1, green
   3.95:1. In v2's own palette, amber is **1.98:1** on white and red **4.39:1** — both
   fail AA. There is **no contrast tooling anywhere in the repo**; every ratio in the
   codebase is a hand-written comment nothing recomputes.
3. **The hero paints nothing.** `bfHero` is four CSS declarations with no image, no
   scrim, no variant hook — and it serves only `/`. The other seven routes render
   `bfPageHeader`.

Outcome: a three-tier programme colour system with a machine-verified contrast floor, a
media/scrim architecture that both head components share, and an article page that
reaches the top of its own type scale.

## Decisions taken (from the user, this session)

- Supersede the ds-epic BRIEF's D5 / §5 rule 2 with a dated decision record.
- Programmes get colour identity, using hues already in the v2 palette.
- The hero work covers **both** `bfHero` and `bfPageHeader` as one system.

---

## Phase 0 — Retire the no-colour rule

`docs/ds-epic/BRIEF.md:52` (**D5**: "No art direction. No new colours.") and §5 rule 2
("Never add a colour… no new `--color-*` token") were correct for the component-build
phase and are wrong for this one. They are also mechanically enforced.

**Write** `docs/decisions/design-phase-colour-and-art-direction.md`, following the house
form already set by `docs/decisions/gh236-ci-verify-workflow.md` (prose, opens with
Context, numbered sections). It must state what is retired, what replaces it (the
contrast gate in Phase 1 — the rule stops being "add no colour" and becomes "add no
colour that fails its measured floor"), and what stays (no oklch; hsl only).

**Amend** `docs/ds-epic/issues/37-bf-hero.md:67` — the acceptance grep
`grep -Lq "background-image\|--color-.*:.*#"` must go, or the hero change cannot land.
Note that file's own lines 149-160 already record that `grep -Lq` is inverted and was
never testing what it claimed; fix and narrow it in the same edit rather than deleting a
gate silently.

---

## Phase 1 — Programme colour tokens + a contrast gate

### The mapping

Three programmes exist (`bfna-website-nuxt/content/bf/programs/*.json`): `democracy`,
`future-leadership`, `transatlantic-relations-global-challenges`. Assign from the
existing five so production's real mapping survives:

| Programme | v2 primitive | Production ancestor |
|---|---|---|
| `democracy` | `--hsl-green` (teal, `188, 97%, 28%`) | Democracy was green |
| `future-leadership` | `--hsl-red` (`352, 59%, 55%`) | Future Leadership was red |
| `transatlantic-relations-global-challenges` | `--hsl-yellow` (amber, `36, 83%, 61%`) | merged from Politics & Society, which was orange |

`--hsl-navy` and `--hsl-blue` stay out of it, so `--color-accent` and `--color-primary`
keep carrying the neutral interface spine.

### The three tiers

Measured on white (`#FFFFFF`), computed this session:

| Hue | Base | On white | On-light value (≥4.5:1) | New ratio |
|---|---|---|---|---|
| teal | `#027A8D` | **5.03 ✓** | `188, 97%, 29%` → `#027F92` | 4.72 |
| red | `#D0495B` | **4.39 ✗** | `352, 59%, 54%` → `#CF4457` | 4.55 |
| amber | `#EEAC49` | **1.98 ✗** | `36, 83%, 35%` → `#A3680F` | 4.62 |

Only amber genuinely moves. Teal and red are ~1% lightness nudges — the diff is far
smaller than the critique implied.

Add to `src/public/css/tokens/semantic-colors.css`, keyed by an attribute on the route
wrapper. **Do not use the `--theme-*` namespace** — it is taken by the composition
primitives' config hooks (`composition/stack.css:7`, `center.css:51`, `box.css:3-4`).

```css
[data-program="democracy"] {
  --hsl-program:          var(--hsl-green);
  --hsl-program-on-light: 188, 97%, 29%;   /* 4.72:1 on --color-surface-page */
  --hsl-program-on-dark:  188, 97%, 41%;
}
/* …future-leadership, transatlantic-relations-global-challenges … */

:root, [data-program] {
  --color-program:          hsl(var(--hsl-program));
  --color-program-on-light: hsl(var(--hsl-program-on-light));
  --color-program-on-dark:  hsl(var(--hsl-program-on-dark));
}
```

`:root` carries a neutral default (`--hsl-program: var(--hsl-navy)`) so any component
using these tokens renders correctly off a programme route.

**Keep `--hsl-*` as bare comma triplets.** The 21-step alpha ladder depends on
`hsl(var(--hsl-x), 0.4)` parsing; a `hsl(...)` wrapper here breaks it.

**Seed programme tokens from the primitives, not from the semantic status roles.** Amber
is `--color-warning`, red is `--color-fail`, teal is `--color-secondary`/`--color-success`.
Aliasing would weld the two axes together permanently.

### Apply the hook

Set `data-program` on the route wrapper in `src/pages/[program].vue`,
`src/pages/insights/[slug].vue` and `src/pages/projects/[slug].vue`, read from the
existing `program.slug` / `insight.program` relations. Pages render no wrapper element by
convention (`layouts/bf-default.vue:331`) — put the attribute on the outermost `bfSection`
/ `bfPageHeader`, or add it to `<main>` via `useHead`, not a new `<div>` (a wrapper would
swallow the bands into one stack child).

### The gate — this is what makes the tiers real

**New: `bfna-website-nuxt/scripts/check-contrast.ts`.** Parses the token files, resolves
the `--hsl-*` graph, and asserts every declared pair clears its floor:

- `--color-program-on-light` vs `--color-surface-page` ≥ 4.5
- `--color-program-on-dark` vs the scrim ground ≥ 4.5
- `--color-text` vs `--color-surface-page`, `--color-text-inverse` vs `--color-surface-inverse`
- white vs each `--color-program` (the chip case — **records that amber fails at 1.98 and
  must use dark-text-on-tint**, rather than silently passing)

Wire as `npm run check:contrast`, alongside the existing `npm run validate:tokens`, and
add to `.github/workflows/verify.yml`. Model it on `scripts/validate-tokens.ts` (same
regex-parse-then-assert shape, same reporting style). Reuse nothing else — there is no
colour utility in the repo to reuse.

### Do not touch in this phase

The ladder-numbering defect (`--color-*-super-dark` is *lighter* than `--color-*-dark`
for seven families, `semantic-colors.css:103-104`) and the ~48 utility classes
referencing undefined `--color-black-shade-*`. Both are real; both are pre-existing token
debt belonging to `docs/ds-epic/issues/06-token-hygiene.md`, not to this change.
Note also that `validate-tokens.ts:240` omits `composition` from its expected layer
order while `styles.css:1` declares it — flag, do not fix here.

---

## Phase 2 — Hero + scrim architecture

### The measured constraint that decides the design

A uniform navy scrim over the **worst case — a blown-out white photograph, which is
exactly BFNA's house style** — needs **alpha ≥ 0.70** for white text at 4.5:1:

| alpha | white on scrim |
|---|---|
| 0.60 | 3.69 fail |
| 0.65 | 4.25 fail |
| **0.70** | **4.90 PASS** |

And at any workable alpha, the on-dark programme hues **do not survive over media**
(teal 1.69, amber 2.15, red 1.66 on a 0.65 scrim over white).

**Therefore the rule: over media, type is white. Programme colour appears only as an
opaque fill — a chip, a rule, a panel — never as text.** This is deterministic, holds for
any photograph, and is what makes the later Higgsfield video pass tractable: a fixed
scrim over a moving image behaves identically to one over a still.

This directly replaces production's failure mode, where a gradient hand-tuned to one
photo degraded from 10.55:1 to 2.21:1 across a single line of text.

### Tokens

In `semantic-colors.css` (there is no scrim, overlay or opacity token anywhere today):

```css
--color-scrim:       hsl(var(--hsl-navy), 0.70);  /* floor: white ≥4.5 over white imagery */
--color-scrim-panel: hsl(var(--hsl-navy), 0.94);
```

### Component work

A shared media/scrim layer consumed by **both** `bfHero` (homepage) and `bfPageHeader`
(the other seven routes). Both already render an inner `.center`, so the scrim goes on the
outer element, outside it.

- `src/components/bf/Hero.vue` — add optional `image` / `scrim` props. Keep
  `--_bf-hero-min-height: 60svh`; **`svh`, not `vh`**, is deliberate (`Hero.vue:227-229`)
  and `.cover` cannot express it (its scale offers only `50vh|75vh|100vh|auto`).
- `src/components/bf/PageHeader.vue` — same props. It currently has **no `<style>` block
  at all**; adding one means adding an `@layer components { }` wrapper by hand.
- Render media through the existing `bfMedia`. Two hero image sources already exist and
  are read by nothing: `src/public/images/hero/{democracy,future-leadership,politics-society}.jpg`
  (+@2x/webp) on disk, and an `image` field in every `content/bf/programs/*.json`. Prefer
  the **local** files — being local they go through `NuxtImg` and get a real srcset;
  external Directus URLs deliberately do not (`Media.vue:70-76`).
- Two scrim modes on one attribute: `data-scrim="full"` (flat 0.70 navy over the whole
  band — the bold dark treatment) and `data-scrim="panel"` (opaque panel behind the copy,
  image uncovered elsewhere). Default `full`.

### Gotchas that will bite

- **Never place the scrim inside a `.stack`.** `.stack` spaces with `> * + *` margin, not
  `gap`, so an absolutely-positioned scrim still takes a `margin-block-start`. This has
  already caused three logged defects (`layouts/bf-default.vue:77-103`, `Hero.vue:94-130`,
  `PageHeader.vue:158-190`). Put it in the hero's own grid context.
- **`.center` is `content-box` with `padding-inline`** (`center.css:50-58`), so its
  rendered width is `measure + 2×padding`. A full-bleed scrim must sit on `.bf-hero`, not
  inside `.center`.
- **Bare buttons stretch in a `.stack`** — wrap in a `<div>`. Today's hero actions are in
  a `.cluster` and safe; restructuring the inner box can reintroduce it.
- **Wrap every new style block in `@layer components { }` by hand.**
  `nuxt.config.ts:200` sets `cascade-layers: false`; `scripts/check-routes.ts` gates it.
- **Focus disappears on a dark scrim.** `base/focus.css:76-82` outlines with
  `--color-text` (near-black) and there is no inverse variant. Add
  `.bf-hero[data-scrim] :focus-visible { outline-color: var(--color-text-inverse) }` —
  sanctioned, since `focus.css` is in `@layer defaults` specifically so a component layer
  can win.
- Do **not** adopt `.cover`, `.frame` or `.imposter`. All three are written but used zero
  times; `.cover` defaults to `100vh` and regresses the `svh` fix, `.frame`'s universal
  child rule forces `100%/100%` on a text panel, and `.imposter` supplies no containing
  block and gives overflowing copy a scrollbar.

---

## Phase 3 — The article page as flagship

`src/pages/insights/[slug].vue`. Reading measure is `60ch` via
`bfSection measure="narrow"` → `center.css:67`.

1. **Reach the top of the type scale.** `h1` is `--size-4` (max 2.33rem) and the ramp
   stops at `--size-5` (2.80rem), which nothing uses. Extend Utopia by two steps
   (`--size-6`, `--size-7`) in `tokens/primitive-spacing.css` — the type scale lives in
   the file named "spacing" — continuing the existing 1.125→1.2 ratio, and set the
   article `h1` against them. Keep the generator URL comment convention at
   `primitive-spacing.css:16`.
2. **Raise the body weight.** `base/typography.css:124-130` sets
   `p, li, input, button, a { font-weight: 100 }` — below every `--font-weight-*` token
   and hairline. Move to `--font-weight-normal`. This is sitewide and needs a visual check
   on every route; do it as its own commit.
3. **The programme spine.** A `--color-program` rule down the article's left edge, tying
   the piece to its programme at a glance. Consumes the Phase 1 token; needs no new colour.
4. **Heading weights become tokens.** `typography.css:32-67` uses numeric literals
   (600/500) rather than `var(--font-weight-*)`, and h4/h5 are both `--size-0` — visually
   identical. Fix while in the file.

### Blocked, and why — flagging, not fixing

**Visible citations cannot be done in this wave.** `bfProse` is a hand-rolled parser that
strips every inline mark to plain text (`Prose.vue:97-102`) *and* tag-strips legacy
Directus HTML, so **no `<a>` ever reaches an article body**. The critique's P1 "citations
at 1.77:1" has no v2 equivalent because v2 renders no citations at all. Making them
visible is a renderer replacement plus a `rel`/`target` policy decision — its own issue,
which `Prose.vue:93-95` already says the original issue declined to make.

Same for the end-of-article action: v2 has a download button, not production's Print
button, so there is nothing to replace. Adding share/cite is new scope.

---

## Explicitly not in this wave

Search (P0, but the prototype already rebuilds it), the `/updates` render-everything
problem (v2 already paginates differently), card hover states, the prose renderer, the
video pass, and the pre-existing token debt named in Phase 1.

---

## Verification

1. `npm run check:contrast` — the new gate. Must pass, and must **fail** if a tier value
   is edited to a non-compliant one. Prove both directions.
2. `npm run validate:tokens` and `npm run lint:css` — unchanged, still green.
3. `npm run typecheck` — baseline is a known set of 90 diagnostics
   (`docs/decisions/gh236-ci-verify-workflow.md`); assert no *new* ones.
4. `scripts/check-routes.ts` — the cascade-layer and single-`<h1>` gate.
5. **Browser, via the Browser pane** (`.claude/launch.json` → the dev server; never Bash):
   - `/`, `/democracy`, `/future-leadership`,
     `/transatlantic-relations-global-challenges`, one `/insights/:slug`.
   - Screenshot desktop **and** mobile (375×812), reloading after the switch.
   - Re-measure contrast in-page with the same inline WCAG function used this session —
     confirm the hero's white-on-scrim clears 4.5 against the actual photographs, not
     against the synthetic worst case.
   - Tab through a hero and screenshot the focus ring on the dark scrim.
   - Confirm no horizontal overflow: `documentElement.scrollWidth` vs `clientWidth`.
6. Confirm `data-program` resolves on a programme route and falls back to the neutral
   default on `/about` and `/search`.

---

## Unit decomposition

Six subtasks, sequential. Each becomes one GitHub Issue in
`ccmdesign/bfna-website-migration-2`, branched off `dev`.

### 1. Retire the no-colour rule

Write `docs/decisions/design-phase-colour-and-art-direction.md` retiring BRIEF D5 and §5
rule 2 for the design phase, and repair the acceptance gate at
`docs/ds-epic/issues/37-bf-hero.md:67`. That file's own lines 149-160 record that
`grep -Lq` is inverted and never tested what it claimed — fix the inversion and narrow the
gate rather than deleting it silently.

**Acceptance:** decision record committed, follows the house form in
`docs/decisions/gh236-ci-verify-workflow.md`, names what is retired, what replaces it (the
measured contrast floor) and what stays (hsl only, never oklch). The hero grep gate no
longer forbids `background-image`, and is no longer inverted. Docs and CI config only — no
app code.

### 2. Add the contrast gate

New `bfna-website-nuxt/scripts/check-contrast.ts`, modelled on the existing
`scripts/validate-tokens.ts`. Resolves the `--hsl-*` var graph and asserts declared pairs
against WCAG floors. Wire as `npm run check:contrast` and add to
`.github/workflows/verify.yml`.

**Acceptance:** run against the palette as it stands today it reports the real baseline —
teal 5.03 pass, red 4.39 fail, amber 1.98 fail on white — and exits non-zero. Includes a
self-check proving it fails when a value is edited below its floor, so the gate is known to
bite. No colour-library dependency; the maths is ~20 lines.
**Blocked-by:** #1

### 3. Programme colour tokens

Three tiers per programme in `src/public/css/tokens/semantic-colors.css`, keyed by
`[data-program]`, with a neutral `:root` default. Seeded from the primitives, never from the
semantic status roles, so the programme and status axes can diverge.

**Acceptance:** `npm run check:contrast` green. `--hsl-*` stay bare comma triplets and the
21-step alpha ladder still resolves. `npm run validate:tokens` and `npm run lint:css`
unchanged. No `--theme-*` name used. Pre-existing ladder debt untouched.
**Blocked-by:** #2

### 4. Wire `data-program` onto the routes

Set the attribute on `src/pages/[program].vue`, `src/pages/insights/[slug].vue` and
`src/pages/projects/[slug].vue` from the existing program relation.

**Acceptance:** the attribute resolves on all three programme routes and falls back to the
neutral default on `/about` and `/search`. No new wrapper element — pages render none by
convention (`layouts/bf-default.vue:331`), so a `<div>` would swallow the bands into one
stack child.
**Blocked-by:** #3

### 5. Hero + scrim architecture

Scrim tokens, plus a shared media/scrim layer consumed by both `bfHero` and `bfPageHeader`.
Two modes on one attribute: `data-scrim="full"` (flat 0.70 navy) and `data-scrim="panel"`.
Includes the inverse focus ring, since `base/focus.css` outlines with near-black
`--color-text` and vanishes on a dark scrim.

**Acceptance:** white hero copy measures ≥4.5:1 over the actual programme photographs, not
just the synthetic worst case. Programme colour appears only as opaque fill, never as text
over media. `60svh` preserved. Scrim is not a child of any `.stack`. New style blocks
wrapped in `@layer components { }` by hand. Focus ring visible on the dark scrim,
screenshotted. Uses the local `src/public/images/hero/*.jpg` so NuxtImg generates a srcset.
**Blocked-by:** #3

### 6. Article typography and programme spine

Extend the Utopia ramp with `--size-6`/`--size-7` in `tokens/primitive-spacing.css`, set the
article `h1` against them, raise `p, li, input, button, a` off `font-weight: 100`, replace
the numeric heading weights in `base/typography.css:32-67` with `--font-weight-*` tokens,
and add the `--color-program` spine to the article body.

**Acceptance:** body weight change committed separately from the scale change, with both
light and mobile visual checks on every route — it is sitewide. h4/h5 no longer render
identically. Reading measure stays `60ch`. Inline citations are explicitly **out of scope**
and flagged: `bfProse` strips every inline mark to plain text (`Prose.vue:97-102`), so no
`<a>` reaches an article body and making them visible is a renderer replacement, filed as
its own issue rather than attempted here.
**Blocked-by:** #4
