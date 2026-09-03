# gh#16 — 07 Normaliser: insights, projects, programs — plan

Spec: `docs/ds-epic/issues/07-data-normaliser-core.md` · Epic brief: `docs/ds-epic/BRIEF.md`
Base: `dev` @ b269c36 · Typecheck baseline: **178** `error TS` lines.

## Approach

One new build-time script, `bfna-website-nuxt/scripts/normalise-wireframe-data.ts`
(`tsx`, same pattern as `validate:tokens` / `generate:search-index`), wired as
`npm run data:normalise`. It reads the three wireframe snapshots **read-only** and
writes one canonical JSON document per item under `bfna-website-nuxt/content/bf/`.

Every synthesis `useWfContent.ts` does for these three collections is materialised
as a plain stored field. `useWfContent.ts` is **not modified** — the wireframes keep
using it (DoD-4).

### Emitted shapes

Field lists are taken from **issue 09's zod schemas** (`docs/ds-epic/issues/09-data-collections.md`),
because 09 is what validates this output. Source fields that 09 does not declare are
dropped (`copy_source`, `legacy`, `slug_note`, `aka`, `authors`/`content` on projects, …).

* `content/bf/insights/<slug>.json` — `slug, heading, subheading, excerpt, content,
  image, video_url, download, external_url, publish_date, format, program, authors,
  projects, archived, evergreen, featured, retired_news`
* `content/bf/projects/<slug>.json` — `slug, heading, excerpt, description, kind,
  program, external_url, image, parent_project, archived, exclude_from_grid,
  external_only, featured, nav, grid_eligible, grid_order, microsite_cta,
  participation, podcast, pending`
* `content/bf/programs/<slug>.json` — `slug, name, tagline, intro, image`

### Ported synthesis

| From `useWfContent.ts` | Materialised as |
|---|---|
| `plain()` (l.272-277) | `plain()` helper in the script; applied to short display strings only |
| `PENDING` map (l.114) | `pending: 'Q6' \| 'Q7'` on 2 projects |
| `inProjectGrid` (l.127-128) | `grid_eligible: boolean` |
| `GRID_ORDER` (l.132-135) | `grid_order: number` (rank, else `Number.MAX_SAFE_INTEGER`) |
| `FEATURED_SLUGS` (l.144) | `featured: boolean` on projects |
| `NAV_SLUGS` (l.148) | `nav: boolean` on projects |
| `programs` map (l.109-110) | `heading → name`, `legacy_workstreams` dropped |
| `insights.json.featured` / `.retired_news` | `featured` / `retired_news` booleans on insight docs |
| — (new, spec Decisions) | `Program.tagline` = first sentence of `intro` |

## Files

* **new** `bfna-website-nuxt/scripts/normalise-wireframe-data.ts`
* **edit** `bfna-website-nuxt/package.json` — add `"data:normalise"`
* **edit** `bfna-website-nuxt/.gitignore` — un-ignore `content/bf/` (see Decisions D-1)
* **new (generated, committed)** `bfna-website-nuxt/content/bf/{insights,projects,programs}/*.json`
* **edit** `docs/ds-epic/issues/07-data-normaliser-core.md` — Decisions appended

Not touched: `src/composables/useWfContent.ts`, anything under `src/pages/wireframes/`,
`src/components/wireframe/`, `src/layouts/wireframe.vue`, `public/css/wireframe.css`,
`src/assets/wireframe-data/**`, `content.config.ts` (issue 09), `contentImporter.js`.

## Decisions taken by the runner (data reality vs. spec assumptions)

**D-1 — `content/` is gitignored.** `bfna-website-nuxt/.gitignore:26` ignores `/content/`
wholesale and nothing under `content/` is tracked. `npx nuxt generate` (DoD-1) runs no npm
script, so if the normaliser output is not committed, issue 09's collections have no data on
a fresh checkout. → the ignore rule becomes `/content/*` + `!/content/bf/`, and the generated
`content/bf/**` is committed. Only the `bf/` subtree is un-ignored; the Directus importer's
output stays ignored.

