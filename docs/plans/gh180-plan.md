# Plan — gh#180: 09c Data — program ordinal (checkpoint-2 parity)

**Issue:** https://github.com/ccmdesign/bfna-website-migration-2/issues/180
**Epic:** https://app.plane.so/ccm-design/browse/BF-217/
**Branch:** `feature/gh180-09c-data-program-ordinal` off `dev`
**Spec:** the issue body (no `docs/ds-epic/issues/` file for this checkpoint-2 follow-up; Decisions are recorded below and in the PR body).

## Problem

The home Programs band renders **Democracy → Future Leadership → Transatlantic
Relations & Global Challenges**; the wireframe renders **Democracy →
Transatlantic Relations & Global Challenges → Future Leadership** (the curated
order of `src/assets/wireframe-data/programs.json`'s `items` array).

`useBfPrograms()` returns `queryCollection('bfPrograms').all()` untouched, and
`@nuxt/content` hands back file-stem (alphabetical) order. The program documents
carry no ordinal, so the snapshot's array order is lost at the moment the
snapshot becomes per-file documents. This is exactly the class of bug gh#89
fixed for project grids with `grid_order`; programs were left behind.

## Approach (D3 — ordering lives in the normaliser)

1. **Normaliser** — `bfna-website-nuxt/scripts/normalise-wireframe-data.ts`:
   `normalisePrograms()` iterates `snap.items.entries()` and emits
   `order: index + 1` on each `ProgramDoc`. 1-based so the stored value reads as
   a human ordinal (democracy 1, transatlantic-relations-global-challenges 2,
   future-leadership 3) rather than an array index. The number is derived, never
   hand-authored, so re-running the normaliser is idempotent by construction.
2. **Schema** — `bfna-website-nuxt/content.config.ts`: `order: z.number()` on
   `bfProgramSchema`, mirroring `grid_order: z.number()` on `bfProjectSchema`.
   `src/types/bf-contracts.ts` needs no edit: `Program` is
   `z.infer<typeof bfProgramSchema>`, so the entity type gains `order: number`
   automatically — the shared-types rule (§5.11) is satisfied without a second
   declaration.
3. **Composable** — `src/composables/data/useBfPrograms.ts`: sort `all` **once**
   at construction (`[...(data.value ?? [])].sort((a, b) => a.order - b.order)`),
   never inside a member. `programs()` keeps returning `[...all]` (gh#91 copy
   safety); `programBySlug` is unaffected.
4. **Regenerate** — `npm run data:normalise`, commit the three
   `content/bf/programs/*.json` files, then re-run and confirm `git status` is
   clean (zero diff on a second run).
5. **Probe 12** (`src/pages/bf-probe/12-composables-projects-programs.vue`) —
   this is the page that already asserts program facts. Add rows that pin the
   **unsorted** slug sequence (the existing `programs() slugs` row sorts
   alphabetically before joining, so it cannot catch an ordering regression) and
   that `order` is 1,2,3 strictly ascending across the returned list.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/scripts/normalise-wireframe-data.ts` | `ProgramDoc.order`; emit `index + 1` |
| `bfna-website-nuxt/content.config.ts` | `order: z.number()` on `bfProgramSchema` |
| `bfna-website-nuxt/src/composables/data/useBfPrograms.ts` | sort `all` by `order` once; docblocks |
| `bfna-website-nuxt/content/bf/programs/*.json` (3) | regenerated, gain `order` |
| `bfna-website-nuxt/src/pages/bf-probe/12-composables-projects-programs.vue` | 2 new assertion rows |

Explicitly **not** touched: `src/pages/index.vue` (the fix must be data-side —
a page-level `.sort()` would re-derive ordering the normaliser owns, against
D3), anything under `src/pages/wireframes/` or `src/components/wireframe/`
(D2), and no CSS at all (no colour risk, DoD-6 trivially satisfied).

## Test strategy

- `npx tsx scripts/check-probes.ts --only 12` → exit 0, and the full
  `npx tsx scripts/check-probes.ts` → exit 0 (probe harness, per #109).
- `npx nuxt generate` → exit 0.
- **End-to-end effect:** extract the `<h3>` sequence from
  `.output/public/index.html` and confirm Democracy → Transatlantic Relations &
  Global Challenges → Future Leadership. This is the check that proves the
  reported symptom is gone, not just that the data changed.
- Typecheck gate: baseline error count recorded before the change; after, count
  ≤ baseline and 0 errors scoped to `src/components/bf|types|composables/bf|content.config`.
- Wireframe byte-identity vs `f757a64` → empty.
- Idempotency: second `npm run data:normalise` produces no diff.

## Risks

- **Schema break at generate time.** Adding a required `order` to
  `bfProgramSchema` fails collection parsing if any `content/bf/programs/*.json`
  is missing the key. Mitigation: regenerate the content before running
  `nuxt generate`; the three documents are the whole collection.
- **A consumer relying on alphabetical order.** Only two consumers exist —
  `pages/index.vue` (`programs()`, the band being fixed) and
  `pages/[program].vue` (`programBySlug`, order-independent). Probe 12's
  existing alphabetical row keeps passing because it sorts before comparing.
- **Snapshot order is the source of truth**, so a future snapshot re-order
  silently re-orders the site. That is the intent (D3) and matches `grid_order`.

## Decisions

- **D-180.1 — 1-based ordinal.** `order` starts at 1, not 0, so the stored value
  is a human-readable rank. `useBfPrograms` only ever compares, so the base is
  free; the readable form wins.
- **D-180.2 — sort in the composable, not the consumer.** D3 puts *derivation*
  in the normaliser; the composable performs the single ascending sort on the
  stored key, exactly as `useBfProjects` does for `grid_order`. No page sorts.
- **D-180.3 — `Program` gains `order` by inference.** No hand-written field in
  `bf-contracts.ts`; the zod schema stays the single declaration.
- **D-180.4 — acceptance is probe 12 + the prerendered `/`, not vitest.** The
  vitest harness on `dev` is broken and pre-existing (residual #86). Substituted
  checks: `scripts/check-probes.ts` (full + `--only 12`) and an assertion on the
  `<h3>` order in `.output/public/index.html`.
