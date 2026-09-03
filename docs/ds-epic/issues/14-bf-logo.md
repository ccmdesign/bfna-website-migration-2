# 14 — bf-logo

Build `bfLogo`, consolidating the two legacy SVG logo components into one
with a `variant` prop.

## Context

Depends on 02 (scaffold), 06 (clean tokens). Nothing else in phase 3-5
depends on this (no wireframe `wfLogo` exists — `wfNav.vue` renders no
logo component at all, only `.wf-nav__logo` CSS sizing on plain markup).
Builds from `bfna-website-nuxt/src/components/legacy/atoms/Logo.vue` and
`LogoWhite.vue` (both present, both a single inline `<svg viewBox="0 0
695.1 266.6">` with `class="st0"` paths — `LogoWhite` differs only by an
added `bfna-logo--white` class on the root). Provenance: BF-158; v2 §2
Level 1 row 1 ("rebuild", "new (legacy `Logo.vue`+`LogoWhite.vue`)").

## Scope

- New `bfna-website-nuxt/src/components/bf/Logo.vue` (auto-imports as
  `<bfLogo>` per issue 02's `prefix: 'bf'` entry).
- Props: `variant?: 'default' | 'white' = 'default'`.
- Markup: the same inline `<svg viewBox="0 0 695.1 266.6">` path data from
  `legacy/atoms/Logo.vue` (13 `<path>`/`<polygon>`/`<rect>` elements, all
  currently `class="st0"`). **Verified: no `.st0` rule exists anywhere in
  `src/public/css-legacy/*.css`** — the class is unstyled today, so paths
  render at the SVG default fill (black). Drop `class="st0"` and set
  `fill="currentColor"` directly on each path (or one wrapping `<g
  fill="currentColor">`) instead — this is a like-for-like swap (black →
  `currentColor`, which resolves to black by default), not a new colour —
  so `variant="white"` becomes a CSS `color: var(--color-white)` override
  on the component root, no second SVG needed.
- Sized by a `--_bf-logo-size` CSS variable (default matches the current
  `.wf-nav__logo` sizing in `public/css/wireframe.css` — read that rule's
  computed size and use it as the default, do not guess a new one).
- Accessible name: `role="img"` on the `<svg>` root plus a `<title>`
  element reading `"Bertelsmann Foundation North America"` (the full org
  name the mark represents — confirm against any existing `alt`/`aria-label`
  text already in the legacy nav markup before inventing new copy).
- `$attrs` forwarded to the root `<svg>` (class/style/data-* passthrough).

## Out of scope

- Deleting `src/components/legacy/atoms/Logo.vue` /
  `LogoWhite.vue` — that happens in issue 58 (cutover), not here; both
  legacy files stay in place, untouched, alongside the new `bfLogo`.
- Any new colour — `variant="white"` must be achievable with the existing
  `--color-white`/`currentColor` mechanism, not a new hex/hsl literal.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

Tokens: whatever semantic token the legacy `.st0` fill already resolves to
(read it, reuse it — do not introduce a new colour), plus `--color-white`
for the white variant. CSS-variable hook: `--_bf-logo-size` (controls
width/height via `cssVars`). `$attrs` fallthrough on the `<svg>` root per
BRIEF §5.4. `@layer components`.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Logo.vue   # today: fails, file doesn't exist
grep -c "variant" src/components/bf/Logo.vue   # after: >=1
grep -c "role=\"img\"" src/components/bf/Logo.vue   # after: >=1
grep -c "#[0-9a-fA-F]\{3,6\}\|hsl(" src/components/bf/Logo.vue   # after: 0 — no colour literal
```
Plus: both variants (`default`, `white`) render at three sizes on a probe
page (per the issues.md `verify` column — manual/rendered check).

## Decisions

_Runner appends here._

### gh#23 — first `bf-*` component; these choices are the epic's precedent

**D14.1 — the legacy fill is `#222`, not "the SVG default".** The spec's premise
that `.st0` is unstyled is correct (`grep -rn '\.st0' src/public src/assets
public` → 0 hits), but the mark was never rendering at the SVG default black:
`src/public/css-legacy/global.css:1305-1315` paints the **root `<svg>`** —
`.bfna-logo { width: 100%; fill: #222 }` and `.bfna-logo--white { fill: #fff }` —
and the unstyled `class="st0"` children inherit it. So the like-for-like swap is
`#222 → var(--color-text)` (`--color-text` → `--color-base` → `hsl(0 0% 3%)`,
the nearest existing semantic token) and `#fff → var(--color-white)`. Note
`--color-white` is a *primitive*, not a semantic token — BRIEF §5 rule 2
prefers semantics, the token layer has no semantic white, and adding one would
be a new `--color-*` token that the same rule forbids. The spec names
`--color-white` explicitly, so this issue follows it and files the conflict
for a human ruling (#99). Either way: no new colour and no new token, and the component now contains zero colour
literals of any form (asserted, not grepped by eye — see D14.6).

**D14.2 — `--_bf-logo-size` means block-size, default `1.25rem`, read from the
wireframe.** The spec says to read the default from `.wf-nav__logo` rather than
guess one. Read: `public/css/wireframe.css:170` is
`.wireframe .wf-nav__logo { font-size: 1.25rem; text-decoration: none; color:
inherit; margin-inline-end: auto }` — and `wfNav.vue:6-8` shows why there is no
width or height to read: the wireframe logo is **text**
(`<NuxtLink class="wf-nav__logo"><strong>BFNA</strong></NuxtLink>`), not an SVG.
Its only size is that `1.25rem` type size. So `--_bf-logo-size` is mapped to
**`block-size`**, defaulting to `1.25rem`, with the inline size following from
`aspect-ratio: 695.1 / 266.6`; the mark then occupies the same vertical band the
wireframe reserved for its logo. **Later `bf-*` components inherit this reading:
a `--_bf-<component>-size` hook is a block-size unless its own spec says
otherwise.**

**D14.3 — size is a CSS variable, not a prop.** The spec's prop contract is
`variant` alone, so `bfLogo` ships exactly one prop. Consumers set
`--_bf-logo-size` through `style` (or a parent rule) and it reaches the root
`<svg>` via `$attrs` fallthrough — which is also how the probe renders three
sizes. Consequence for the epic: a component gets the BRIEF §5.4 `cssVars`
computed only when a **prop** maps to a custom property; a consumer-set hook
with no backing prop does not need one, and an empty `cssVars` is noise.

**D14.4 — accessible name is `aria-labelledby`, not a bare `<title>`.** The spec
asks for `role="img"` + `<title>`. Shipped as `role="img"` **plus**
`:aria-labelledby="titleId"` pointing at `<title :id="titleId">`, because
`role="img"` with an unreferenced child `<title>` is announced inconsistently
across AT while an explicit label reference is not. `useId()` supplies the id so
the prerendered and hydrated markup agree; `focusable="false"` keeps the mark
out of the tab order in legacy engines. The copy — `Bertelsmann Foundation North
America` — is not invented: both legacy call sites
(`legacy/organisms/Header.vue:4`, `legacy/organisms/MainNav.vue:4`) render a
bare `<svg>` with **no accessible name at all** (an a11y defect this issue
fixes), and the string already exists verbatim at `wfFooter.vue:10` and
`wfContactSection.vue:15`.

**D14.5 — element count: 16, not 13.** The spec says "13 `<path>`/`<polygon>`/
`<rect>` elements". 13 is the `<path>` count; the artwork is **13 `<path>` +
2 `<polygon>` + 1 `<rect>` = 16** drawables (15 of which carry a `d`/`points`
string — `<rect>` carries neither). Recorded so a later reader does not
"fix" the count. The `d`/`points` strings are byte-identical to
`legacy/atoms/Logo.vue`, in document order; only the inert attributes were
dropped (`class="st0"`, `version`, `xmlns:xlink`, `x`/`y`, `xml:space`,
`style="enable-background:…"`).

**D14.6 — acceptance substitutes for vitest (residual #86).** The harness on
`dev` is broken and pre-existing, so per the gh#20/gh#21/gh#22 precedent this
issue's acceptance is:

- `npx tsx bfna-website-nuxt/scripts/verify-bf-logo.ts` — 39 checks, exit 0.
  It runs the spec's own literal `grep` expressions, and adds the assertions
  that actually carry weight: every `d`/`points` value compared **byte-for-byte
  against the legacy file**; `LogoWhite.vue` proven to differ from `Logo.vue`
  by nothing but the `bfna-logo--white` class (so one component with a `variant`
  prop is a faithful merge); zero colour literals in component *and* probe under
  a wider net than the spec's (`#hex`, `hsl/rgb/oklch/lab/lch/color-mix(`, and
  any `fill=` that is not `currentColor`/`none`); the legacy files proven
  untouched against the merge-base (deleting them is issue 58); and, when
  `.output/` exists, the six prerendered marks with their `aria-labelledby` →
  `<title>` wiring and `--_bf-logo-size` values. Source-level checks run on a
  comment-stripped copy, so the doc comments may quote the `#222` they replaced.
- Probe page `/bf-probe/14-bf-logo` — committed and kept. Six live marks
  (2 variants × 3 sizes) plus 17 runtime DOM assertions behind
  `data-testid="probe-14-verdict"`, including the two colourways resolving to
  the *computed* values of `--color-text` / `--color-white`.

**D14.7 — `variant="white"` is legible only on a dark ground.** The lower band
of the mark is an inverted shape: one path fills the `0,122.5 → 695.1×144.1`
rectangle with the letterforms knocked out. `variant="white"` therefore paints
a white slab with transparent counters — correct on a dark ground, invisible on
a light one. This is exactly how `LogoWhite.vue` behaved, so it is inherited,
not introduced; the probe renders that variant on a dark panel for this reason,
and the constraint is documented on `LogoVariant` in `bf-contracts.ts`.

**D14.8 — gates.** Typecheck **178 → 178** `error TS` (baseline held), with
**0** in `src/components/bf|types|composables/bf|content.config`.
`npx nuxt generate` exit 0, 753 routes. Wireframe-source diff against the
pre-epic base `f757a64` — empty, over the full DoD-4 path list.

**D14.9 — code-review round (3 reviewers, report-only) and what it changed.**
Applied in `fix(review)`:

- **The probe now exercises the CSS default.** All six marks previously passed
  an explicit `--_bf-logo-size`, so the component's own `1.25rem` default was
  only ever "proved" by a regex finding the string in the source. The `s` mark
  in each row now passes **no** override, and both the probe (computed value)
  and the script (absent from the prerendered `style`) assert it.
- **The prerendered probe no longer claims FAIL.** The verdict was two-state
  and `checks` is empty until `onMounted`, so `nuxt generate` baked
  `data-state="fail"` / `FAIL — 0/0` into the static HTML of a healthy
  component. It now renders a third state, `pending`. The other five probes
  still have the two-state version — filed as #100.
- **The probe pins its ground.** `layout: false` paints no background, so
  under a dark host colour scheme the near-black `variant="default"` marks
  rendered invisible — the one thing the page exists to show. Pinned to
  `--color-white` / `--color-text` exactly as probe 03 does.
- **The script's exit contract is stricter.** A skipped check now exits `1` as
  INCOMPLETE. Section 7 (the only part that reads real built output) used to
  `skip` silently when `.output/` was absent, and section 6 (legacy files
  untouched) `skip`s in a shallow clone with no `dev` ref — so on a fresh
  checkout the script printed `PASS (7 skipped)` having verified almost
  nothing. A verification that quietly downgrades itself is how a broken
  component ships green.
- **Wider colour net.** `colourLiterals()` now also catches bare CSS named
  colours used as declaration values (`: white`, `: transparent`, …), not just
  hex and colour functions.
- **No colour literal in the doc comments either.** The comments quoted the
  legacy `fill` values they replaced, which made the spec's *verbatim*
  acceptance `grep` return 1 while the script (which strips comments) returned
  0. The comments now describe the values instead of quoting them, so the
  spec's command passes as written.
- **Decorative use documented.** Fallthrough `$attrs` override the same-named
  local attribute, so `<bfLogo aria-hidden="true" />` suppresses the
  accessible name where the mark sits inside a link that already carries the
  text (`bfNav`, issue 35). Noted in the template.

Handed off, not applied — three residuals, each out of scope for a
single-component issue:

- **#98 (P1)** — `postcss-preset-env` at `stage: 1` runs its cascade-layers
  polyfill over every Vite-compiled stylesheet and **strips `@layer` from the
  shipped CSS**. `@layer components` is in this component's source but not in
  its build output; the script now prints that as an `info` line every run.
  Benign today (unlayered CSS just wins) but backwards, and every later
  `bf-*` component inherits it. Fix is one flag in `nuxt.config.ts`, repo-wide.
- **#99 (P1, human decision)** — `--color-white` is a **primitive**, and BRIEF
  §5 rule 2 says never use one directly; but the token layer has no semantic
  white, and adding one would be a new `--color-*` token, which the same rule
  forbids. The issue-14 spec names `--color-white` explicitly, so this issue
  followed it. Needs a ruling before the first inverted template (issue 47).
- **#100 (P2)** — probe-page runtime assertions are read by nothing
  automated. gh#23's 18/18 came from driving the page headlessly by hand; a
  `scripts/verify-bf-probes.ts` would make that reproducible for all probes.

**D14.10 — browser verification.** `.output/public` served statically and
`/bf-probe/14-bf-logo` driven headlessly: **18/18 runtime assertions pass**, no
console errors, both colourways legible (default on the white ground, white on
the dark panel), all three sizes correct, and the layout holds at 375 px with
no horizontal overflow.