**D-2 — `insights.json.featured` (8) and `.retired_news` (9) are disjoint from `items`.**
The spec's mapping table assumes they are slugs of existing items ("boolean on the matching
insight item"); in the data they are 8+9 *separate* Directus-highlight records with
`bucket: "highlight"` and **zero** slug overlap with the 354 `items`. Flagging only would emit
`featured: false` on all 354 and silently drop the homepage featured strip that
`useWfContent.highlights()` renders today. BRIEF §6 says these must become "boolean/bucket
fields on the item, **not separate collections**" → they are emitted as additional
`bf/insights` documents carrying `featured: true` / `retired_news: true`.
**Total insight files: 371 (354 + 8 + 9), not 354.** Same precedent the spec itself sets for
`projects.json` (`count: 37`, 38 actual): actual data beats the declared count.

**D-3 — 2 duplicate slugs inside `insights.json.items`.** `graphic-images-autocrats-and-the-use-of-power`
and `uncivil-war` each appear twice (352 unique slugs / 354 items; the snapshot's own `note`
calls them "2 cross-collection duplicates marked `duplicate_of`"). All 354 are kept (the spec's
count). Filenames disambiguate deterministically in snapshot order: first `<slug>.json`, nth
`<slug>-<n>.json`; the `slug` **field** keeps its real value.

**D-4 — `plain()` is applied to display strings only, never to `content`/`intro` body copy.**
`content` is markdown-or-legacy-HTML rendered by `wfProse`, which does its own block parsing;
running `plain()` over it would collapse `</p>` boundaries into run-on text. `plain()` is
applied to insight `heading`/`subheading`/`excerpt` and project `heading`/`excerpt`/`description`
(spec's explicit list) and `content`/`intro` pass through byte-identical.

**D-5 — no content-derived excerpt fallback for insights.** 195 of 354 items have a null/empty
excerpt. `wfCardInsight` renders `plain(insight.excerpt)` and shows nothing when it is empty;
BRIEF ground rule 10 requires `bf-*` to render the same data as its `wf-*` counterpart, so
deriving an excerpt from `content` would break parity and inject markdown artefacts. Empty
excerpts stay `null`. The project-side `excerpt ?? description` fallback likewise stays
presentational — both fields are emitted, `plain()`-cleaned.

**D-6 — curation order is lost to booleans.** `FEATURED_SLUGS`/`NAV_SLUGS` order the homepage
and nav lists today; issue 09's schema declares only `featured`/`nav` booleans, so order is not
stored. The ordering constants belong to the composables in issue 12.

## Test strategy

1. `npm run data:normalise` → counts: 371 insights / 38 projects / 3 programs.
2. Idempotency: `sha256sum` sweep before/after a second run must diff empty; `git status` clean.
3. Spot-check parity against `useWfContent`: `pending` on exactly `transponder-magazine` (Q6) and
   `bfna-documentaries` (Q7); `grid_eligible` true count == `inProjectGrid` true count;
   `featured`/`nav` sets == `FEATURED_SLUGS`/`NAV_SLUGS`; `grid_order` ranks match `GRID_ORDER`.
4. Typecheck gate: total `error TS` ≤ 178 and 0 in `src/components/bf|types|composables/bf|content.config`.
5. `npx nuxt generate` exits 0.
6. Wireframe byte-identity: `git diff --stat` over the frozen paths prints nothing.

## Risks

* **Extra keys vs. issue 09's zod schemas** — emitting source fields 09 does not declare would
  fail collection parsing later. Mitigated by emitting exactly 09's field lists.
* **`content/bf/**` in the repo** — ~412 generated files enter git (D-1). They are derived from
  already-committed snapshots, deterministic, and reviewable as a single mechanical commit.
* **371 vs 354** (D-2) — deviates from the issue's headline acceptance number; surfaced in the
  journal, the PR body and the spec's Decisions section so issues 08/09 inherit the corrected count.
