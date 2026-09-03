# 50 — page-insight-detail — Insight detail `/insights/:slug`

One-line objective: build `src/pages/insights/[slug].vue` on `bf-default`
with the header/banner/body/related section stack, prerendering all 354
insight slugs.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #45 (`bfProse`), #42
(`bfGridInsights`), #41 (`bfNotice`), #33 (`bfEmptyState`), #11
(`useBfInsights`). Descends from
`src/pages/wireframes/insights/[slug].vue`. Provenance: BF-201. No legacy
file retired — the nearest legacy analog (`pages/[...slug].vue`'s
publication/video/infographic branch) is retired by #58, redirected by #57.

## Scope

- `src/pages/insights/[slug].vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/insights/[slug].vue`:
  1. `<bf-page-header label="Insight header" :crumbs="crumbs" :chips="chips" :heading="insight.heading">` with author line + `<bf-time :date="insight.publish_date" />` in the default slot.
  2. Archive banner, conditional — `<bf-notice v-if="insight.archived" variant="…">` replacing the raw `wf-note` (`<p class="wf-note">{{ bannerText }} …</p>`), same banner copy source (`pageBySlug('archive-banner')` via #13's `useBfPages`).
  3. Body — `<bf-section label="Body" measure="narrow">`: excerpt dek (`<p><em>{{ excerpt }}</em></p>`, plain string, no `plain()` — HTML strip/decode already happened in the normaliser per D3), `<bf-media :src="insight.image" :alt="insight.heading" ratio="16/9" />`, `<bf-prose :content="insight.content" />`, conditional download link.
  4. Related insights — `<bf-section label="Related insights" :heading="\`More on ${insight.program}\`">` wrapping `<bf-grid-insights :insights="related" />`.
  5. `<bf-empty-state>` for an unknown slug — replaces the wireframe's raw `<div class="center | stack">` block (as-built D.1 finding #1).
- Route param resolution: `useBfInsights().bySlug(route.params.slug)`;
  related items via `useBfInsights().activeByProgram(insight.program)`
  filtered to exclude self, sliced to 3.
- Composable → prop map: `bySlug(slug)` → page-header
  `heading`/`chips`/author; `.content` → `bfProse.content`; `.image` →
  `bfMedia.src`; `activeByProgram(...)` → `bfGridInsights.insights`.
- Consumes collection: `bfInsights` only (plus `bfPages` for the archive
  banner copy row, via `useBfPages`, #13).
- Nuxt prerender: this route needs its 354 slugs enumerated — that's #59's
  `nitro.prerender.routes` config job, not this issue's; this issue only
  needs the page to render correctly per-slug when crawled.

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Comments, sharing widgets, prev/next navigation.
- A byline unless the data actually carries an author (`insight.authors`).

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `measure="narrow"` on the Body `bfSection` (matches wireframe).

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
find bfna-website-nuxt/.output/public/insights -maxdepth 1 -type d | wc -l   # 354 (+1 for insights/index) prerendered slug dirs
grep -q "wf-note\|Archive banner" bfna-website-nuxt/src/pages/insights/\[slug\].vue && grep -q "bf-notice" bfna-website-nuxt/src/pages/insights/\[slug\].vue   # archived insight uses bfNotice, not a raw <p>
! grep -n "plain(" bfna-website-nuxt/src/pages/insights/\[slug\].vue          # `plain()` appears nowhere in the page (D3: strip/decode moved to the normaliser)
```

## Decisions

**D-50.1 — the breadcrumb gets a third entry.** The frozen page's trail is
`Home → Insights`, both linked. `bfBreadcrumb` (#20) treats the **last** entry
as the current page and never renders it as a link — `aria-current` is
positional there, not a function of `to` — so porting the two-entry trail
verbatim would have announced the *feed* as the page the reader is on and
dropped the only link to it. The trail is therefore
`Home → Insights → <heading>`, with the third entry carrying no `to`.

**D-50.2 — the programme value is not always a programme, and the page never
shows one that isn't (F3 of BF-218).** 52 of the 354 items carry a `program`
that is not one of the three: `PENDING-Q3 (Digital World retired)` (31),
`RE-TAG (was fake category: Podcasts)` (12), `RE-TAG (was fake category:
Archives)` (9). These are migration signals addressed to the client.

The page resolves `insight.program` against the `bfPrograms` rows once, and
three things hang off that single answer:

| Surface | Real programme | Anything else |
|---|---|---|
| Header chip | the programme name | **no chip** |
| Archive-banner forward link | `/{program-slug}` | **no link** |
| Related-band heading | `More on {name}` | `More insights` |

The related band itself still renders, because those 52 items do have siblings
and cutting the onward journey is a worse answer than a generic heading — but
only when the list is non-empty, so a lone item grows no empty band. Asserted
over all 83 prerendered detail pages (20 of them non-programme): no `More on`
heading and no raw `PENDING-`/`RE-TAG` string reaches the HTML.

**D-50.3 — the byline renders only when the data carries an author.** The
frozen page writes `By [author]` when `authors` is empty; that is wireframe
scaffolding, and the issue's "out of scope" line is explicit that a byline is
in scope only when the data has one. So `bfByline` (#38) renders for the rows
that do (23 of the 83 prerendered), and a bare `bfTime` for the rest. Both
render nothing when there is nothing to say, so a row with neither author nor
date grows no empty meta row.

**D-50.4 — the 8 `featured` highlight records render the empty state, and that
is the correct behaviour here.** `useBfInsights().bySlug` searches `items` —
the 354 — which by #11's contract excludes the 17 highlight records
(8 `featured`, 9 `retired_news`). `bfCardFeatured` (#23) nevertheless links its
cards at `/insights/${slug}`, so the homepage's featured strip points at eight
slugs this page cannot resolve.

The fix is **not** to widen `bySlug`. All eight featured records carry
`content: null` and a populated `external_url` (`bfnadocs.org`,
`indo-pacificnexus.org`, Spotify, `bfna.org`): they are promos for material
that lives elsewhere, and several promote an item that already has its own
detail page under its own slug (`new-publication-lithium-rising-…` promotes
`lithium-rising-the-race-for-critical-minerals`). Rendering them here would
produce a body-less page — `bfProse` would print its `[body copy]`
placeholder — and duplicate an existing URL. The link target belongs to
`bfCardFeatured`, and the finding is handed off as a residual against it.

**D-50.5 — an unknown slug renders the empty state at HTTP 200, not a 404.**
The issue asks for "the empty state with one `h1`" and says nothing about
status. On the static host an un-prerendered path never reaches this page at
all, so the branch exists for the crawler and for client-side navigation;
promoting it to `createError({ status: 404 })` would be a behaviour change the
issue does not ask for. Verified in the prerendered output: five such paths were
crawled (four from probe fixtures, one `retired_news` record) and each rendered
`bf-empty-state` with exactly one `<h1>`.

**D-50.6 — the two link targets the wireframe could not have.** The archive
banner's forward link is `/{program-slug}` (the frozen page writes `href="#"`),
and the download button is `insight.download`, the real Directus asset URL,
marked `external` (the frozen page writes `href="#"` there too).

**D-50.7 — prerender coverage is #68's, and this issue records the number.**
`npx nuxt generate` emits **83** `/insights/<slug>` directories, not 354: the
crawler reaches detail pages through links, and `/insights`' `bfLoadMore` hides
all but the first 24. The issue's own Scope section says the 354-route
enumeration is `nitro.prerender.routes` work belonging to #59/#68, "not this
issue's"; this issue verifies per-slug correctness instead. Verified beyond the
crawl on the dev server: `uncivil-war-2` and `uncivil-war` resolve to **different
documents** (Oct 2020 / Jan 2021) — slugs are unique since #151 — and
`the-end-of-panda-politics` renders the archive banner and the download button.

**D-50.8 — test-harness substitution (#86).** The vitest harness on `dev` is
broken and pre-existing, so acceptance does not name a vitest test. In its place
this issue asserts, over **every one of the 83 prerendered detail pages**:
exactly one `<h1>`; no `wf-note` in the output; the `Archive banner` section
present iff `archived` and containing a `.bf-notice`; no `More on` heading and
no raw programme string on the 20 non-programme rows; and `bf-empty-state` on
every unresolvable slug. Plus the issue's own three greps, the full
`npx tsx scripts/check-probes.ts` (38 probes, 1635 rows, 0 failures) and the
typecheck gate (176 errors, equal to the branch baseline; 0 in
`components/bf`, `types`, `composables/bf`, `content.config`). No new probe
page: the issue calls for none.

