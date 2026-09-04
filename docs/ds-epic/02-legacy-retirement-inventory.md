# Legacy retirement inventory

Analysis only — read-only pass over `bfna-website-nuxt/src` on the `wireframes`
checkout (branch not switched). Scope: everything served at `/` today that is
**not** `pages/wireframes/**`, so the epic can retire it deliberately once
`bf-*` pages take over the root routes.

All paths below are relative to
`bfna-website-nuxt/src/` unless a repo-root path is given explicitly
(`content/`, `scripts/`, `content.config.ts`, `.netlify/`).

---

## A. Route table (22 routes — matches 22 page files outside `pages/wireframes/**`)

| Path | Page file | Layout | Data source | Reachable from nav? |
|---|---|---|---|---|
| `/` | `pages/index.vue` | `legacy-base` | `@nuxt/content` collections `workstreams`/`highlights`/`publications`/`videos`/`infographics`/`docs` (JSON under repo-root `content/`, synced from Directus by `contentImporter.js` / `npm run directus:pull`) | Yes — logo link in `Frame.vue` |
| `/about` | `pages/about.vue` | `legacy-base` | Hardcoded in-component object (`aboutData` computed); no Directus/content call | Yes — `Frame.vue` nav + `MainNav.vue` primaryLinks |
| `/team` | `pages/team.vue` | `legacy-base` | `usePeople()` → `queryCollection('workstreams')` + `queryCollection('people')` | Yes — `MainNav.vue` ("Team", "Board of Directors") |
| `/search` | `pages/search.vue` | `legacy-base` | `useSearch()` → `server/api/search.get.ts` → static `public/search.json` (built by `scripts/generate-search-index.ts`) | Yes — via the search box in `Footer.vue`/`OffCanvas.vue` (form action, not a nav link) |
| `/updates` | `pages/updates.vue` | `legacy-base` | `usePublications/useVideos/useInfographics/useUpdatesPodcasts` → `queryCollection(...)` | Yes — `Frame.vue` + "More Content" buttons on all 4 workstream pages |
| `/archives` | `pages/archives/index.vue` | `legacy-base` | `useWorkstreams()` → `queryCollection('workstreams')` | **No** — only referenced by the dead, commented-out `updatesLinks`/`columns` block in `MainNav.vue` (lines ~131–159); not rendered anywhere. Orphan route today. |
| `/democracy` | `pages/democracy/index.vue` | `legacy-base` | `useWorkstreams('democracy')` → `queryCollection` | Yes — `Frame.vue` top nav |
| `/digital-world` | `pages/digital-world/index.vue` | `legacy-base` | `useWorkstreams('digital-world')` → `queryCollection` | Yes — `Frame.vue` top nav |
| `/future-leadership` | `pages/future-leadership/index.vue` | `legacy-base` | `useWorkstreams('future-leadership')` → `queryCollection` | Yes — `Frame.vue` top nav |
| `/politics-society` | `pages/politics-society/index.vue` | `legacy-base` | `useWorkstreams('politics-society')` → `queryCollection` | Yes — `Frame.vue` top nav |
| `/podcasts` | `pages/podcasts/index.vue` | `legacy-base` | `useWorkstreams('podcasts')` → `queryCollection` | Yes — `MainNav.vue` legacyLinks ("Podcasts") |
| `/podcasts/:slug` | `pages/podcasts/[slug].vue` | `legacy-base` | `useSuperProduct()` / `usePodcast()` → `queryCollection('super_products' \| 'products')` | Yes — via product cards on `/podcasts` |
| `/:slug*` (catch-all) | `pages/[...slug].vue` | `legacy-base` | `useSuperProduct/useProduct/usePublication/useVideo/useInfographic` → `queryCollection(...)` (branches on which query resolves) | Yes — every content card across workstream/podcasts/updates pages, plus direct nav entries `Transponder Magazine` and `Bertelsmann Stiftung` (no dedicated page file for either) |
| `/blog` | `pages/blog/index.vue` | *default* (no `layout:` set) | `queryCollection('blog').all()` — collection defined in root `content.config.ts` but **no `content/blog/*.md` files exist** → always empty | **No** — not linked from `Frame.vue`/`MainNav.vue`; only self-referential links inside `components/ds/*` and `layouts/article-layout.vue` |
| `/blog/:slug*` | `pages/blog/[...slug].vue` | `article-layout` | `contentOne('blog', {slug})` (same empty `blog` collection) | No (see above) — always renders "Post not found" today |
| `/docs` | `pages/docs/index.vue` | *default* | Static `public/component-docs/index.json` (or `/api/component-docs` fallback) + `queryCollection('docs').all()` (a **different, non-empty** `docs` data collection unrelated to the empty `blog`/prose collections) | No — internal design-system tool, not in the public `Frame`/`MainNav` |
| `/docs/:slug*` | `pages/docs/[...slug].vue` | `docs-layout` | `queryCollection('docs').path(...)` — this is the **`docs` *page* collection** (`content/docs/*.md` guidelines/tokens/utilities prose), which also has **no `.md` files today** → always "Document not found" | No |
| `/docs/:component` | `pages/docs/[component].vue` | *default* | none — pure `definePageMeta({ redirect: ... })` stub to `/docs/components/:component` | No (internal redirect helper only) |
| `/docs/components/:slug` | `pages/docs/components/[slug].vue` | `docs-layout` | `queryCollection('componentDocs').path(...)` (`content/docs/components/*.md`, currently empty) | No |
| `/docs/demos/:slug` | `pages/docs/demos/[slug].vue` | `demo` | Dynamic `import()` of `components/docs/demos/${slug}.vue` | No |
| `/test` | `pages/test.vue` | *default* | none (static markup) | No — dev scaffolding |
| `/test-base-layout` | `pages/test-base-layout.vue` | `base` | none (static markup) | No — dev scaffolding |

