# Plan — gh#12 / issue 03 `data-gap` honoured on every primitive

Spec (authoritative): [`docs/ds-epic/issues/03-composition-gap-api.md`](../ds-epic/issues/03-composition-gap-api.md)
Issue: ccmdesign/bfna-website-migration-2#12 · Epic: BF-217 · Base: `dev` · Branch: `feature/gh12-data-gap-honoured-on`

## Approach

Purely additive CSS in `@layer composition`. Today `.stack`, `.cluster` and
`.switcher` only define `[data-space="…"]` selectors, while `.grid` only defines
`[data-gap="…"]`. Every `wf-*` call site writes `data-gap`, so ~50 of them are
silent no-ops. Fix = give each of the four primitives **both** attribute
spellings, driving the same private variable with the same 9-step Utopia scale.

No component code, no wireframe file, no new token, no new colour.

### Alias precedence (decision)

`data-gap` is the canonical name; `data-space` is the alias. Both selector
blocks have identical specificity (0,2,0), so source order decides when an
element carries both. To make precedence uniform across all four primitives,
the `data-gap` block is declared **last** everywhere:

- `stack.css` / `cluster.css` / `switcher.css` — append the `[data-gap]` block
  after the existing `[data-space]` block.
- `grid.css` — insert the mirror `[data-space]` block **before** the existing
  `[data-gap]` block.

Result: `data-gap` wins on every primitive. No real call site sets both today.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/public/css/composition/stack.css` | + 9 `.stack[data-gap="…"]` rules → `--_stack-space` |
| `bfna-website-nuxt/src/public/css/composition/cluster.css` | + 9 `.cluster[data-gap="…"]` rules → `--_cluster-space` |
| `bfna-website-nuxt/src/public/css/composition/switcher.css` | + 9 `.switcher[data-gap="…"]` rules → `--_switcher-space` |
| `bfna-website-nuxt/src/public/css/composition/grid.css` | + 9 `.grid[data-space="…"]` rules → `--_grid-gap`, placed before the `[data-gap]` block |
| `bfna-website-nuxt/src/pages/bf-probe/03-composition-gap-api.vue` | new dev-only probe page (kept until issue #68) |
| `docs/ds-epic/issues/03-composition-gap-api.md` | append to the `## Decisions` section |

Scale for all four: `3xs 2xs xs s m l xl 2xl 3xl` → `var(--space-3xs)` …
`var(--space-3xl)` (already defined in `tokens/primitive-spacing.css`).

## Probe page

`/bf-probe/03-composition-gap-api` — `definePageMeta({ layout: false })` plus a
`useHead` link to `/css/styles.css` (the composition sheet ships from
`src/public/css`, exactly as `layouts/wireframe.vue` loads it). Renders each of
`.stack`, `.cluster`, `.switcher`, `.grid` three times with `data-gap="xs"`,
`data-gap="l"`, `data-gap="3xl"`, plus one `data-space="l"` alias row per
primitive. Boxes are outlined with `currentColor` only — no colour literal, no
new token (ground rule 2).

## Test strategy

1. `npx nuxt typecheck` — **gate is no-new-errors**, baseline on `dev` is 178
   `error TS` lines; after the change the count must be ≤ 178 and zero of them
   may match `src/(components/bf|types|composables/bf)|content\.config`.
2. `npx nuxt generate` exits 0 (never `npm run generate` — Directus secrets).
3. Spec greps: `data-gap=` present in stack/cluster/switcher css, `data-space=`
   present in grid.css.
4. Cumulative DoD-4 check against the pre-epic SHA `f757a64` over
   `pages/wireframes`, `components/wireframe`, `layouts/wireframe.vue`,
   `public/css/wireframe.css` → must print nothing.
5. Browser: serve `.output/public`, open the probe headlessly, read
   `getComputedStyle` `row-gap`/`column-gap` (cluster, switcher, grid) and the
   `margin-block-start` of `.stack > * + *`, and assert three strictly
   increasing distinct px values per primitive, plus alias equality.

## Risks

- **Rendered `/wireframes/*` output shifts.** Expected and explicitly permitted
  by DoD-4 ("rendered output MAY change as a side-effect"). ~50 previously
  inert `data-gap` writes start applying. Source files stay byte-identical.
- **`.switcher` `data-space` sits between `data-threshold` and `data-limit`
  blocks.** Append the `data-gap` block at the end of the file's `@layer` so it
  stays last-declared; do not reorder existing rules.
- **Out of scope, do not touch:** `.box`, `.frame`, `.cover`, `.reel`,
  `.imposter`, `.container`, `data-min-width` (issue 04), `data-measure`
  (issue 05), and any `wf-*` file.
