# 48 — page-program-hub — Program hub `/{program}`

One-line objective: build `src/pages/[program].vue` on `bf-default`, gated by
`definePageMeta({ validate })` to the three real program slugs so it never
swallows other one-segment routes before the redirect map (#57) lands.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #42 (`bfGridProjects`),
#33 (`bfEmptyState`), #12 (`useBfProjects`/`useBfPrograms`). Descends from
`src/pages/wireframes/[area].vue`. Provenance: BF-198; **D10** (Insights band
conditional per hub). Deletes exactly the four legacy workstream index pages
whose routes this single dynamic page absorbs: `pages/democracy/index.vue`,
`pages/digital-world/index.vue`, `pages/future-leadership/index.vue`,
`pages/politics-society/index.vue` (`02-legacy-retirement-inventory.md` §A,
rows `/democracy`, `/digital-world`, `/future-leadership`,
`/politics-society`) — no other legacy file. All other legacy retirement
(the `Frame.vue`/`MainNav.vue` links pointing at those routes, the
`legacy-base` layout, etc.) stays in #57/#58.

## Scope

- `src/pages/[program].vue`, `definePageMeta({ layout: 'bf-default' })`.
- **`definePageMeta({ validate: (route) => PROGRAM_SLUGS.includes(route.params.program as string) })`**
  where `PROGRAM_SLUGS` is the const list of the three final program slugs
  (`democracy`, `transatlantic-relations-global-challenges`,
  `future-leadership` — BRIEF §4 D-series decision, final; cross-check
  against `useBfPrograms().programs` at build time, not hand-typed twice).
  **This is load-bearing, not decorative**: without it,
  `[program].vue` matches every one-segment path (`/insights` would already
  be shadowed by #49, but any *other* not-yet-migrated one-segment legacy path —
  e.g. a stray `/blog` before its redirect exists — falls through to this
  page instead of Nuxt's route-matching moving on to the legacy catch-all
  `pages/[...slug].vue`, which is still live until #58). `validate` failing
  is what lets Nuxt continue matching to the legacy catch-all.
- Section order, from `pages/wireframes/[area].vue`:
  1. `<bf-page-header label="Hub intro" :crumbs="[{label:'Home',to:'/'},{label:'Programs'}]" :heading="program.name" :tagline="paragraphs(program.intro)">` with a "#projects" primary CTA button.
  2. "Projects in this area" — `<bf-section id="projects" label="Projects in this area" heading="Projects">` wrapping `<bf-grid-projects :projects="gridProjectsByProgram(program.name)" />`.
  3. **Insights band, conditional per hub (D10)** — see below.
  4. `<bf-empty-state>` fallback when `validate` still let a request through with no matching program doc (defensive; primary 404 path is `validate` failing → framework 404/legacy fallback).
- **D10 conditional-Insights decision**: the as-built `[area].vue` computes
  `showInsights = area?.slug !== 'future-leadership'` — a **hard-coded slug
  check in the page**, not a data flag. `bfPrograms` (from #09) has no
  `show_insights`/`has_insights`-style field in the audited schema
  (`01-data-layer-audit.md` §D only lists `slug, name, intro, image` on
  `WfProgram`, and `programs.json` itself carries no such flag). **Decision
  recorded here (brief §5.7 escalation not needed — this is documentable
  without a human call): keep the slug check** (`program.slug !==
  'future-leadership'`) in this page, not the normaliser, because (a) no
  source field exists to promote and inventing one means writing synthetic
  data into `content/bf/programs/*.json` with no upstream authority, and
  (b) it is a single boolean read once per render, not logic duplicated
  elsewhere. If a future program needs the same exclusion, promote this to
  a normaliser-emitted flag then — not preemptively.
- Composable → prop map: `useBfPrograms().programBySlug` → page header
  `heading`/`tagline`; `useBfProjects().gridProjectsByProgram` →
  `bfGridProjects.projects`; `useBfInsights().activeByProgram` →
  `bfGridInsights.insights` (inside the conditional band).
- Consumes collections: `bfPrograms`, `bfProjects`, `bfInsights`.

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- The removed "Other programs" cross-links row (BF-173, killed per D3).
- Tabs.
- Any legacy file beyond the four named workstream index pages.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `bfGridProjects`/`bfGridInsights` bring their own
  `.grid[data-min-width]` (D9) — no inline columns on this page.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
for p in democracy transatlantic-relations-global-challenges future-leadership; do test -f "bfna-website-nuxt/.output/public/$p/index.html" || echo "MISSING $p"; done   # all 3 hubs prerender
grep -L "Insights" bfna-website-nuxt/.output/public/future-leadership/index.html   # future-leadership renders WITHOUT an Insights band
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/not-a-program | grep -qv 200   # a non-program one-segment path does NOT render the hub (validate blocks it)
grep -n "definePageMeta({ validate" bfna-website-nuxt/src/pages/\[program\].vue   # validate present, restricted to program slugs
```

## Decisions

_Runner appends here._