Note: `pages/docs/demos/_docs/*.html` are static reference assets consumed by
the docs generator scripts, not Nuxt routes — excluded from the 22-route count.

---

## B. Component table (every non-wireframe dir under `components/`)

| Dir | Files | Used by (non-wireframe) | Verdict |
|---|---|---|---|
| `components/legacy/atoms` | `Logo.vue`, `LogoWhite.vue` | `Logo`: `Hero.vue`, `Frame.vue` (2). `LogoWhite`: `MainNav.vue` (1) | retire |
| `components/legacy/molecules` | 14 files | `Card.vue` (7: `HomepageUpdates`, `UpdatesPageTab`, archives/democracy/digital-world/future-leadership/politics-society index pages), `Hero.vue` (10: about/archives/democracy/digital-world/future-leadership/index/podcasts-index/politics-society/team/updates), `ProductCard.vue` (6), `ProductCardWebsite.vue` (6), `ProductCardThin.vue` (2: `[...slug].vue`, `podcasts/[slug].vue`, auto-imported by bare tag), `ProductHero.vue` (2), `Breadcrumb.vue` (2), `PeopleSection.vue`→*(this one is `templates`, see below)*, `HighlightCard.vue` (1: `index.vue`), `DocCard.vue` (1: `index.vue`), `SplitSection.vue` (1: `index.vue`), `VideoSection.vue` (1: `about.vue`), `SimpleFilters.vue` (1: `UpdatesPageTab.vue`), `AnnouncementCard.vue` (1: `Hero.vue`, auto-imported bare tag), `PlatformNav.vue` (1: `Hero.vue`) | retire |
| `components/legacy/organisms` | `Frame.vue`(2), `Footer.vue`(2), `MainNav.vue`(2), `OffCanvas.vue`(1) | as above | retire |
| `components/legacy/organisms/Header.vue` | — | **0 usages anywhere** (not imported by `Frame.vue` or any layout) | retire — already dead code, orphaned before this migration |
| `components/legacy/templates` | `HomepageUpdates.vue`(1: `index.vue`), `PeopleSection.vue`(2: `[...slug].vue`, `team.vue`) | as above | retire |
| `components/templates/UpdatesPageTab.vue` | — | `updates.vue` (1) | retire |
| `components/custom/projectCard.vue` | — | **0 usages** | retire — dead code |
| `components/docs/DocsTabs.vue` | — | **0 usages** | retire — dead code |
| `components/docs/demos/*.vue` (11 files) | — | Each dynamically `import()`-ed by `pages/docs/demos/[slug].vue` by matching slug (1 caller each) | keep-shared — powers the kept `/docs` dev-tooling site |
| `components/content/*.vue` (8 files: `callout`, `ctaSignup`, `docs-code-block`, `docs-component-source`, `docs-live-demo`, `docs-props-table`, `proseHgroup`, `proseSection`, `tldrSection`) | — | **0 live usages** — these are `@nuxt/content` MDC prose components meant for markdown in `content/blog/*.md` / `content/docs/*.md`, and **no such `.md` files exist** in the repo today | unknown — reason: whether these retire depends on whether `/blog` and `/docs` prose ship any content before the flip; not exercised either way right now |
| `components/ds/molecules` (7: `ccmBreadcrumb`, `ccmButton`, `ccmChip`, `ccmFormField`, `ccmFormGroup`, `ccmTabs`, `ccmTopbar`) | — | `ccmButton`/`ccmChip`: `layouts/enhanced-hybrid.vue`, `layouts/{article,docs}-layout.vue`, `pages/docs/index.vue`, own demos. Others: only their own demo component | keep-shared |
| `components/ds/organisms` (6: `ccmByLine`, `ccmCard`, `ccmFooter`, `ccmHero`, `ccmSection`, `ccmTable`) | — | `ccmFooter`/`ccmHero`: `layouts/{default,article-layout,docs-layout,docs2,enhanced-hybrid,demo}.vue`. `ccmSection`: `pages/blog/*`, `pages/docs/*` (all of them). `ccmCard`: `pages/blog/index.vue` | keep-shared — confirmed **zero** imports of `components/legacy/**` from anywhere in `components/ds/**` (clean boundary) |

