# 58 — cutover-legacy-retire — Delete the legacy component + page stack

One-line objective: delete every file the audit in
`docs/ds-epic/02-legacy-retirement-inventory.md` §A/§B marks "retire",
explicitly preserving everything §B/§C marks "keep-shared".

## Context

Depends on #57 (redirects must be live before their source routes'
components disappear). Builds from `02-legacy-retirement-inventory.md`
§A (route table, 22 routes) and §B (component table). Provenance: BF-215;
02 §A, §B.

## Scope

- `src/components/legacy/**` in full:
  - `components/legacy/atoms/{Logo,LogoWhite}.vue` (§B row 1)
  - `components/legacy/molecules/*` — 14 files incl. `Card.vue`,
    `Hero.vue`, `ProductCard.vue`, `ProductCardWebsite.vue`,
    `ProductCardThin.vue`, `ProductHero.vue`, `Breadcrumb.vue`,
    `HighlightCard.vue`, `DocCard.vue`, `SplitSection.vue`,
    `VideoSection.vue`, `SimpleFilters.vue`, `AnnouncementCard.vue`,
    `PlatformNav.vue` (§B row 2)
  - `components/legacy/organisms/{Frame,Footer,MainNav,OffCanvas,Header}.vue`
    (§B rows 3–4; `Header.vue` has **0 usages anywhere**, already dead
    before this migration — delete regardless)
  - `components/legacy/templates/{HomepageUpdates,PeopleSection}.vue` (§B
    row 5)
- `components/templates/UpdatesPageTab.vue` (§B row 6, 0 usages after
  `updates.vue` is deleted below)
- `components/custom/projectCard.vue` (§B row 7 — **0 usages**, dead code)
- `components/docs/DocsTabs.vue` (§B row 8 — **0 usages**, dead code)
- `layouts/legacy-base.vue` (referenced by every §A row using it as
  `Layout`)
- Remaining legacy routes, i.e. every `pages/**` file listed in 02 §A
  **except** the four already deleted by #47/#48/#53/#54
  (`pages/index.vue`, the four `pages/{democracy,digital-world,
  future-leadership,politics-society}/index.vue`, `pages/about.vue`,
  `pages/search.vue`):
  - `pages/updates.vue`
  - `pages/archives/index.vue`
  - `pages/team.vue`
  - `pages/podcasts/index.vue`, `pages/podcasts/[slug].vue`
  - `pages/[...slug].vue`
  - `pages/blog/index.vue`, `pages/blog/[...slug].vue`
  - `pages/test.vue`, `pages/test-base-layout.vue`
  - the four now-empty `pages/{democracy,digital-world,future-leadership,politics-society}/` directories themselves, once their `index.vue` is gone (from #48)

## Out of scope

- `content/**` data (kept, see above).
- `components/content/**` prose components — 02 §B leaves this "unknown"
  (0 live usages today, but whether `/blog`/`/docs` prose ships content
  before the flip is undetermined); **do not delete speculatively** —
  leave for a future issue if a decision is made.
- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- **Explicitly kept — do not delete:**
  - `components/ds/**` (13 components, incl. `ccmTabs`/`ccmTable`) — zero
    dependency on `components/legacy/**` (02 §B, confirmed clean boundary).
    No `bf-*` work targets these.
  - `components/docs/**` and its demos (11 files under
    `components/docs/demos/*.vue`) — powers the kept `/docs` internal tool.
  - `server/api/component-docs/*.get.ts` — feeds `/docs`.
  - The Directus → `@nuxt/content` pipeline and its 12 collections
    (`content.config.ts`, root `directus/*.js`, `content/{workstreams,
    publications,videos,infographics,people,super_products,products,
    announcements,highlights,docs}/*.json`) — CMS layer, not legacy UI (02
    §C).
  - Everything under `pages/wireframes/**` and `components/wireframe/**`
    (D2) — **any deletion or edit here fails the epic** (DoD-4).
  - `pages/docs/**` and its layouts (`docs-layout.vue`, `demo.vue`) — the kept
    `/docs` route tree.

## Styling

N/A — deletion only, no new component surface.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test ! -d bfna-website-nuxt/src/components/legacy                          # gone (DoD-5)
test ! -f bfna-website-nuxt/src/components/templates/UpdatesPageTab.vue
test ! -f bfna-website-nuxt/src/components/custom/projectCard.vue
test ! -f bfna-website-nuxt/src/components/docs/DocsTabs.vue
test ! -f bfna-website-nuxt/src/layouts/legacy-base.vue
test ! -f bfna-website-nuxt/src/pages/updates.vue
test -d bfna-website-nuxt/src/components/ds                                # kept
test -d bfna-website-nuxt/src/pages/wireframes                             # kept, D2
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs | grep -q 200      # /docs still renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wireframes | grep -q 200 # /wireframes/* still renders
find bfna-website-nuxt/src/pages -path "*/pages/wireframes/*" | wc -l      # unchanged file count vs. pre-issue (DoD-4 proxy)
```

## Decisions

_Runner appends here._
