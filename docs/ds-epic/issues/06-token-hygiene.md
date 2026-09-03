# 06 — token-hygiene

Clean the token layer's known dead code and duplication, and record (not
build) the icon-utility decision — no new colour anywhere.

## Context

Depends on 01. Blocks 14–19 (every atom issue depends on 06 so it builds on
a clean token layer). Builds from
`bfna-website-nuxt/src/public/css-legacy/global.css` (dead `--colors-*`
block) and `bfna-website-nuxt/src/public/css/tokens/semantic-colors.css`
(duplicate `--color-neutral`, `error→fail` ordering) plus
`bfna-website-nuxt/src/public/css/utils/{typography-utils.css,utils.css}`
(the two conflicting `.icon` rules). Provenance: BF-183, BF-165; digest §B
"Token debt found" + "resolve the two conflicting `.icon` utilities".

**Verified today**:
- `src/public/css-legacy/global.css:26-33` — `--colors-default: $black;
  --colors-white: #FFFFFF; --colors-orange: $orange; --colors-teal: $teal;
  --colors-yellow: $yellow; --colors-red: $red; --colors-alt: --colors-teal;
  --colors-black: --colors-default;` — unresolved SCSS variables shipping as
  literal CSS (`$black` etc. are not valid CSS values), used at 5 more sites
  in the same file (lines 1535, 1637, 1714, 1736, 2278, all
  `var(--colors-white)`).
- `src/public/css/tokens/semantic-colors.css:29` and `:39` both declare
  `--color-neutral: var(--color-black);` — exact duplicate inside the same
  `:root` block.
- `src/public/css/tokens/semantic-colors.css:35-36` — `--color-error:
  var(--color-fail); --color-fail: var(--color-red);` declared in that
  order (error references fail before fail is declared) — harmless in CSS
  (custom properties resolve at use-time) but fragile ordering worth fixing.
- `.icon` is defined twice, both in `@layer utils`: `typography-utils.css:5`
  (`font-family: 'Material Icons'`) and `utils.css:4,9,16`
  (`font-family: "Material Symbols Outlined"` + `font-variation-settings`).
  Later-imported file wins on layer-internal source-order ties — a real
  conflict, not just redundancy.

## Scope

- `src/public/css-legacy/global.css` — delete lines 26–33 (the whole
  `--colors-*` block) and repoint the 5 `var(--colors-white)` usages
  (1535, 1637, 1714, 1736, 2278) to the existing semantic token
  `var(--color-white)` (already defined in `src/public/css/tokens/
  primitive-colors.css:29`) — same colour value, no new literal.
- `src/public/css/tokens/semantic-colors.css` — delete the duplicate
  `--color-neutral: var(--color-black);` at line 39 (keep line 29's), and
  reorder lines 35–36 so `--color-fail: var(--color-red);` is declared
  before `--color-error: var(--color-fail);` consumes it.
- Icon utility: keep `utils.css`'s Material Symbols Outlined
  implementation (it already loads its stylesheet via
  `src/nuxt.config.ts` `app.head.link` — `fonts.googleapis.com/css2?family=
  Material+Symbols+Outlined`, confirming it's the live choice), delete the
  competing `.icon, .material-icons { font-family: 'Material Icons', … }`
  block in `typography-utils.css:4-20` (the whole rule, since
  `.material-icons` has no other definition to preserve). Record the
  decision — Material Symbols Outlined wins, Material Icons removed — in
  this issue's Decisions section.
- Run `npm run validate:tokens:fix` if it reports auto-fixable issues from
  the above; otherwise `npm run validate:tokens` must simply pass clean.

## Out of scope

- Any new colour, new token, or palette change — this is deletion +
  de-duplication only, per BRIEF §5 rule 2.
- Building an icon component (BF-165 is a decision to record, not a build
  task — no icon component ships in this issue or anywhere in phase 3).
- Tint/shade vs numeric primitive naming (BF-183's other half, per v2 §5
  "unresolved — out of this audit's scope").
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

Tokens touched: `--color-white` (repoint target, already exists, no new
value), `--color-neutral`, `--color-error`/`--color-fail` (dedup/reorder
only, values unchanged). hsl format throughout — no oklch. `@layer` order
untouched (`reset, defaults, tokens, themes, components, utils, overrides`).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
npm run validate:tokens
grep -c -- '--colors-' src/public/css-legacy/global.css   # today: 11, must be 0
grep -c -- '--color-neutral' src/public/css/tokens/semantic-colors.css  # today: 2, must be 1
grep -c "Material Icons" src/public/css/utils/typography-utils.css      # today: 1, must be 0
```
Plus: both light and dark modes render unchanged on `/wireframes/index` and
`/docs` (manual visual check, per the issues.md `verify` column).

## Decisions

_Runner appends here._ (Author's note for the runner: record the Material
Symbols Outlined vs Material Icons decision — see Scope above — here when
this issue executes.)
