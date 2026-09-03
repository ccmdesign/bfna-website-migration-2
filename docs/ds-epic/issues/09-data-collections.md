# 09 — data-collections

Register the six `bf*` `@nuxt/content` `type: 'data'` collections with full
zod schemas, following the repo's existing 12-collection pattern.

## Context

Depends on 08 (needs `content/bf/**` populated to validate against).
Blocks 10 (types feed format-utils signatures), 11-13 (composables query
these collections). Builds from `bfna-website-nuxt/content.config.ts`
(existing pattern, e.g. the `people` collection at lines 324-341) and the
`content/bf/**` output of issues 07-08. Provenance: ADR-2 (digest §C); 01 §F.

## Scope

- `bfna-website-nuxt/content.config.ts` — add six entries to the existing
  `collections: {}` object (do not touch the 12 existing entries), same
  shape as the current `people` collection:
  ```ts
  bfInsights: defineCollection({
    type: 'data',
    source: { include: 'bf/insights/*.json', cwd: contentDir },
    schema: z.object({ /* full entity schema, see below */ })
  }),
  ```
  repeated for `bfProjects` (`bf/projects/*.json`), `bfPrograms`
  (`bf/programs/*.json`), `bfPeople` (`bf/people/*.json`), `bfPages`
  (`bf/pages/*.json`), `bfAnnouncements` (`bf/announcements/*.json`).
- Schema field lists (all optional unless marked required; nullable where
  the source JSON is `T | null`):
  - `bfInsights`: `slug: z.string()` (req), `heading, subheading, excerpt,
    content, image, video_url, download, external_url, publish_date,
    format, program: z.string().nullable()`, `authors: z.array(z.string())`,
    `projects: z.array(z.string())`, `archived, evergreen, featured,
    retired_news: z.boolean().nullable()`.
  - `bfProjects`: `slug: z.string()` (req), `heading: z.string()`,
    `excerpt, description, kind, program, external_url, image,
    parent_project: z.string().nullable()`, `archived, exclude_from_grid,
    external_only, featured, nav, grid_eligible: z.boolean().nullable()`,
    `grid_order: z.number()`, `microsite_cta: z.string().nullable()`,
    `participation: z.object({ title: z.string(), ctas: z.array(z.string()) }).nullable()`,
    `podcast: z.object({ title: z.string(), host: z.string().nullable(),
    source_note: z.string().nullable(), episodes: z.array(z.object({
    title: z.string(), description: z.string().nullable() })) }).nullable()`,
    `pending: z.string().optional()`.
  - `bfPrograms`: `slug, name, tagline: z.string()` (req — see Decisions),
    `intro, image: z.string().nullable()`.
  - `bfPeople`: `slug, name: z.string()` (req), `job_title, bio, image,
    email, linkedin, twitter: z.string().nullable()`, `board: z.boolean()`.
    **Top-level source key is `people` in the snapshot, but by the time
    this collection reads `content/bf/people/*.json` it is already
    one-file-per-item** (issue 08's output) — the collection's `include`
    globs the per-item files, it does not read `people.json` directly.
  - `bfPages`: `slug: z.string()` (req), `heading, subheading, excerpt,
    description, image, video_url, download, external_url, publish_date,
    bucket, format, kind, program, copy_source,
    legacy: z.string().nullable()`, `authors:
    z.array(z.string())`, `archived, evergreen: z.boolean().nullable()`
    (19-field full schema, incl. `copy_source` and `legacy` for 08's full
    passthrough — the audit's "needs a real schema, 17 fields available"
    gap).
  - `bfAnnouncements`: `message: z.string()`, `url: z.string().nullable()`,
    `status: z.string()`, plus `heading, excerpt, workstream:
    z.string().nullable()` — schema for the **single emitted document**
    (issue 08 writes exactly one file to `content/bf/announcements/`), not
    an array wrapper.
- Export each collection's inferred type (`z.infer<typeof schema>` pattern,
  or `@nuxt/content`'s generated collection types if the existing 12
  collections already surface them — match whatever pattern
  `content.config.ts` already uses for type export, do not invent a new
  one) so card-prop issues (21-27) can import them.
- Export `type Insight/Project/Program/Person/Page/Announcement =
  z.infer<…>` from `src/types/bf-contracts.ts`.
- Probe page at `src/pages/bf-probe/09-data-collections.vue` calling
  `queryCollection('bfInsights').count()` and asserting 354 client-side, or
  rendering the count for manual read.

## Out of scope

- The 12 existing collections — not touched, not renamed, not re-ordered.
- A seventh collection for menus — menus stay a typed JSON module
  (`src/assets/bf-data/menus.json`, issue 08), per BRIEF §6.
