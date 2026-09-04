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

### D-58.1 — `layouts/base.vue` is deleted too, which the Scope list does not name

`base.vue` `import`s `~/components/legacy/organisms/Frame.vue` and `Footer.vue` at
module scope. Those files are in scope, so the layout cannot compile once they are
gone, and its only consumer — `pages/test-base-layout.vue` — is itself in scope.
Deleting it is forced by the spec, not an extension of it. Nothing else names the
`base` layout (`grep -rn "layout: 'base'" src/` → one hit, the deleted page).

### D-58.2 — three layouts are left orphaned on purpose

`article-layout.vue` (sole consumer was `pages/blog/[...slug].vue`), `docs2.vue`
and `enhanced-hybrid.vue` (already zero consumers before this issue) now have no
caller. They import no legacy file, so they compile and cost nothing, and the
spec's Scope names exactly one layout. Left in place and handed off as a residual
rather than folded in, so the deletion set stays the one the inventory audited.

### D-58.3 — the composable deletion rule, and how each file was cleared

The spec names no composables. The rule applied was mechanical and verifiable:
delete `src/composables/legacy/**` (7 files) and every `src/composables/data/*`
that is **not** one of the six `useBf*.ts`, having first grepped each name across
`src/`, `scripts/` and `server/`. Every consumer found was itself deleted by this
issue, or another doomed composable (`useWorkstream` ← `useWorkstreamNavigation`
and `useHeroImage`, both dead), or nothing at all. `useHighlights` looked live —
it appears in `useBfInsights.ts` — but the hit is inside a prose comment citing it
as a pattern, not an import. 32 files, 0 surviving references (re-grepped after
deletion).

The five top-level `src/composables/use*.ts` are **kept**: `useSlugify` is used by
the retained `ccmCard`; `useExternalImage` keeps a vitest spec; `useContentItem`,
`useContentStream` and `useEnhancedDocumentation` were already orphaned before
this issue and are not part of the audited set.

### D-58.4 — residual #207: `src/server/**` deleted, `component-docs/index.get.ts` not ported

Nuxt 4 resolves `serverDir` to `<rootDir>/server` while `srcDir` is
`<rootDir>/src`, so nothing under `src/server/` has ever been scanned by Nitro.
All six files deleted. Both live counterparts were diffed first:

- `api/search.get.ts` — the live copy is a **different, older** implementation
  (proxies `SEARCH_BASE_URL`; the dead copy read `public/search.json`). Neither is
  reachable from a page any more: `/search` is the `bf-*` page, and the legacy
  `useSearch` composable that called `/api/search` is deleted here. The live file
  is under `server/` and out of this spec's scope, so it stays.
- `api/component-docs/[component].get.ts` — identical but for the import path.
- `api/component-docs/index.get.ts` — **no live counterpart, and deliberately not
  ported.** `pages/docs/index.vue` reads `import('~/public/component-docs/index.json')`
  and only `$fetch('/api/component-docs')` in the `catch`. That fallback has never
  resolved (the handler was in the unscanned tree), so porting it would *add* a
  behaviour this issue is not asked for. `/docs` renders from the static JSON, which
  is asserted in the acceptance run below.
- `api/contact.post.ts`, `api/test.get.ts` — zero callers, as 02 §C already noted.

`bfna-website-nuxt/CLAUDE.md` said "`src/server/`: Nitro API routes"; corrected in
the same commit, since item-runners read that file (D1).

### D-58.5 — residuals #206 and #208: a second prefix table, splat dropped

