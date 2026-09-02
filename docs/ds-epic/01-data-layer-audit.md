# 01 — Current Data Layer Audit

Read-only analysis. Source checked out at
`/Users/claudiomendonca/Documents/GitHub/ccmdesign/ccm-clients/bfna/bfna-website-migration-2/bfna-website-nuxt`,
branch `wireframes` (not switched, not built, importer not run).

## A. @nuxt/content — installed, configured, and already in production use

- **Installed**: `@nuxt/content: ^3.7.1` (`package.json:` dependencies). `zod: ^4.0.0` also a dep. `valibot` — not present anywhere in `package.json`.
- **Registered**: `src/nuxt.config.ts:34-38` — `modules: ['@nuxt/content', '@nuxt/eslint', '@vueuse/nuxt', '@nuxt/image']`.
- **Config file**: `content.config.ts` (repo root, single location — no other `content.config.*` found).
- **Collections defined** (12 total):

| Collection | Type | Source glob (`cwd: content/`) | Schema notes |
|---|---|---|---|
| `blog` | page | `blog/*.md` | `published: boolean` — **dir does not exist under `content/`** |
| `casestudies` | page | `case-studies/*.md` | `published: boolean` — **dir does not exist** |
| `services` | page | `services/*.md` | `status?: string` — **dir does not exist** |
| `componentDocs` | page | `docs/components/*.md` | large schema (hero, prompt/version metadata) — **dir does not exist** |
| `workstreams` | data | `workstreams/*.json` | full zod object, slug regex-validated |
| `highlights` | data | `highlights/*.json` | full zod object |
| `announcements` | data | `announcements/*.json` | full zod object |
| `publications` | data | `publications/*.json` | full zod object incl. nested authors/workstream |
| `videos` | data | `videos/*.json` | full zod object |
| `infographics` | data | `infographics/*.json` | full zod object |
| `docs` | data | `docs/*.json` | full zod object |
| `people` | data | `people/*.json` | full zod object |
| `super_products` | data | `super_products/*.json` | full zod object |
| `products` | data | `products/*.json` | full zod object |

