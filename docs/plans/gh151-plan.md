# gh#151 — 09b Data: unique insight slugs + carry `legacy`/`aka` (BF-218 F1+F2)

Data-layer only. No component, page or stylesheet under `bf-*` changes; nothing under
`pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue` or
`public/css/wireframe.css` is touched.

There is no `docs/ds-epic/issues/` spec file for this item — it was promoted straight from
the BF-218 checkpoint review — so the issue body is the spec and the **Decisions** section
at the bottom of this plan is the decision record.

## Findings being fixed

**F1 — `slug` is not unique in `bfInsights`.** 371 documents, 369 distinct slugs. The
normaliser's `makeStemFactory()` disambiguates the *filename* (`<slug>-2.json`) but leaves
the `slug` **field** identical, so `bySlug()` silently returns whichever row @nuxt/content
returns first and `/wireframes/archive` renders 255 hrefs for 256 archived items.

**F2 — `legacy` / `aka` are dropped from `bfInsights` and `bfProjects`.** The normaliser
emits an explicit field list per collection; undeclared source fields are dropped
(`scripts/normalise-wireframe-data.ts` header, l.27-30). `bfPages` is the one full
passthrough and keeps `legacy` + `copy_source`. Issue #57 (the cutover redirect map) has no
other source of old-URL provenance.

## Snapshot facts established before planning

