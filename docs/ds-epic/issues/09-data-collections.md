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
