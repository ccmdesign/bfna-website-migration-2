# Plan — gh#11 / DS-epic issue 02: `components/bf/` + auto-import prefix + contracts file

- **Issue:** [#11](https://github.com/ccmdesign/bfna-website-migration-2/issues/11)
- **Spec (authoritative):** [`docs/ds-epic/issues/02-bf-scaffold.md`](../ds-epic/issues/02-bf-scaffold.md)
- **Brief:** [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md)
- **Branch:** `feature/gh11-components-bf-auto-import` off `dev`
- **Phase:** 1 — Composition · **Type:** composition · **Blocked-by:** #10 (merged)

## Why a hand-authored plan

The spec for this issue is already fully prescriptive: it names the exact files,
the exact `components:` array entry, and the verbatim contents of
`bf-contracts.ts`. There is no design decision left to make, so this plan
records the mechanics, the ordering, and the verification rather than
re-deriving an approach.

## Approach

Pure scaffolding. Three additive changes plus a temporary probe that is proven
and then removed inside this same PR.

1. **Auto-import root.** Append one entry to the existing `components:` array in
   `bfna-website-nuxt/src/nuxt.config.ts` (currently ends at the
   `components/wireframe` entry), mirroring the shape used for `ds/`:

   ```ts
   {
     path: resolve(currentDir, 'components/bf'),
     pathPrefix: false,
     prefix: 'bf'
   }
   ```

   It is a sibling array entry, **not** folded into `dsComponentDirs`.
   `pathPrefix: false` + `prefix: 'bf'` means `components/bf/Card.vue`
   resolves as `<bfCard>` and nested dirs do not leak into the name.

2. **`src/components/bf/`.** New directory. Because git cannot track an empty
   directory and the probe is deleted before merge (spec acceptance:
   `test ! -f src/components/bf/Probe.vue`), the directory is held open with a
   `.gitkeep`. Without it, `components/bf` would not exist in a fresh clone and
   Nuxt would warn on a missing component dir. See Decisions.

3. **`src/types/bf-contracts.ts`.** New file, exporting exactly the interfaces
   the spec lists — `CardBaseProps`, `Crumb`, `Cta`, `Filter`, `MenuItem`,
   `Menu`, `SearchResultRow`. Types only, no runtime code, no imports. Field
   shapes mirror the `wf-*` equivalents (`WfCta`, `WfCrumb`, `WfMenuItem`,
   `WfMenu`) with the `Wf` prefix dropped. This is the single home for shared
   bf types (BRIEF §5 rule 11); issue 09 later adds the zod-inferred entity
   types alongside them.

4. **Probe, then removal.** Ship `src/components/bf/Probe.vue` (a one-line
   `<span data-bf-probe>`) plus a throwaway probe page that renders `<bf-probe/>`
   with no explicit import, run `npx nuxt generate`, and confirm the marker
   appears in the prerendered HTML. That proves the prefix resolves. Then delete
   both and re-run `generate` so the merged tree satisfies the acceptance check.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/nuxt.config.ts` | +1 array entry in `components:` |
| `bfna-website-nuxt/src/components/bf/.gitkeep` | new (empty) |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | new |
| `bfna-website-nuxt/src/components/bf/Probe.vue` | new → **deleted before merge** |
| `bfna-website-nuxt/src/pages/bf-probe/02-bf-scaffold.vue` | new → **deleted before merge** |
| `docs/plans/gh11-plan.md`, `docs/ds-epic/issues/02-bf-scaffold.md` | this plan + Decisions append |

Nothing else. Explicitly untouched: the `ds/`, `content/`, `docs/`,
`templates/`, `legacy/`, `wireframe/` entries in `components:`, and every file
under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`,
`composables/useWfContent.ts`, `public/css/wireframe.css`,
`assets/wireframe-data/`.

## Test strategy

Run from `bfna-website-nuxt/`.

- **Typecheck gate — no NEW errors.** `dev` carries a legacy backlog, so a green
  run is impossible (orchestrator decision after #10, residual #71). Baseline
  recorded before any edit: **178** `error TS` lines. After: count must be
  ≤ 178, **and** zero of them may match
  `src/(components/bf|types|composables/bf)|content\.config`.
- **Build.** `npx nuxt generate` exits 0. Never `npm run generate` — that runs
  `contentImporter.js`, which needs Directus secrets absent from the checkout.
- **Auto-import proof (transient).** With the probe page present, grep the
  prerendered output for `data-bf-probe`. Must match. Then delete the probe and
  confirm `generate` is still clean.
- **Spec acceptance.** `grep -n "prefix: 'bf'" src/nuxt.config.ts` → 1 match;
  `test ! -f src/components/bf/Probe.vue`; `test -f src/types/bf-contracts.ts`.
- **Wireframe byte-identity (cumulative, epic DoD-4).**
  `git diff --stat f757a649361993275a43282456f4746d247be37b HEAD -- <wf paths>`
  must print nothing.
- **No new colour (DoD-6).** Trivially satisfied — this issue ships no CSS.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Prefix collides with an existing component name | Low | `bf` is unused today; `grep -rn "prefix: 'bf'"` currently returns nothing |
| Empty `components/bf/` after probe deletion breaks the Nuxt dir scan or is lost in a fresh clone | Medium | `.gitkeep` keeps the directory in the tree |
| `bf-contracts.ts` is unreferenced and gets flagged as dead code | Low | Intended — issues 03+ consume it; it is the epic's declared single home for shared types |
| Typecheck baseline drifts between runs | Low | Baseline captured on this exact worktree before any edit; both numbers journalled |
| A probe file survives into the merge | Medium | Explicit `test ! -f` acceptance run as the last gate before the PR merges |

## Out of scope

Any real `bf-*` component (issues 14+); any change to existing auto-import
entries; any data/collection work (issues 06–13); anything under
`pages/wireframes/` or `components/wireframe/`.
