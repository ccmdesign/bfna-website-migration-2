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

_Runner appends here._
