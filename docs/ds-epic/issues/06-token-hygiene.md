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

**D-06.1 — the dead block is 13 grep-lines, not 11, and only one of the eight
declarations was ever real.** `grep -c -- '--colors-'` on
`src/public/css-legacy/global.css` returned **13** before this change (8
declarations at lines 26-33 plus 5 usages), not the 11 the Scope section
estimated; the target of 0 is unaffected. Of the eight declarations, six held
unresolved SCSS variables (`$black`, `$orange`, `$teal`, `$yellow`, `$red`)
and two (`--colors-alt`, `--colors-black`) held a bare `--colors-teal` /
`--colors-default` token sequence with no `var()` wrapper — all eight
invalid-at-computed-value-time the moment they reach a colour property. Only
`--colors-white: #FFFFFF` carried a usable value, and it is the only one with
consumers: all five usages are `var(--colors-white)`. The other seven had
**zero** consumers anywhere in the repo, so deleting them cannot regress
anything.

**D-06.2 — the repoint is value-preserving by construction, not by
approximation.** `var(--colors-white)` → `var(--color-white)` resolves inside
`global.css` to *that file's own* `--color-white` at line 259,
`hsla(var(--white-hsl), 1)` where `--white-hsl: 0, 0%, 100%` (line 247) —
i.e. `hsla(0, 0%, 100%, 1)`, exactly `#FFFFFF`. It does **not** resolve to
the design-token `--color-white` in `css/tokens/primitive-colors.css`,
because the two sheets never co-load: `css/styles.css` is pulled only by
`layouts/wireframe.vue:50` and `pages/bf-probe/03-composition-gap-api.vue:36`,
while `global.css` is pulled only by `layouts/legacy-base.vue:133-134`. No
shadowing in either direction, and no new colour literal enters the tree
(DoD-6).

**D-06.3 — Material Symbols Outlined wins; the Material Icons rule is
deleted (BF-165).** `css/styles.css` imports `utils/typography-utils.css`
(line 47) before `utils/utils.css` (line 48), both writing into
`@layer utils`, so source order already broke every tie in `utils.css`'s
favour: `.icon` resolved to `"Material Symbols Outlined"` at `1.8rem`, never
to `'Material Icons'` at `24px`. `src/nuxt.config.ts` `app.head.link` loads
`fonts.googleapis.com/css2?family=Material+Symbols+Outlined` and nothing
else, confirming the live choice. The whole `.icon, .material-icons` rule
(lines 4-20) is removed rather than trimmed, and the file keeps a comment
back-pointing to `utils.css` and to this decision. **This is a
de-duplication only — no icon component is built here or anywhere in phase
3.**

**D-06.4 — dropping `.material-icons` is safe because those call sites never
loaded this rule.** The class has four consumers —
`components/legacy/molecules/PlatformNav.vue:8,13,18,23`,
`components/legacy/templates/PeopleSection.vue:51`,
`components/legacy/organisms/OffCanvas.vue:6` and `pages/index.vue:99` — all
rendered under `layouts/legacy-base.vue`, which loads `global.css` /
`fixes.css` / `v2updates.css` and **not** `css/styles.css`. They get their
font from Google's own hosted Material Icons stylesheet, which
`legacy-base.vue:124` preloads and which ships the canonical
`.material-icons` rule itself. `global.css`'s `.u-material-icons` block
(line 69) is a *different* class and is untouched. Removing the local rule
therefore changes nothing for any of the four.

**D-06.5 — deleting the rest of the block is invisible on the acceptance
surface.** Removing the rule also drops `font-weight`, `font-style`,
`line-height`, `letter-spacing`, `text-transform`, `display: inline-block`,
`white-space`, `overflow-wrap`, `direction`, `font-feature-settings` and
`-webkit-font-smoothing` from `.icon` — a real change in the abstract. But
`grep -rn icon src/components/wireframe src/pages/wireframes
src/layouts/wireframe.vue` returns **nothing**, and the repo's only
`class="icon"` consumer, `components/ds/molecules/ccmBreadcrumb.vue:23`, is
reachable only through `components/docs/demos/ccm-breadcrumb-demo.vue` —
while `layouts/docs-layout.vue` loads no stylesheet at all. The rule is
unreachable from both `/wireframes/index` and `/docs`, which is exactly the
surface the acceptance criterion names, so the expected visual diff in light
and dark is **none**.

**D-06.6 — `bfna-website-nuxt/public/global.css` was edited too.** It is a
byte-identical, git-tracked duplicate of
`src/public/css-legacy/global.css` (both md5 `861a6156…` before, `5e5f9222…`
after) and it is the copy actually served at `/global.css`; `public/css` is
a symlink to `../src/public/css`. The issue's acceptance reads "no
`--colors-*` remains under `public/`", which covers this path, and leaving
it stale would both fail acceptance and desynchronise the pair. The two
files receive the identical edit and are asserted byte-identical afterwards.
Scope beyond the Scope section's literal file list, but required by its own
acceptance clause.

**D-06.7 — no probe page.** This issue ships no component and no new
selector, so it adds no `src/pages/bf-probe/` route. Probe
`03-composition-gap-api.vue` was re-run as a regression check instead.

**D-06.8 — typecheck gate.** Per the orchestrator's standing decision the
gate is *no new errors*, not zero: before **178** `error TS` lines, after
**178**; the scoped count over
`src/(components/bf|types|composables/bf)|content.config` is **0** before and
after. `npx nuxt generate` exits 0 (never `npm run generate` — it runs the
Directus importer). `npm run validate:tokens` reports 0 errors and the one
pre-existing layer-order warning, unchanged.
