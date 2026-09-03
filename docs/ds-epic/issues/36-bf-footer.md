# 36 — `bfFooter` — site footer

One-line objective: evolve `wfFooter.vue` into `bfFooter`, fixing the same
D8 props-not-composable violation as `bfNav`, and switching the 4-column
layout to the data-driven grid contract from issue 04.

## Context

Depends on 35 (`bfNav`, reuses the internal `MenuLink` child), 04
(`.grid[data-min-width]` responsive contract — hard dependency, this is the
component the BRIEF explicitly names as the bf-* successor to one of the 7
hand-pinned `grid-template-columns` sites, D9). Builds from
`src/components/wireframe/wfFooter.vue` (as-built A/E: calls
`useWfContent().menus()` directly — same anti-pattern as `wfNav`, "must be
corrected in bf-*"). Consumed by 46 (layout shell). Provenance: BF-164; D8.

## Scope

- File: `src/components/bf/Footer.vue` → `<bfFooter>`.
- Props:
  ```ts
  interface Props {
    menus: Menu[]   // from src/types/bf-contracts.ts (issue 02) — same D8 fix as bfNav
  }
  ```
  Zero data access — no `useWfContent`, no composable, no `queryCollection`.
- Renders (same structure as `wfFooter.vue`): brand block (`BFNA` +
  "Bertelsmann Foundation North America") + search link, four menu columns
  from `menus.map(...)` reusing `bfNav`'s internal `MenuLink` child
  component (import it directly from `src/components/bf/nav/MenuLink.vue`
  — sibling reuse, not duplication), a social-links strip, a legal row
  (copyright year computed at render time, privacy link, "Site by ccm.design"
  credit — port the six social entries and their URLs verbatim from the wf
  source, including the placeholder Bluesky URL comment).
- The four-column menu grid: `<ul class="grid" data-min-width="..." data-
  gap="l">` — **no** `style="grid-template-columns: repeat(4, 1fr)"`
  anywhere in this file. Choose a `data-min-width` value that reflows to
  fewer columns before 4 columns get cramped (document the chosen value and
  why in Decisions — issue 04's probe established the reflow breakpoints at
  1200/800/400px, use those as a reference).

## Out of scope

- The search form (search lives in `bfNav`, not the footer — the footer's
  "Search" is a plain link, matching the wf source).
- A subscribe band (killed by D2 — do not resurrect it here).
- The layout wiring (issue 46 sources `menus` and passes it down).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-footer-bg`, `--_bf-footer-border`. No new colour, no
  inline column style, no hand-pinned grid-template-columns anywhere in
  this file (grep-checked below).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Footer.vue
grep -Lq "useWfContent\|queryCollection" src/components/bf/Footer.vue
grep -Lq "grid-template-columns" src/components/bf/Footer.vue
grep -q "data-min-width" src/components/bf/Footer.vue
```
Probe page `src/pages/bf-probe/36-bf-footer.vue` renders `<bfFooter :menus=
"fixtureMenus" />` from a fixture array and reflows to fewer columns at
narrow widths (verified via the resize-window / viewport check the issue-04
probe already established):
```bash
grep -q "bf-footer" .output/public/bf-probe/36-bf-footer/index.html
```
Fails today (no `bf/Footer.vue`), passes once done.

## Decisions

**D-36.1 — `data-min-width="s"` (a 200px track floor).** `.grid` is `auto-fill`
over `minmax(min(floor, 100%), 1fr)`, so the track count is
`floor((W + gap) / (track + gap))`. The menu row sits inside `.center`
(content-box, `max-inline-size: 1100px`) and carries `data-gap="l"`, where
`--space-l` is `clamp(1.75rem, 1.4914rem + 1.2931vw, 2.5rem)`. Against the
1200 / 800 / 400px reflow points issue 04's probe established:

| viewport | container | gap `l` | `s` (200px) | `m` (240px) | `l` (300px) |
|---|---|---|---|---|---|
| 1200px | 1100 | 39.4 | **4** | 4 | 3 ✗ |
| 800px  | ~766 | 34.2 | **3** | 2 | 2 |
| 400px  | ~371 | 29.0 | **1** | 1 | 1 |

`l` fails this spec outright — three columns at the wide end, where four are
required. Between the two values that pass, `s` is chosen because its middle
step is 3 rather than 2: a four-column menu row keeps more of itself through the
tablet band, and the cells hold short menu labels with no use for a 240px floor.
Measured, not asserted from the table: the probe reads the live
`grid-template-columns` track count in a real 1200px box and a real 400px box and
cross-checks each against the arithmetic `auto-fill` performs on the *measured*
container width, floor and gap (±1px), because the harness runs at one fixed
1280px viewport.

**D-36.2 — `MenuLink` is imported by explicit relative path, not by auto-import
name.** `./nav/MenuLink.vue`, exactly as `bfNav`'s `Nav.vue` and
`nav/Dropdown.vue` import it and exactly as that component's own docblock
anticipates for this issue. `nuxt.config.ts` registers `components/bf` with
`pathPrefix: false` and `prefix: 'bf'`, which would flatten the child to a
top-level-looking `<bfMenuLink>`; the relative import keeps the dependency
visible in the file and independent of how the `components` array is configured.
The probe asserts the reuse structurally — every rendered footer item carries the
child's own `.bf-nav__item` class, so a future inlined copy fails the row.

`.bf-footer` also declares `--_bf-nav-link-color` for the child to inherit.
`MenuLink` styles itself `color: var(--_bf-nav-link-color, var(--color-text))`
with that fallback precisely so it stays legible mounted outside a nav; setting
the hook here means a consumer restyling the footer's links restyles the reused
child with them, instead of the child quietly keeping the nav's colour.

**D-36.3 — line-height item spacing is a `@layer components` rule, not the
wireframe's unlayered one.** The frozen skin zeroes the footer's `li` margins
with a rule deliberately placed *outside* every cascade layer, and its own
comment says why: when it was written, `base/typography.css` closed its
`@layer defaults` block thirty lines early, leaking `li { margin-bottom: 0.5em }`
into unlayered author CSS, which outranks every layer. gh#116 moved that closing
brace. The declaration is now inside `defaults`, so the ordinary
`.bf-footer__items > li { margin-block: 0 }` in `@layer components` outranks it,
and copying the wireframe's workaround would reintroduce the defect it worked
around. The probe measures the resulting margins (`0/0`) and separately asserts
the rule that produces them is inside `@layer components`, so neither half can
regress silently.

**D-36.4 — vitest substitution (residual #86).** The vitest harness on `dev` is
broken and pre-existing, so this issue's acceptance is
`src/pages/bf-probe/36-bf-footer.vue` under
`npx tsx scripts/check-probes.ts --only 36` (35 rows) plus the full suite
(28 probes, 1287 rows) — both exit 0. The spec's `npm run typecheck` line is
likewise substituted by the epic's no-new-errors gate: 178 `error TS` before and
after, 0 of them in `src/components/bf`, `src/types`, `src/composables/bf` or
`content.config`.

**D-36.5 — the two forbidden identifiers are absent from the source entirely,
comments included.** The spec's acceptance is a literal `grep -L` over
`src/components/bf/Footer.vue`, so a docblock quoting the anti-pattern it
refuses would fail a perfectly correct file. Same call `bfNav` (gh#44) and
`bfLogo` (gh#23) recorded. The same applies to the string
`grid-template-columns`: the script block describes what it replaces as
"`repeat(4, 1fr)` in an inline `style`".

**D-36.6 — `/wireframes/search` → `/search`.** The footer's Search stays a plain
link, as the frozen source has it (the search *form* lives in `bfNav`), retargeted
to the real route per BRIEF §7 — the same retarget `bfNav` made. No subscribe
band (D2); the frozen source's own header comment already says the subscribe band
was never the footer's.