| Fact | Value |
| --- | --- |
| Total insight documents | 371 (354 `items` + 8 `featured` + 9 `retired_news`) |
| Colliding slugs | `graphic-images-autocrats-and-the-use-of-power` (idx 64, 138), `uncivil-war` (idx 167, 176) |
| Insights carrying `legacy` | 371 / 371, all with a non-null `legacy.source` |
| Projects carrying `legacy` | 37 / 38 — `bfna-documentaries` has `"legacy": null` in the snapshot |
| Projects carrying `aka` | 7, each with exactly one entry of `{ slug, heading, legacy }` |
| Insight `legacy.id` types | `string` (contentful ids) **and** `number` (directus ids) |
| Project `legacy.id` types | `number` and `null`; `aka[].legacy.id` is a `string` |
| Page `legacy.id` types | `null` on every row (hence today's `z.number().nullable()`) |
| Snapshot `slug_note` rows | 2 (`democracys-canary-in-a-coal-mine-infographic`, `austrian-elections-infographic`) — neither collides |
| Snapshot `duplicate_of` rows | 2, and both are the **first** occurrence of a colliding pair; shape is `{ slug, collection }` |

## Approach

### 1. Normaliser — `scripts/normalise-wireframe-data.ts`

- `makeStemFactory()` keeps its behaviour but the caller now learns whether the stem was
  disambiguated. Insight emission becomes: compute `stem = stemFor(raw.slug)`; when
  `stem !== raw.slug`, the emitted document carries `slug: stem` and
  `duplicate_of: raw.slug`. Filename and `slug` field therefore always agree.
- `slug_note` passes through verbatim when the snapshot row has one; omitted otherwise.
- `legacy` is carried on `InsightDoc` and `ProjectDoc` as the snapshot object, `null` when
  absent (only `bfna-documentaries`).
- `aka` is carried on `ProjectDoc` as `{ slug, heading, legacy }[]`, omitted when absent.
- No other emitted field changes; `program`, CEPI parents and `grid_order` are untouched.

### 2. Schema — `content.config.ts`

- New exported `bfEntityLegacySchema`: the `bfPages` provenance shape plus `product_type`,
  with `id: z.union([z.string(), z.number()]).nullable()` because insight ids are
  contentful strings and project ids are directus numbers. `bfPageLegacySchema` is **left
  alone** so `content/bf/pages/**` produces zero diff.
- `bfInsightSchema` gains `legacy: bfEntityLegacySchema.nullable()`,
  `duplicate_of: z.string().optional()`, `slug_note: z.string().optional()`.
- `bfProjectSchema` gains `legacy: bfEntityLegacySchema.nullable()` and
  `aka: z.array(bfProjectAkaSchema).optional()`.
- Every addition is optional or nullable; no existing field changes shape, and **no new
  boolean** is introduced (gh#140 rule holds: `BOOLEAN_FIELDS` needs no edit).

### 3. Types — `src/types/bf-contracts.ts`

Re-export `EntityLegacyRef` (`z.infer<typeof bfEntityLegacySchema>`) and `ProjectAka`
alongside the existing `PageLegacyRef`. `Insight` / `Project` pick the new fields up
automatically through their existing `z.infer`.

### 4. Regenerate

`npm run data:normalise`, then read the `content/bf/**` diff and confirm it is exactly:
added `legacy` on all 371 insights and 38 projects, added `aka` on 7 projects, added
`duplicate_of`/`slug_note` where applicable, and the two slug-field renames
(`uncivil-war-2`, `graphic-images-autocrats-and-the-use-of-power-2`). No file is added or
removed; no other field moves.

### 5. Probes

Probe 09 gains four rows:

- insight slug count == distinct insight slug count == 371;
- insights with a non-null `legacy.source` == 371;
- projects with a non-null `legacy.source` == 37 (documented exception below);
- both `-2` documents carry `duplicate_of` pointing at the un-suffixed slug.

Probe 11 gains one row: `bySlug('uncivil-war-2')` resolves and carries that slug.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (orchestrator decision after #19,
residual #86) — acceptance does not depend on it. Instead:

1. `npx tsx scripts/check-probes.ts --only 09` → exit 0
2. `npx tsx scripts/check-probes.ts --only 11` → exit 0
3. `npx tsx scripts/check-probes.ts` (full) → exit 0
4. `npx nuxt generate` → exit 0 (a schema mismatch fails the build before a probe renders)
5. Typecheck gate: total `error TS` count ≤ 178 baseline, and 0 in
   `src/(components/bf|types|composables/bf)` or `content.config`
6. Idempotence: re-run `npm run data:normalise` after committing → `git status` clean
7. Wireframe byte-identity vs `f757a64` → empty

## Risks

| Risk | Mitigation |
| --- | --- |
| Widening `legacy.id` to `string \| number` weakens `PageLegacyRef` | `bfPageLegacySchema` is untouched; the widened union lives on a separate schema used only by insights/projects |
| A consumer reads `Insight['slug']` as the canonical Directus slug and the rename breaks a link | The `-2` slug is the *filename* stem the content database already keyed on; `duplicate_of` preserves the original for the #57 redirect map |
| Probe 09's existing row queries `slug = 'graphic-images-autocrats-and-the-use-of-power'` | The **first** occurrence keeps the un-suffixed slug, so that row is unaffected |
| `aka[].legacy` nesting fails the SQLite JSON round trip | Same nesting depth as `podcast.episodes`, which probe 09 already asserts round-trips |

## Decisions

**D-151.1 — `duplicate_of` is the original slug, as a string.** The issue scope names
`duplicate_of: <original slug>`, and that is what is emitted: on a renamed document it
holds the un-suffixed slug the row collided with. The snapshot *also* carries a
`duplicate_of` of its own — `{ slug, collection }` — but on the **first** occurrence of
each pair, pointing forward at the other row's collection. Carrying both under one name
would give the field two shapes and two directions. The snapshot object's `.slug` is
identical to the value emitted here, and its `.collection` is recoverable from the other
row's `legacy.type` (`publications` / `videos`), which this change now carries — so
nothing is lost. Recorded rather than reconciled because #57 needs a lookup, not a graph.

**D-151.2 — the renamed rows and their new slugs.**

| File stem (unchanged) | Old `slug` field | New `slug` field | `duplicate_of` |
| --- | --- | --- | --- |
| `uncivil-war-2.json` | `uncivil-war` | `uncivil-war-2` | `uncivil-war` |
| `graphic-images-autocrats-and-the-use-of-power-2.json` | `graphic-images-autocrats-and-the-use-of-power` | `graphic-images-autocrats-and-the-use-of-power-2` | `graphic-images-autocrats-and-the-use-of-power` |

In both pairs the row that keeps the plain slug is the earlier snapshot row (idx 64 / 167),
which is also the one the snapshot flags with its own `duplicate_of`. Stem assignment is
unchanged, so no file is added, removed or renamed on disk.

**D-151.3 — a separate `bfEntityLegacySchema` rather than reusing `bfPageLegacySchema`.**
The two are the same *idea* with different value domains: page ids are `null` on every row,
insight ids are contentful strings, project ids are directus numbers, and insights/projects
carry a fifth key (`product_type`) that pages do not. Widening the page schema would change
`bfPages`'s contract for no consumer and risk a `content/bf/pages/**` diff this issue is not
allowed to make. Two schemas, one shared idea, zero blast radius.

**D-151.4 — `bfna-documentaries` has no `legacy`, so "every project carries `legacy.source`"
is asserted as 37/38.** The snapshot row explicitly carries `"legacy": null`; it is the one
project with no Directus/contentful provenance (it is the BFNA Documentaries external site).
The probe row therefore asserts the exact carried-through count (37) rather than "all", and
a second row pins `bfna-documentaries` as the single exception — so a future row losing its
provenance still fails the probe.

**D-151.5 — vitest substitution.** Per the epic's test-harness decision the acceptance is
`npx tsx scripts/check-probes.ts --only 09`, `--only 11` and the full run, plus the
idempotence re-run of the normaliser. No vitest test is added.