Verified: every directory directly under `components/` (`content`, `custom`,
`docs`, `ds`, `legacy`, `templates`, plus `wireframe` which is out of scope
per the spec) is classified above.

---

## C. Shared infrastructure to keep (with reason)

- `components/ds/**` (13 components) — design-system primitives with zero
  dependency on `components/legacy/**`; used today by the `/docs` and `/blog`
  scaffolding and are the natural building blocks for `bf-*` pages.
- `components/docs/**` — powers the `/docs` internal design-system
  documentation site, which is out of scope for the public-site flip (it
  doesn't compete with `bf-*` for the same routes).
- `content.config.ts` (repo root) + repo-root `directus/*.js` importer
  scripts + `content/{workstreams,publications,videos,infographics,people,
  super_products,products,announcements,highlights,docs}/*.json` — the
  Directus → `@nuxt/content` data pipeline. Kept regardless of the flip:
  it's the CMS layer, not legacy UI. Note it is **entirely separate** from
  the wireframe pages' own dataset (`src/assets/wireframe-data/*.json`,
  see blocker note below) — no shared coupling to manage.
- `server/api/component-docs/*.get.ts` — feeds the kept `/docs` page.
- `src/nuxt.config.ts` `components:` auto-import block, `image:` config,
  `postcss`/`build` settings — framework-level, unrelated to route content.

Not kept, but not urgent to delete either (dead, zero callers today,
independent of the flip): `server/api/test.get.ts`, `server/api/contact.post.ts`
(no page currently calls either).

---

## D. Config touchpoints to change when `/` flips

- `src/nuxt.config.ts:108-112` — `nitro.prerender.routes: ['/wireframes']`.
  Only seeds the wireframe crawl today; will need the new `bf-*` route list
  added (or the wireframe-only comment removed) once those routes are canonical.
- `src/server/middleware/redirects.ts:1-25` — hardcoded 301s
  `/digital-economy/* → /digital-world/*` and `/future-of-work/* →
  /future-leadership/*`. These target names must be re-pointed to whatever
  the `bf-*` equivalents of `/digital-world` and `/future-leadership` are
  once those routes move (see redirect plan below — likely `/digital-world`
  and `/future-leadership` under `wireframes/[area]`, but slug parity should
  be confirmed with GGS taxonomy before cutover).
- `scripts/generate-search-index.ts:152-161,232` — reads
  `src/content/data/{publications,videos,infographics}.json` (**this path no
  longer exists** — real content now lives at repo-root
  `content/{publications,videos,infographics}/*.json`, so this script is
  already stale/broken) and writes repo-root `public/search.json`, which
  feeds `src/server/api/search.get.ts` → `pages/search.vue`. Retire together
  with `/search`; no wireframe page depends on it (`/wireframes/search`
  reads `src/assets/wireframe-data/*.json` directly, not this index).
  **Done in gh#68 (residual #211), with one correction to the wording above:**
  `/search` was *replaced*, not retired — `pages/search.vue` is now a `bf-*`
  page reading the `bf*` `@nuxt/content` collections, and it never touched this
  index. What retired was the whole legacy chain behind the old page:
  `scripts/generate-search-index.ts`, `server/api/search.get.ts`,
  `src/types/search.ts` (importable only by that script) and
  `public/search.json`, plus the `generate:search-index` step in `build` and the
  script entry itself. gh#67 had already deleted `composables/legacy/useSearch.ts`,
  the last caller of `/api/search`; a repo-wide `grep -rn "api/search"` over
  `src/`, `scripts/`, `server/` and `package.json` returned nothing before the
  deletion.
- `src/layouts/legacy-base.vue:133-138` — `useHead` stylesheet hrefs
  `/global.css`, `/fixes.css`, `/v2updates.css` (public root). These files do
  **not exist at that path** today — the actual files live at
  `public/css-legacy/{global,fixes,v2updates}.css`. Pre-existing broken
  reference in the current checkout, unrelated to the flip itself, but worth
  fixing or dropping in the same pass since `legacy-base.vue` retires anyway.
  **Done: gh#67 deleted `legacy-base.vue` and with it the three `useHead`
  links; gh#68 verified no other layout references those paths, emptied the
  matching commented-out entries from `nuxt.config.ts`'s `css: []`, and deleted
  the four unreferenced copies at `public/{global,fixes,v2updates,legacy-styles}.css`.
  The originals stay at `src/public/css-legacy/`, unserved.**
