# Plan — gh#45 / issue 36: `bfFooter`

**Spec:** `docs/ds-epic/issues/36-bf-footer.md` · **Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)
**Base:** `dev` @ 8424e4e · **Branch:** `feature/gh45-bffooter`

## Approach

Evolve the frozen `src/components/wireframe/wfFooter.vue` into
`src/components/bf/Footer.vue` (`<bfFooter>`), fixing the same D8 violation
`bfNav` fixed in #44: the wireframe footer calls the wireframe content
composable inside itself, so it cannot be handed content. `bfFooter` takes
`menus: Menu[]` as its only prop and has **no other source of anything** — no
composable, no collection query, no store. The spec's acceptance is a literal
`grep -L` over the file, so the two forbidden identifiers are not written
anywhere in it, comments included (the `bfNav` / `bfLogo` precedent).

Second fix: the wf source hand-pins `style="grid-template-columns: repeat(4, 1fr)"`
on the menu row — one of the seven sites D9 names. It becomes
`<ul class="grid" data-min-width="s" data-gap="l">`, the issue-04 contract, and
the string `grid-template-columns` appears nowhere in the file.

`MenuLink` is reused from `bfNav` by **explicit relative import**
(`./nav/MenuLink.vue`), exactly as `Nav.vue` and `nav/Dropdown.vue` import it
and exactly as `MenuLink`'s own docblock anticipates ("`bfFooter` (#45) imports
it the same way"). Not by auto-import name (`<bfMenuLink>`), which the
`pathPrefix: false` + `prefix: 'bf'` config would flatten it to.

## `data-min-width` choice — `s` (200px floor)

`.grid` is `auto-fill` with `minmax(min(floor, 100%), 1fr)`, so the track count
is `floor((W + gap) / (track + gap))`. The footer grid sits inside `.center`
(content-box, `max-inline-size: 1100px`), and `data-gap="l"` resolves
`--space-l: clamp(1.75rem, 1.4914rem + 1.2931vw, 2.5rem)`.

| viewport | container W | gap `l` | `s` (200px) | `m` (240px) |
|---|---|---|---|---|
| 1200px | 1100 | 39.4 | **4** | 4 |
| 800px  | ~766 | 34.2 | **3** | 2 |
| 400px  | ~371 | 29.0 | **1** | 1 |

Both hit the required 4-at-1200 / fewer-at-400. `s` is chosen because the
intermediate step is 3 rather than 2 — a four-column menu row degrading
4 → 3 → 1 keeps more of the row intact through the tablet band, and the column
content is short menu labels that do not need a 240px floor. `l` (300px) is
rejected outright: it yields 3 columns at 1200px, which fails the spec.
Recorded in the spec's Decisions.

## Files

| file | action |
|---|---|
| `src/components/bf/Footer.vue` | **new** — the organism |
| `src/pages/bf-probe/36-bf-footer.vue` | **new** — probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/36-bf-footer.md` | append Decisions |
| `docs/plans/gh45-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched (D2 — byte-identity is verified).

## Component shape

```
<footer class="bf-footer">              --_bf-footer-bg, --_bf-footer-border
  .center stack[data-gap=l]
    ├ brand row      cluster            BFNA / Bertelsmann Foundation North America
    │                                   + <NuxtLink to="/search">Search</NuxtLink>
    ├ ul.grid[data-min-width=s][data-gap=l]     ← the four columns
    │   └ li > nav[aria-label="Footer — <label>"]
    │        ├ column heading (a / NuxtLink / <strong>, same precedence as wf)
    │        └ ul.bf-footer__items > li > <MenuLink :item>
    ├ ul.bf-footer__social  cluster[data-gap=s]  aria-label="Social media"
    └ legal row      cluster            © <year> … · Privacy Policy · Site by ccm.design
```

- The six social entries and their URLs are ported **verbatim**, including the
  `#bluesky-profile-url` placeholder and the `NOTE:` comment that explains it.
- The copyright year is `new Date().getFullYear()` computed at render, as in wf.
- `/wireframes/search` is retargeted to `/search` (BRIEF §7), matching `bfNav`.
- No subscribe band (D2). No search form (search lives in `bfNav`).

## Styling

- `@layer components` only. `--_bf-footer-bg` (`--color-surface-page`) and
  `--_bf-footer-border` (`--color-neutral-tint-40`) declared in the `.bf-footer`
  rule, not bound inline (the `bfMedia` lesson, gh#26). No new colour, no
  literal, no inline `style` attribute anywhere in the component.
- **No `:not()` at all** (D-20.5 / gh#29).
- **No `:focus-visible`** — `base/focus.css` (#146) owns it in `@layer defaults`.
- Footer menu items sit at line-height spacing: `.bf-footer__items > li { margin-block: 0 }`
  inside `@layer components`. Since gh#116 moved the closing brace in
  `base/typography.css`, its `li { margin-bottom: 0.5em }` is inside
  `@layer defaults` and `components` outranks it — so the wf skin's *unlayered*
  workaround is not needed and must not be copied.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe page under the CDP harness, per
`docs/decisions/probe-harness.md`. Substitution recorded in Decisions.

`src/pages/bf-probe/36-bf-footer.vue` — `[data-probe-verdict]` root,
`[data-probe-row][data-ok]` rows — renders `<bfFooter :menus="fixtureMenus" />`
from a four-menu fixture written in the page, in three slots:

1. **1200px container** — expect 4 tracks.
2. **400px container** — expect fewer than 4 (1).
3. A `$attrs` / structure slot.

Track counts are read from `getComputedStyle(...).gridTemplateColumns` and
compared against the arithmetic `auto-fill` performs, derived from the measured
container width, resolved floor and resolved gap with ±1px tolerance — the
viewport-agnostic pattern probe 03 established, because the harness runs at one
fixed 1280px viewport.

Rows also assert: every fixture menu and item reaches the DOM (zero data access,
structurally); the six social links with their exact `href`s; the current year in
the legal row; no inline `style` attribute on any element in the component; no
`grid-template-columns` authored; `.bf-footer` rules live in `@layer components`;
the two named hooks resolve; the focus ring is the stack's bare `:focus-visible`;
no subscribe band; no search `<form>`/`<input>`.

## Verification (all must pass before the PR)

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'          # ≤ 178 (baseline)
npx nuxt typecheck 2>&1 | grep -E 'error TS' \
  | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l   # 0
npx nuxt generate                                       # exit 0
npx tsx scripts/check-probes.ts --only 36               # exit 0
npx tsx scripts/check-probes.ts                         # exit 0
grep -L "useWfContent\|queryCollection" src/components/bf/Footer.vue
grep -L "grid-template-columns" src/components/bf/Footer.vue
grep -q "data-min-width" src/components/bf/Footer.vue
grep -q "bf-footer" .output/public/bf-probe/36-bf-footer/index.html
```
Plus the cumulative wireframe byte-identity check from the pre-epic base
`f757a64`, which must print nothing.

## Risks

| risk | mitigation |
|---|---|
| The forbidden identifiers leak into a docblock and fail the `grep -L` | Never written in the file; the `bfNav` precedent is followed and stated. |
| Track-count rows pinned to a viewport the harness does not run at | Real fixed-width containers + arithmetic derived from measured width (probe 03 pattern), never `@media`. |
| `li` spacing regressing to the 0.5em default | Asserted as a probe row (measured `margin-block`), not assumed. |
| `check-probes.ts` misses the new route | `nuxt.config.ts` enumerates `/bf-probe/*` from disk (gh#28) — no edit needed; the full run confirms. |