- Any new npm dependency — zod ^4 is already present.
- Any composable (issues 11-13) or component reading these collections.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — data-layer issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -c "bfInsights: defineCollection" content.config.ts   # today: 0, fails; after: 1
grep -c "bfProjects: defineCollection\|bfPrograms: defineCollection\|bfPeople: defineCollection\|bfPages: defineCollection\|bfAnnouncements: defineCollection" content.config.ts   # after: 5
```
Plus: a probe page's `queryCollection('bfInsights').count()` returns 354
(per the issues.md `verify` column — manual/rendered check since this is a
build-time-queried value, not grep-able statically).

## Decisions

- **Program.tagline**: the `bfPrograms` zod schema gains a required
  `tagline: z.string()` field, populated by the normaliser (issue 07) as
  the first sentence of `intro`. Same decision recorded in issues 07 and
  25 (`bfCardProgram`).

_Runner appends here._

### Appended by the item-runner (gh#18)

- **The schemas are derived from what the normaliser emits, not from this
  spec's draft field list.** Ground truth was, in order: the emitted
  interfaces in `scripts/normalise-wireframe-data.ts` (`InsightDoc`,
  `ProjectDoc`, `ProgramDoc`, `PersonDoc`, `PageDoc`, `AnnouncementDoc`,
  `ProjectPodcast`, `RawPageLegacy`), a key/type sweep over all 433 files in
  `content/bf/**`, and the Decisions of issues 07 and 08. Thirteen downstream
  issues consume these types, so a schema that merely *validated* would still
  hand them the wrong shape.

- **Three spec corrections applied** (all pre-flagged by 07/08):
  - `bfPages.legacy` is an **object**, `z.object({ source, type, workstream:
    string|null, id: number|null }).nullable()` — not `z.string().nullable()`.
    Exported as `PageLegacyRef` alongside `Page`.
  - `bfAnnouncements.workstream` is `z.number().nullable()` — the singleton
    carries the Directus M2O id `12`.
  - `bfAnnouncements.status` and `.message` are `z.string().nullable()`, not
    required strings: `AnnouncementDoc` declares them `string | null`. The
    `status === 'published'` gate stays in the composable (issue 13).

- **Which booleans are nullable is not uniform, and the split is load-bearing.**
  Fields the normaliser *computes* are non-null (`insights.featured`,
  `insights.retired_news`, `projects.featured`, `projects.nav`,
  `projects.grid_eligible`, `people.board`); fields that *pass through* from
  the snapshot keep their `| null` (`archived`, `evergreen`,
  `exclude_from_grid`, `external_only`). Declaring the computed ones nullable
  would force every consumer into a pointless null check. `projects.pending`
  is `.optional()` (absent from 36 of 38 documents), not `.nullable()`.

- **Probe asserts 371, not 354** — per 07's Decisions, `featured` (8) and
  `retired_news` (9) are separate highlight records with no slug overlap with
  the 354 `items`. The probe asserts all four numbers (371 total / 354 with
  neither flag / 8 / 9) so a future regression that *merged* the sets instead
  of appending them would still fail, which a bare 371 would not catch.

- **Type-export site: schemas in `content.config.ts`, types re-exported from
  `src/types/bf-contracts.ts`.** The 14 existing collections export no types,
  so there was no house pattern to match. The schemas stay next to the
  collections they validate (this spec's own `schema: z.object({…})` shape),
  and `bf-contracts.ts` re-exports `z.infer<…>` as `Insight`, `Project`,
  `Program`, `Person`, `Page`, `Announcement` (+ `PageLegacyRef`) so
  components have exactly one import site (BRIEF §5 rule 11). The import is
  **type-only** (`import type … from '../../content.config'`): it was measured
  to add zero typecheck errors (178 → 178 with a scratch file), and it pulls
  no `@nuxt/content` runtime into the client bundle, so `bf-contracts.ts`
  still ships no runtime code.

- **`.nullable()` was verified supported before use.** All 14 existing
  collections use only `.optional()`.
  `@nuxt/content@3.16.0`'s `runtime/internal/schema.js` `describeProperty()`
  handles `anyOf` / `oneOf` / `type: [T, 'null']` and emits `NULL` column
  constraints, and `isJSONProperty()` routes nested objects and arrays through
  a JSON column. The probe reads one of each back (`legacy`, `podcast`,
  `podcast.episodes`, `authors`, `projects`) to prove the round trip rather
  than trusting the reading.

- **Verification.** Probe `/bf-probe/09-data-collections` renders **PASS —
  18/18** in the prerendered HTML (371 / 354 / 8 / 9 insights, 38 projects,
  3 programs, 13 people, 4 board, 7 pages, 1 announcement, plus the six
  round-trip shape checks). Typecheck 178/178 (baseline, no new errors; 0 in
  the scoped paths, 0 mentioning any new file). `npx nuxt generate` exits 0 —
  799 routes vs 791 on the untouched worktree, the delta being the new probe
  route; the `no such column: "path"` warnings are pre-existing noise from the
  unrelated legacy `docs` collection. Both wireframe byte-identity diffs
  (vs `dev` and vs the pre-epic base `f757a64`) print nothing. Diffstat is
  3 files, +469/-0 — the 14 existing collections are untouched, unrenamed and
  unreordered.