- No `routeRules` are defined anywhere in `nuxt.config.ts` (none to update).
- No sitemap module/config file exists in the repo (nothing to update there).
- `.netlify/netlify.toml` is a local auto-generated CLI state file (empty
  `redirects = []`/`headers = []`) — not a real routing config; no touchpoint.

---

## E. Redirect plan (legacy route → `bf-*` target, using `/wireframes/* → /*`)

| Legacy route | `bf-*` target | Note |
|---|---|---|
| `/` | `/` (from `wireframes/index.vue`) | direct |
| `/about` | `/about` (from `wireframes/about.vue`) | direct; that page also absorbs `/team`'s content |
| `/team` | `/about#team` / `/about#board` | `wireframes/about.vue` renders Team + Board of Directors sections in one page — no standalone `/team` in the wireframe set |
| `/democracy`, `/politics-society`, `/future-leadership`, `/digital-world` | `/democracy`, `/politics-society`, `/future-leadership`, `/digital-world` (from `wireframes/[area].vue`) | direct, same slugs |
| `/updates` | `/insights` (from `wireframes/insights/index.vue`) | rename; content model changes from tabbed publications/videos/infographics to a unified filterable feed |
| `/blog` | `/insights` | tentative — no wireframe "blog" route exists; `/insights` is the closest editorial-feed equivalent. Since `/blog` has zero authored content today, likely **410/none** in practice |
| `/podcasts` | **410/none** | no standalone podcasts index in the wireframe set — podcasts are folded into individual project pages (`BF-147`) |
| `/podcasts/:slug` | `/projects/:slug` (from `wireframes/projects/[slug].vue`) | podcast content renders as an "Episodes" band on the parent project page, per `useWfContent.ts` `podcast` field |
| `/:slug*` (product branch) | `/projects/:slug` | products/super-products → projects |
| `/:slug*` (publication/video/infographic branch) | `/insights/:slug` (from `wireframes/insights/[slug].vue`) | |
| `/archives` | `/archive` (from `wireframes/archive.vue`) | rename, singular; also note this route is already unreachable from nav today |
| `/search` | `/search` (from `wireframes/search.vue`) | direct, but backed by a different data source (see D) |
| `/docs`, `/docs/*` | unchanged — **no redirect** | out of scope for the flip; internal DS docs tool stays at `/docs` |
| `/test`, `/test-base-layout` | **410/none** | dev scaffolding, delete |
| `/people` | `/about#team` | **added gh#66**, from residual [#182](https://github.com/ccmdesign/bfna-website-migration-2/issues/182). Absorbed by the About page's Team section (BRIEF §7); no epic issue builds a `/people` route, and `pages/[program].vue`'s `validate` turned its former hollow 200 into a 404 |
| `/bertelsmann-stiftung` | `/about` | **added gh#66**, from residual [#182](https://github.com/ccmdesign/bfna-website-migration-2/issues/182). Linked by `components/legacy/organisms/MainNav.vue:121` and resolved by the legacy catch-all with no page file of its own (Section A); the Stiftung relationship now renders on `/about` via `useBfPages().stiftungPage` |
| `/careers` | **410/none** | **added gh#66**, from residual [#182](https://github.com/ccmdesign/bfna-website-migration-2/issues/182). Nothing was ever authored here: a repo-wide `grep -rni careers` (excluding `node_modules`) returns no page file, no nav entry, no `menus` row and no content document — only the word inside four insight bodies, a comment in `pages/[program].vue` and sample data in `pages/bf-probe/36-bf-footer.vue`. No content to point at, so 410 rather than a guessed 301 |

---

## Verification

- **Page-file count vs. Section A rows**: `find pages -name "*.vue" ! -path
  "pages/wireframes/*" | wc -l` → 22; Section A lists 22 routes. **PASS**
- **Every `components/` dir classified in B**: `content`, `custom`, `docs`,
  `ds`, `legacy`, `templates` (`wireframe` correctly excluded, in-scope
  target set) — all present in Section B with a verdict. **PASS**

## Return shape

- routes to retire (18) · components to retire (≈45 files across
  legacy/custom/docs-tabs) · shared to keep (ds: 13, docs demos: 11, content
  pipeline: config+scripts+~490 JSON files)
- blocker: **none found** — wireframe pages/components have zero code
  dependency on `components/legacy/**`, legacy composables, or the Directus
  content pipeline; they read an independent static snapshot
  (`src/assets/wireframe-data/*.json`) and their own CSS (`public/css/*`,
  distinct from `public/css-legacy/*`)
- config touchpoints: 4 (nuxt.config prerender list, redirects middleware,
  search-index script + API, legacy-base.vue stylesheet hrefs)
- verification: PASS (both checks)
- artifact: `docs/ds-epic/02-legacy-retirement-inventory.md`
