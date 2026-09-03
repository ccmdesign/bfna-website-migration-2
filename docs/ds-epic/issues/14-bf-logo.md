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