(That's 14 rows / 12 unique top-level keys — `docs` appears twice, once as `componentDocs` (md) and once as `docs` (json).)

- **`queryCollection` in active use today**: yes, extensively — 27 non-wireframe files call it (`grep -rn queryCollection src/pages src/composables`), including `src/pages/docs/index.vue`, `src/pages/docs/[...slug].vue`, `src/pages/docs/components/[slug].vue`, `src/pages/blog/index.vue`, and every file under `src/composables/data/*.ts` (`useProducts`, `usePublications`, `useVideos`, `useInfographics`, `usePeople`, `useWorkstreams`, `useAnnouncements`, `useHighlights`, `useSuperProduct`, `usePodcast(s)`, plus Home* variants). This is the **production (non-wireframe) content layer** — fully separate from the wireframe area's `useWfContent.ts`.

## B. `content/` directory — what's there, produced by what

- Populated, git-tracked JSON/data (no `.md` files present despite 4 page-type collections expecting them).
- Produced by `contentImporter.js` (writes into `./content/<collection>/*.json`), i.e. generated, not hand-authored — confirmed by the `rimraf` + rewrite pattern in every `src/directus/*.js` file (see C).

| Dir | File count |
|---|---|
| `content/announcements/` | 1 |
| `content/docs/` | 5 |
| `content/external_collaborators/` | 49 |
| `content/highlights/` | 8 |
| `content/infographics/` | 55 |
| `content/people/` | 15 |
| `content/products/` | 117 |
| `content/publications/` | 184 |
| `content/super_products/` | 8 |
| `content/videos/` | 43 |
| `content/workstreams/` | 8 |

**Gap**: `content/external_collaborators/` exists with 49 files but **has no matching collection in `content.config.ts`** — it's on disk, git-tracked, but invisible to `queryCollection`. Conversely, `blog/`, `case-studies/`, `services/`, `docs/components/` collections are configured but their source dirs don't exist under `content/`.

## C. Importer — entry point, env, output, runnability

- **Entry point**: `contentImporter.js` (root), invoked via `npm run directus:pull` (`node ./contentImporter.js`) or as the first step of `npm run generate`.
- Calls 11 functions from `src/directus/*.js`: `getHighlights, getSuperProducts, getWorkstreams, getVideos, getPeople, getExternalCollaborators, getInfographics, getPublications, getProducts, getAnnouncements, getDocs` — one file per collection, all importing shared helpers from `src/directus/common.js`.
- **Pattern per collection** (e.g. `src/directus/people.js`): `rimraf` the target `content/<name>/` dir, recreate it, fetch via `common.getDirectusData(collectionName)`, map each Directus item to a plain object (slug computed via `common.slugify(name)`), `fs.writeFile` one JSON file per item named `<slug>.json`.
- **Env needed** (from `src/directus/common.js`): `BASE_URL` (Directus REST base, required — `createDirectus(process.env.BASE_URL)`), `DEV` (optional JSON array overriding the `status` filter, defaults to `["published"]`), `DOCS_CONTENTFUL_SPACE` + `DOCS_CONTENTFUL_ACCESS_TOKEN` (Contentful client for docs), `GOOGLE_KEY` (video-thumbnail lookups). No `.env*` file exists in the checkout (`find . -maxdepth 1 -iname ".env*"` empty) — **not runnable without secrets supplied externally**, confirming the spec's read-only constraint was necessary. Importer was not run.

## D. Wireframe snapshots (`src/assets/wireframe-data/*.json`)

All 6 files present are covered below.

| File | Top-level shape | Item count | Modeled by (useWfContent) | Divergences |
|---|---|---|---|---|
| `insights.json` | dict: `{generated, archive_cutoff, copy_sources, note, count, items[], featured[], retired_news[]}` | `items`: 354 (matches declared `count: 354`); `featured`: 8; `retired_news`: 9 | `WfInsight` | JSON items carry extra runtime-only fields not in the type (`copy_source`, `legacy`) — additive, harmless. Type field list otherwise matches observed keys. |
| `projects.json` | dict: `{generated, archive_cutoff, copy_sources, note, count, top_level_count, pending_copy[], items[]}` | `items`: 38 actual vs **declared `count: 37`** (off by one) | `WfProject` | Type has fields (`exclude_from_grid`, `external_only`, `microsite_cta`, `podcast`, `pending`) that are optional/composable-computed — some (`pending`) are synthesized in `useWfContent.ts` itself (`PENDING` map), not present in the JSON at all. |
| `programs.json` | dict: `{generated, archive_cutoff, copy_sources, note, count, items[], legacy_map}` | `items`: 3 (matches) | `WfProgram` | JSON items carry `heading` + `legacy_workstreams`; type is `{slug, name, intro, image}` — `useWfContent.ts:109-110` explicitly remaps `heading → name` and drops `legacy_workstreams`. Not a JSON/type mismatch, but a required transform. |
| `people.json` | dict: `{generated, note, counts, people[]}` (**different top-level key**: `people`, not `items`) | `people`: 13 | `WfPerson` | JSON items include `job_title` (snake_case, matches type), plus `email, linkedin, twitter, status, source, legacy` not modeled by `WfPerson` (type only declares `slug, name, job_title, bio, image, board?`) — unused-but-present fields. |
| `pages.json` | dict: `{generated, archive_cutoff, copy_sources, note, count, items[]}` | `items`: 7 actual vs **declared `count: 1`** (mismatch) | inline anonymous type in `useWfContent.ts:184` (`{slug, heading, description}`) — no exported `WfPage` type despite the spec's expectation of one | JSON items carry many more fields (`subheading, excerpt, authors, image, video_url, download, external_url, publish_date, bucket, format, kind, program, archived, evergreen, copy_source, legacy`) that the inline type ignores entirely. |
| `announcements.json` | dict: `{generated, archive_cutoff, copy_sources, note, items}` where **`items` is a single object, not an array** (only file shaped this way) | 1 record | inline anonymous type in `useWfContent.ts:188` (`{message, url, status}`) | Type only models 3 of the object's fields; JSON record also has `id, status, user_created, date_created, user_updated, date_updated, workstream, heading, excerpt`. |

Biggest structural outlier: `announcements.json` is dict-of-one-object where every other file is dict-of-array — a naive "each file → one collection of items" mapping breaks on this file specifically.

## E. Composable surface — `src/composables/useWfContent.ts`

Type exports (6): `WfInsight`, `WfProject`, `WfProgram`, `WfMenuItem`, `WfMenu`, `WfPerson`. (No `WfPage` type exists — pages/announcement use inline anonymous types, see D.)

`useWfContent()` returns 34 members — all listed:

| Member | Signature | Purpose |
|---|---|---|
| `items` | `WfInsight[]` | all insights, snapshot order |
| `active` | `WfInsight[]` | non-archived insights, sorted by `publish_date` desc |
| `archived` | `WfInsight[]` | archived insights, sorted desc |
| `bySlug` | `(slug) => WfInsight \| undefined` | look up one insight |
| `activeByProgram` | `(program) => WfInsight[]` | active insights filtered by program |
| `archivedCountByProgram` | `(program) => number` | count of archived insights per program |
| `highlights` | `() => WfInsight[]` | homepage featured strip (`insights.json.featured`) |
| `programs` | `() => WfProgram[]` | all 3 programs |
| `programBySlug` | `(slug) => WfProgram \| undefined` | look up one program |
| `projects` | `() => WfProject[]` | top-level projects (no `parent_project`) |
| `projectsByProgram` | `(program) => WfProject[]` | top-level projects filtered by program |
| `gridProjectsByProgram` | `(program) => WfProject[]` | active, on-site, grid-eligible projects, client-ordered |
| `productsByProgram` | `(program) => WfProject[]` | `external_only` projects for a program |
| `allProducts` | `() => WfProject[]` | all `external_only` projects, site-wide |
| `projectsPendingRetag` | `() => WfProject[]` | projects whose program is a `RE-TAG` placeholder |
| `projectBySlug` | `(slug) => WfProject \| undefined` | look up any project incl. children |
| `projectChildren` | `(slug) => WfProject[]` | cohort/year children of a project, sorted desc by heading |
| `insightsForProject` | `(slug) => WfInsight[]` | active insights whose M2M `projects` includes slug |
| `navProjects` | `() => WfProject[]` | flagship nav-slug projects, in `NAV_SLUGS` order |
| `menus` | `() => WfMenu[]` | full top-nav/footer menu structure (hardcoded `MENUS`) |
| `featuredProjects` | `() => WfProject[]` | flagship homepage projects, in `FEATURED_SLUGS` order |
| `people` | `() => WfPerson[]` | all people |
| `boardMembers` | `() => WfPerson[]` | people flagged `board` or with "board" in job title |
| `teamMembers` | `() => WfPerson[]` | non-board people, alphabetical by last name |
| `aboutPage` | `() => page \| undefined` | `pages.json` item with slug `about` |
| `stiftungPage` | `() => page \| undefined` | `pages.json` item with slug `stiftung` |
| `homePage` | `() => page \| undefined` | `pages.json` item with slug `home` |
| `pageBySlug` | `(slug) => page \| undefined` | generic page lookup |
| `announcement` | `() => announcement \| undefined` | site banner, only if `status === 'published'` |
| `formatLabel` | `(f) => string` | maps insight `format` to display label, defaults `'Article'` |
| `kindLabel` | `(k) => string \| null` | maps project `kind` to display label |
| `plain` | `(s) => string` | strips HTML tags + decodes a fixed set of entities |
| `paragraphs` | `(s) => string[]` | splits on `\n\n` |
| `monthYear` | `(d) => string` | formats date as `"Mon YYYY"` |

Consumed by 20 files: 9 pages under `src/pages/wireframes/**` and 11 components under `src/components/wireframe/**` (all `wf*.vue`).

## F. Gaps + recommendation

**Minimal collection set to express D via `@nuxt/content`** — 6 collections, one per snapshot file, all `type: 'data'`:

1. `wfInsights` (← `insights.json.items`, 354) + a second small collection or a `featured: boolean`/`bucket` field to cover `featured`/`retired_news` subsets — cleanest as one `wfInsights` collection with those as computed filters (mirrors current `active`/`archived`/`highlights` split, which is already client-side filtering over one array).
2. `wfProjects` (← `projects.json.items`, 38)
3. `wfPrograms` (← `programs.json.items`, 3)
4. `wfPeople` (← `people.json.people`, 13) — note source key is `people`, not `items`; importer/config must target that key or the snapshot's shape must be normalized first.
5. `wfPages` (← `pages.json.items`, 7) — needs a real `WfPage` zod schema/type; none exists today (currently an untyped inline object covering 3 of 17 available fields).
6. `wfAnnouncements` (← `announcements.json`) — needs reshaping: source is a single object, not an array; either wrap it as a 1-item array at import time or model it as a `data` collection with a fixed single doc.

**Zod**: already a dep (`zod: ^4.0.0`), already the schema library used throughout `content.config.ts` — no new dependency needed, and the existing 12-collection config is a directly reusable pattern to extend.

**Does importer output already match snapshot shape?** No — divergent. The importer (`contentImporter.js` → `content/*.json`) writes **one file per item** per collection (117 files for `content/products/`, etc.), driven straight from Directus/Contentful fields. The wireframe snapshots (`src/assets/wireframe-data/*.json`) are **one consolidated file per collection** with a wrapper object (`{generated, count, items[]}`) and curated/renamed fields (e.g. `programs.json.heading` → `WfProgram.name`, synthesized `pending` chips, computed `archived`/`evergreen`/`legacy` flags not in Directus). These are two different pipelines (Directus-live vs. hand-curated migration snapshot) — swapping the wireframe source to `@nuxt/content` is **not** a config-only change; it requires either (a) a new importer path that emits the consolidated wrapper shape into `content/`, or (b) collection schemas + a small transform layer replicating the `useWfContent.ts` remaps (program heading→name, PENDING map, GRID_ORDER, NAV_SLUGS/FEATURED_SLUGS curation, MENUS) that today live in the composable, not the data.

## Verification

- Check 1 — "Every `*.json` in `src/assets/wireframe-data` is covered in D": **PASS**. Directory has exactly 6 files (`announcements.json, insights.json, pages.json, people.json, programs.json, projects.json`); all 6 appear as rows in section D.
- Check 2 — "Every exported member of `useWfContent` is listed in E": **PASS**. 6 type exports + 34 returned composable members enumerated; counts verified against `src/composables/useWfContent.ts:210-282` return object and lines 14-94 type declarations.
