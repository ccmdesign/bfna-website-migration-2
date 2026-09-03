# Plan — gh#21 / issue 12: `useBfProjects`, `useBfPrograms`

Spec: [`docs/ds-epic/issues/12-composables-projects-programs.md`](../ds-epic/issues/12-composables-projects-programs.md)
Pattern to match: `bfna-website-nuxt/src/composables/data/useBfInsights.ts` (gh#20, merged).

## Approach

Two thin `queryCollection` wrappers in the shape issue 11 established: one
`useAsyncData` call, unwrap to plain arrays, expose members whose names and
signatures match `useWfContent` exactly so a page port is a one-line swap.

No synthesis. Every curation flag the members read — `grid_eligible`,
`grid_order`, `featured`, `nav`, `external_only`, `pending`, `parent_project`,
and `Program.tagline` — is a stored field the normaliser (issue 07 / gh#16)
already materialised. The composables filter and sort; they never recompute.

### `useBfProjects.ts`

| Member | Derivation (all over stored fields) |
|---|---|
| `projects()` | `all.filter(p => !p.parent_project)` |
| `projectsByProgram(program)` | top-level, `p.program === program` |
| `gridProjectsByProgram(program)` | top-level + `program` + `grid_eligible`, stable sort by `grid_order` |
| `productsByProgram(program)` | top-level + `program` + `external_only` |
| `allProducts()` | top-level + `external_only` |
| `projectsPendingRetag()` | top-level, `program` starts `'RE-TAG'`, not `archived` |
| `projectBySlug(slug)` | `all.find()` — children included |
| `projectChildren(slug)` | `parent_project === slug`, `heading` desc |
| `navProjects()` | `nav === true`, ordered by `NAV_SLUGS` |
| `featuredProjects()` | `featured === true`, ordered by `FEATURED_SLUGS` |

### `useBfPrograms.ts`

`programs()` (all 3, collection order) and `programBySlug(slug)`.

## The one judgement call: curation *order*

Issue 07's Decisions say verbatim: *"Curation order is not stored.
`FEATURED_SLUGS`/`NAV_SLUGS` order the homepage and nav lists today; issue 09's
schema declares only `featured`/`nav` booleans, so the ordering constants belong
to the composables in issue 12."*

So the two slug arrays are re-declared here as **ordering keys only** — the flag
still *selects* the set, the array only *sorts* it. That keeps "flags are read,
never recomputed" true while honouring the handover issue 07 wrote down.

`GRID_ORDER` is **not** re-declared: it is stored as `grid_order`.

## Known divergence to document (not to fix here)

`gridProjectsByProgram('Transatlantic Relations & Global Challenges')` — that
program has no declared `GRID_ORDER`, so all six of its grid-eligible projects
carry `grid_order === Number.MAX_SAFE_INTEGER` and the stable sort falls back to
collection order (file-stem/alphabetical) where `useWfContent` falls back to
wireframe-snapshot order. Same class of divergence gh#20's probe already
recorded for `publish_date` ties. Fixing it means storing an ordinal, which is
normaliser scope (issues 07/08), explicitly out of scope here. Recorded in the
spec's Decisions and handed off as a residual.

## Files

- `bfna-website-nuxt/src/composables/data/useBfProjects.ts` (new)
- `bfna-website-nuxt/src/composables/data/useBfPrograms.ts` (new)
- `bfna-website-nuxt/src/pages/bf-probe/12-composables-projects-programs.vue` (new, kept)
- `docs/ds-epic/issues/12-composables-projects-programs.md` (Decisions appended)

Nothing else. No component, page or wireframe file is touched.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe page, rendered by `npx nuxt generate` against the real
content database — the substitution gh#20 already made.

The probe is a **parity test**: every expected value is computed offline from
`src/assets/wireframe-data/projects.json` through `useWfContent`'s own
predicates and hard-coded, so a passing row means agreement with the wireframe,
not with the implementation. It asserts the full slug sequence of
`gridProjectsByProgram` for all three programs, the `heading`-desc order of
`projectChildren`, and the counts/order of every other member.

Gates: typecheck ≤ 178 baseline with 0 in scoped paths; `npx nuxt generate`
exits 0; both wireframe byte-identity diffs print nothing.

## Risks

1. **Curated-order handover** — mitigated above; the constants sort, never select.
2. **TR&GC fallback order** — documented + residual, above.
3. **`layout: false` on the probe** — copy gh#20's `useHead` (lang, noindex,
   stylesheet) so a11y/nav rules still hold.
4. **Plain values vs refs** — `useAsyncData` has resolved by return, so members
   are plain, keeping the page-side swap a one-liner (gh#20 precedent).
