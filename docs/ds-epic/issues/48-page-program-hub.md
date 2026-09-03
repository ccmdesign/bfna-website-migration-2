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

### D-48.1 — `validate` returns a 404; it does not fall through to the catch-all

The scope note above says "`validate` failing is what lets Nuxt continue
matching to the legacy catch-all". **That mechanism does not exist.**
`nuxt/dist/pages/runtime/validate.js` (Nuxt 4.5.2) is a route middleware:

```js
const result = await Promise.resolve(to.meta.validate(to))
if (result === true) return
return createError({ fatal: import.meta.client, status: 404, ... })
```

vue-router has already resolved the match by then and does not resume; a
`false` result is a 404, not a re-match. `pages/[program].vue` compiles to
`/:program()`, which outranks `pages/[...slug].vue` (`/:slug(.*)*`) for every
one-segment path, so the legacy catch-all no longer answers any of them.

The **effect** the scope note and the acceptance both ask for — a non-program
one-segment path does not render the hub — is delivered either way, and the
acceptance is written against the effect. What changes is the status of six
one-segment paths that the catch-all used to answer:

| Path | Before | After | Note |
|---|---|---|---|
| `/insights` | hollow 200 | 404 | built for real by issue 49 |
| `/projects` | hollow 200 | 404 | built for real by issue 51 |
| `/archive` | hollow 200 | 404 | built for real by issue 52 |
| `/people` | hollow 200 | 404 | absorbed by `/about#team` (BRIEF §7) |
| `/careers` | hollow 200 | 404 | redirect map, phase 7 |
| `/bertelsmann-stiftung` | hollow 200 | 404 | redirect map, phase 7 |

"Hollow 200" is measured, not assumed: a baseline `npx nuxt generate` on `dev`
emits all six as the catch-all's empty shell — `<title>Content | Bertelsmann
Foundation</title>`, no product, no publication, ~47 KB of nav and footer
chrome around nothing. Paths with their own page file (`/about`, `/blog`,
`/search`, `/team`, `/updates`, `/podcasts`, `/docs`, `/archives`) rank above
`/:program()` and are unaffected — verified against a dev server: `/blog` still
returns 200 with the legacy page, `/careers` returns 404.

No fix is attempted here. Three of the six are routes later issues in this
epic build, and the rest belong to the redirect map
(`02-legacy-retirement-inventory.md` §E, issue 58) — which is exactly the
boundary BRIEF §5 rule 7 draws.

### D-48.2 — the Insights-band acceptance grep is replaced

The issue-specific acceptance runs
`grep -L "Insights" .output/public/future-leadership/index.html`. That check
can never match: `bfNav` and `bfFooter` render the site menus on every page,
and `menus.json` contains the labels "Insights", "All Insights" and
"Archive". The string is in all three hubs regardless of the band.

Substituted with an assertion on the band's own hook — `bfSection`'s
`data-label`, which is exactly the stable selector `SectionProps.label`
documents itself as:

```bash
cd bfna-website-nuxt
grep -c 'data-label="Recent insights"' .output/public/democracy/index.html                                  # 1
grep -c 'data-label="Recent insights"' .output/public/transatlantic-relations-global-challenges/index.html  # 1
grep -c 'data-label="Recent insights"' .output/public/future-leadership/index.html                          # 0
```

Measured result: `1 / 1 / 0`. Stronger than the original, which would have
reported a pass for a page that had lost the band *and* one that had never
had it.

### D-48.3 — the Democracy 2026 filter stays a page-level rule

The frozen `[area].vue` limits the Democracy hub's insights to 2026 releases
(Irene, Aug 5 widget feedback), scoped to that one hub. Ported verbatim, and
kept **in this page** for the same two reasons D10 keeps `showInsights` here:

1. There is no field to promote it to. `bfInsightSchema` has `publish_date`,
   `archived`, `evergreen`, `featured` and `retired_news` — nothing that says
   "this hub shows one year", and inventing one would write a client's
   editorial decision into `content/bf/insights/*.json` with no upstream
   authority (BRIEF §5 rule 10).
2. It is one predicate, read once per render, at the only call site that has
   it. `useBfInsights.activeByProgram` stays what it says it is.

Parity is measured against the frozen wireframe's own output, band for band:

| Hub | project cards (bf / wf) | insight cards (bf / wf) |
|---|---|---|
| `democracy` | 4 / 4 | 1 / 1 |
| `transatlantic-relations-global-challenges` | 6 / 6 | 9 / 9 |
| `future-leadership` | 3 / 3 | no band / no band |

### D-48.4 — `PROGRAM_SLUGS` is derived from the collection source, in its own module

`src/utils/bf-programs.ts` reads the three slugs with
`import.meta.glob('../../content/bf/programs/*.json', { eager: true, import: 'slug' })`
— the files `content.config.ts` registers as `bfPrograms` — so the list is
written down exactly once, in the content, and Vite resolves it at build time
into three strings with no runtime file read.

`useBfPrograms()` itself cannot be the source: `validate` is a route guard that
runs before the page's setup, and awaiting `queryCollection` there would make
every navigation on the site wait on the content layer.

It is a separate module rather than a `const` in the page because
`nuxt:pages-macros-transform` re-emits `pages/*.vue?macro=true` as the
`definePageMeta` object plus only the top-level declarations and imports that
object references. A bare import is the shape that extraction carries most
simply, and it keeps the glob in a module Vite processes in normal plugin
order rather than inside a post-enforce rewrite of an SFC.

### D-48.5 — the archive link targets `/archive`, and the page sets its own title

The frozen source's second Insights link is
`/wireframes/insights?area=<slug>&archive=1`, because the wireframe's archive
is a query flag on its insights index. In the final IA the archive is its own
route (BRIEF §7), so the link is `/archive`. The counter it carries is
unchanged (`archivedCountByProgram`).

`useHead({ title: () => program?.name })` is set here, unlike `pages/index.vue`
which deliberately sets none: `bf-default`'s `titleTemplate` documents that
"every `/` page sets its own title" and reserves the bare-site-name branch for
the root. The three hubs render `Democracy | …`,
`Transatlantic Relations & Global Challenges | …`, `Future Leadership | …`.

### D-48.6 — verification actually run

| Gate | Result |
|---|---|
| Typecheck, no new errors | 176 `error TS` before, **176** after; **0** in `src/(components/bf\|types\|composables/bf)` / `content.config` |
| `npx nuxt generate` | exit 0, 994 routes |
| 3 hubs prerender | all three `index.html` present |
| Insights band conditional | `1 / 1 / 0` (D-48.2) |
| `/not-a-program` is not the hub | dev SSR **404**; static build emits no such file (404 from the server) |
| `npx tsx scripts/check-probes.ts` | **PASS — 38 probes, 1632 rows, 0 failures** |
| Wireframe byte-identity from the pre-epic base | empty |

No probe page is added: this issue's acceptance runs against the generated
site, not a component in isolation, and BRIEF's probe rule applies to
component issues.
