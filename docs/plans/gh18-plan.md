# gh#18 — 09: six `bf*` collections + zod schemas

Plan for GitHub issue #18. Spec: `docs/ds-epic/issues/09-data-collections.md`.

## Approach

The schemas are the entity contracts for thirteen downstream consumers, so they are
derived from **what the normaliser actually emits** (issues #16/#17), not from the
spec's draft field list. Ground truth used:

1. The emitted TypeScript interfaces in
   `bfna-website-nuxt/scripts/normalise-wireframe-data.ts` (`InsightDoc`,
   `ProjectDoc`, `ProgramDoc`, `PersonDoc`, `PageDoc`, `AnnouncementDoc`,
   `ProjectPodcast`, `RawPageLegacy`) — the authoritative emitted shape.
2. A key/type sweep over all 433 files in `bfna-website-nuxt/content/bf/**`,
   confirming the interfaces (union of observed types per key, missing-key counts).
3. The Decisions sections of `docs/ds-epic/issues/07-*.md` and `08-*.md`, which
   already record the two spec corrections #18 must apply (`bfPages.legacy` is an
   **object**, `bfAnnouncements.workstream` is a **number**) and the 371-not-354
   insight count.

## Files

- `bfna-website-nuxt/content.config.ts` — add six exported zod schema consts
  (`bfInsightSchema`, `bfProjectSchema`, `bfProgramSchema`, `bfPersonSchema`,
  `bfPageSchema`, `bfAnnouncementSchema`, plus the shared `bfPageLegacySchema`)
  above `defineContentConfig`, and six `type: 'data'` collections appended to the
  existing `collections: {}` object. The 14 existing collections are not touched,
  renamed or re-ordered.
- `bfna-website-nuxt/src/types/bf-contracts.ts` — re-export the six inferred entity
  types (`Insight`, `Project`, `Program`, `Person`, `Page`, `Announcement`) via a
  **type-only** import of the schema consts, so components have exactly one import
  site and the module ships no new runtime code.
- `bfna-website-nuxt/src/pages/bf-probe/09-data-collections.vue` — kept probe page
  asserting the real counts against the built content database.

## Type-export design

`content.config.ts` holds the schemas (the spec's shape: `schema: z.object({…})`
next to the collection registration); `bf-contracts.ts` re-exports
`z.infer<typeof …>`. The import is `import type … from '../../content.config'`,
which was measured to add **zero** typecheck errors (178 → 178 with a scratch probe
file), and being type-only it pulls no `@nuxt/content` runtime into the client
bundle. This keeps BRIEF §5 rule 11 intact: every shared type still resolves from
`~/types/bf-contracts`.

## Test strategy

- Typecheck gate: baseline is **178** `error TS` lines on `dev`. After: count must
  be ≤ 178 and 0 errors matching `src/(components/bf|types|composables/bf)|content\.config`.
- `npx nuxt generate` exits 0 (never `npm run generate` — that runs the Directus importer).
- Probe page asserts, against the generated content DB: 371 `bfInsights`
  (354 neither-flag, 8 `featured`, 9 `retired_news`), 38 `bfProjects`,
  3 `bfPrograms`, 13 `bfPeople` (4 `board`), 7 `bfPages`, 1 `bfAnnouncements`,
  plus that `bfPages.legacy` round-trips as an object and
  `bfAnnouncements.workstream` as a number.
- Wireframe byte-identity diffs (vs `dev` and vs pre-epic base `f757a64`) print nothing.

## Risks

- **`.nullable()` support in `@nuxt/content` 3.16.** The existing 14 collections use
  only `.optional()`. Verified in
  `node_modules/@nuxt/content/dist/runtime/internal/schema.js`: `describeProperty`
  handles `anyOf`/`oneOf`/`type: [T,'null']` and emits `NULL` column constraints, so
  nullable columns are supported. `npx nuxt generate` is the empirical check.
- **Nested objects** (`participation`, `podcast`, `legacy`) and string arrays
  (`authors`, `projects`) are stored as JSON columns; the probe reads one of each
  back to prove the round-trip.
- **`projects.pending` is absent from 36 of 38 documents** — declared `.optional()`,
  not `.nullable()`, matching `ProjectDoc.pending?: string`.