`LEGACY_REDIRECT_PREFIXES` appended the matched remainder to its target, which is
right for `/podcasts/:slug` → `/projects/:slug` and wrong for the two program
families: hubs are served by `pages/[program].vue`, which compiles to `/:program()`,
one segment, so `/digital-economy/foo` → `/transatlantic-relations-global-challenges/foo`
was a 301 into a 404 (#206). Rather than special-casing rows inside one table, a
second table — `LEGACY_REDIRECT_COLLAPSE_PREFIXES` — expresses the other shape,
`<from>/<rest>` → `<to>`:

| from | to |
|---|---|
| `/blog/*` | `/insights` |
| `/digital-economy/*` | `/transatlantic-relations-global-challenges` |
| `/future-of-work/*` | `/future-leadership` |

`/blog/*` is #208, decided the way that issue's second option suggests: the `blog`
collection has zero documents, so there is no `/insights/<blog-slug>` a splat could
reach, and `pages/blog/` is deleted here anyway. The splat is dropped rather than
run through `LEGACY_SLUG_MAP` because every slug that map knows is already reachable
at its own one-segment URL.

Both artefacts and both verifiers move together: the rule module, the middleware
(step 4b), `scripts/generate-legacy-redirects.ts` (emission **and**
`reservedSegments()`, so the collapsing prefixes stay reserved), and
`scripts/verify-legacy-redirects.ts` (static rows, live behaviour, and the
"no extra rules" count). `npm run redirects:generate` left `legacy-slug-map.ts`
byte-identical — 415 entries before and after — confirming the reserved set did not
move when seven page names disappeared from `src/pages`.

### D-58.6 — `scripts/verify-bf-logo.ts` reworked rather than left to crash

Issue 14's acceptance script compared `components/bf/Logo.vue` byte-for-byte
against `components/legacy/atoms/{Logo,LogoWhite}.vue` and asserted those two files
were **untouched, because deleting them is issue 58**. This is issue 58. The script
would have thrown `ENOENT` on its first `readFileSync`. Its exit contract counts a
skip as INCOMPLETE, so degrading the checks to skips would have left it failing
anyway. The legacy-relational assertions are therefore **removed** — a check whose
subject was deliberately retired is finished, not incomplete — the intrinsic half is
kept (15 `d`/`points` values, 13 path / 2 polygon / 1 rect, the `695.1 x 266.6`
viewBox, no `class="st0"`, one `<svg>`), and section 6 is inverted: it now asserts
that the two files and `components/legacy/` are **gone**, which is DoD-5.

`scripts/verify-css-classes.ts` also references `src/components/legacy`, but it was
already inert — its `LEGACY_DIR` points at `bfna-website-legacy/src/_includes`, a
sibling repo that does not exist in this checkout. Left alone; residual.

### D-58.7 — the catch-all's removal is what makes unknown paths 404

With `pages/[...slug].vue` gone, an unmatched single segment is rejected by
`pages/[program].vue`'s `definePageMeta({ validate })` and renders `src/error.vue`
under the `bf-default` shell. Measured on `nuxt dev`: `/definitely-not-a-legacy-slug-zzz`,
`/nope` and `/some-old-product-page` each answer **404** with
`<title>Page not found | Bertelsmann Foundation North America</title>` and
`<h1 class="bf-empty-state__heading">Page not found</h1>`, inside the real nav/footer
chrome. `.output/public/404.html` is the client-side fallback shell that hydrates the
same page. `src/error.vue` itself is untouched by this issue.

### D-58.8 — `/blog` survives in the build as a redirect stub, not a page

`.output/public/blog/index.html` still exists after the deletion. It is a four-line
`<meta http-equiv="refresh" content="0; url=/insights">` document, written by the
prerenderer when the middleware answered its crawl of `/blog` with a 301 — not a
leftover legacy page. It complements the `_redirects` row rather than competing
with it.

### D-58.9 — test-harness substitution (residual #86)

No vitest was added. The equivalent-strength checks are the existing
`npx tsx scripts/verify-legacy-redirects.ts` (both halves: 472 assertions, 0
failures against `nuxt dev`), `npx tsx scripts/check-probes.ts` (46 pages, 1675
rows, 0 failures) and the shell acceptance block above, all run before the PR opened.

