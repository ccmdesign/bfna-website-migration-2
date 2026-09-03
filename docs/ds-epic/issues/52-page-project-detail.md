# 52 — page-project-detail — Project detail `/projects/:slug`

One-line objective: build `src/pages/projects/[slug].vue` on `bf-default`
with both wireframe branches — external (microsite CTA) and full (body +
episodes + cohorts).

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #45 (`bfProse`), #40
(`bfCtaSection`), #42 (`bfGridInsights`), #16 (`bfChip`), #33
(`bfEmptyState`), #12/#11 (`useBfProjects`, `useBfInsights`). Descends from
`src/pages/wireframes/projects/[slug].vue`. Provenance: BF-206. No legacy
file retired — the legacy `/podcasts/:slug` and `/:slug*` product branch
both redirect here via #57; deletion of those page files is #58's job.

## Scope

- `src/pages/projects/[slug].vue`, `definePageMeta({ layout: 'bf-default' })`.
- Branch on `project.external_url`, exactly as the wireframe does:
  - **External branch**: `<bf-page-header label="Project overview (external)" :crumbs :chips :heading :tagline="overview" />` → Microsite CTA (`<bf-cta-section label="Microsite CTA" heading="Explore the full project" :message="project.microsite_cta" :ctas="[{label:\`Visit ${project.heading}\`, href:project.external_url, external:true}]" />`) → Participation path (`<bf-cta-section label="Participation path" :heading="participation.title" :ctas="participation.ctas.map(l => ({label:l}))" />`) → Related insights (`<bf-section label="Related insights"><bf-grid-insights v-if="related.length" :insights="related.slice(0,6)" /></bf-section>`).
  - **Full branch**: `<bf-page-header label="Project overview" :crumbs :chips :heading><bf-media :src="project.image" :alt="project.heading" ratio="21/9" /></bf-page-header>` → Body (`<bf-section label="Project body" measure="narrow"><bf-prose :content="project.description ?? project.excerpt" /></bf-section>`) → Participation path (same `bfCtaSection` as above) → conditional Episodes band (`v-if="project.podcast"`, `bfSection` listing `project.podcast.episodes` — host/source-note copy, `bfChip` for the placeholder marker) → conditional Outcomes/alumni band (`v-if="cohorts.length"`, `bfChip` per cohort from `projectChildren(slug)`) → Related insights (same as external branch).
  - Unknown slug → `<bf-empty-state>` (replaces the raw `<div class="center | stack">` block, as-built D.1 finding #1).
- Composable → prop map: `useBfProjects().projectBySlug` → page-header +
  body props; `useBfProjects().projectChildren` → cohort `bfChip` list;
  `useBfInsights().insightsForProject` → `bfGridInsights.insights`.
- Consumes collections: `bfProjects` (incl. `projectChildren`), `bfInsights`
  (`insightsForProject`).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- An audio player for the Episodes band (text-only, matches wireframe).
- A podcasts index route — that legacy route resolves to 410 per
  `02-legacy-retirement-inventory.md` §E, handled in #57, not built here.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `measure="narrow"` on the Body section; `ratio="21/9"` on the
  header media (matches wireframe exactly).

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
# pick one known external-only project slug and one known full project slug (from projects.json)
test -f bfna-website-nuxt/.output/public/projects/<external-slug>/index.html
test -f bfna-website-nuxt/.output/public/projects/<full-slug>/index.html
grep -q "Microsite CTA" bfna-website-nuxt/.output/public/projects/<external-slug>/index.html    # external branch band present
grep -q "Project body" bfna-website-nuxt/.output/public/projects/<full-slug>/index.html          # full branch band present
grep -Lq "Episodes" bfna-website-nuxt/.output/public/projects/<full-non-podcast-slug>/index.html # conditional band absent when project.podcast is empty
```

## Decisions

**D-52.1 — no project can reach the Episodes band today, and the band ships
anyway.** `indo-pacific-nexus` is the only one of the 38 `bfProjects` rows
carrying a `podcast` object (BF-147). It also carries
`external_url: "#ipn-microsite-url"`, and the frozen source branches on
`external_url` **first** — so IPN renders the external template, where the
Episodes band does not exist, and the band is unreached on every one of the 38
pages. The band is still built exactly as specified: the spec pins the branch
order ("exactly as the wireframe does"), and the band is data-driven, so it
appears with no template edit the moment a row carries a `podcast` without an
`external_url` — or the moment the client turns IPN's placeholder into a real
microsite and the project is re-templated. Reordering the branches to reach it
would be a content decision taken inside a template; handed off as a residual
instead. The acceptance below therefore asserts the band's **absence**
everywhere rather than its presence somewhere.

**D-52.2 — the two `#…` external URLs render as stored.** `astropolitics`
(`#astropolitics-microsite-url`) and `indo-pacific-nexus` (`#ipn-microsite-url`)
carry placeholder microsite addresses. Suppressing the CTA would hide the gap
from the client and inventing a URL would ship a broken promise, so both render
as given, `external` included — a visible, greppable "not filled in yet".

**D-52.3 — the cohort chips link to the cohort pages.** The frozen source
writes `<wf-chip href="#">` because in the wireframe cohort pages had no route.
They have one now — they are `bfProjects` documents with a `parent_project`,
and this very file serves them — so each chip is a `NuxtLink` to
`/projects/<child-slug>`. Side effect, confirmed in the build: the 15
`class-of-*` pages are now crawler-reachable and prerender, where before the
run they did not.

**D-52.4 — an orphaned `parent_project` is an ordinary render (BF-218 F4).**
`cepi-2010` and `cepi-2011` name a parent, `cepi`, that is not in the
collection. Nothing on this route dereferences `parent_project`: the page reads
*children* (`projectChildren`), never a parent, so an orphan renders as a
childless full-template project. `cepi-2010` is named in the acceptance because
the failure mode this guards against — resolving a parent for a crumb or a
back-link — is the obvious thing a later edit would add.

**D-52.5 — the Related insights band is guarded, the frozen source's grid is
not.** The frozen source renders the `<wf-section>` unconditionally and puts
`v-if="related.length"` on the grid inside it, which leaves a heading over
nothing on the 31 rows with no related insights. The guard moves out to the
band, matching `/insights/:slug` (#50) and `pages/[program].vue`.

**D-52.6 — folded residual #186: `bfProse` renders nothing for an empty body.**
Decided here for every template at once, because this route hits it the same way
`/insights/:slug` does. `src/components/bf/Prose.vue` no longer emits the
`[body copy]` placeholder (or an empty `<p>`) when `content` is null or empty;
97 of the 354 `bfInsights` rows and 3 `bfProjects` rows (`2022`, `2023`, `2024`)
store a null body — video and infographic items, where the media *is* the body —
and every one of those pages was printing wireframe scaffolding to a reader.
Option 1 of the three the residual offered: no new prop, one behaviour, nothing
for a call site to get wrong. The frozen `wfProse` keeps its own placeholder
(D2), so the two renderers now differ here on purpose, and probe 45's two
empty-content rows assert the new behaviour by the same two rows that used to
assert the old one. Verified: `grep -ro 'body copy' .output/public/projects
.output/public/insights` returns 0 matches after the change.

**D-52.7 — folded residual #188: `/insights` gains its current crumb.**
`pages/insights/index.vue` passed a one-entry trail, and `bfBreadcrumb` treats
the last entry as the current page positionally (#20), so the feed was shipping
`<span aria-current="page">Home</span>` and no link at all. Now
`[{ Home, / }, { <the feed's own heading> }]`, the same shape `/projects` (#51)
and both detail routes build. Verified in `.output/public/insights/index.html`.

**D-52.8 — test-harness substitution (residual #86).** The vitest harness on
`dev` is broken and pre-existing, so acceptance is the generated output plus the
probe harness, per the #109 decision and the gh#20–#60 precedent:
`npx tsx scripts/check-probes.ts --only 45` and the full `check-probes` run,
both exit 0 (38 probes, 1635 rows, 0 failures).

### Acceptance as run

```bash
cd bfna-website-nuxt
npx nuxt typecheck   # 176 `error TS` — equal to the dev baseline, 0 in the bf scope
npx nuxt generate    # exit 0, 1188 routes
npx tsx scripts/check-probes.ts --only 45
npx tsx scripts/check-probes.ts
```

| slug | branch | bands rendered |
|---|---|---|
| `transatlantic-barometer` | external | Project overview (external), Microsite CTA, Participation path |
| `indo-pacific-nexus` | external, carries `podcast` | the same three — **no Episodes band** (D-52.1) |
| `leadership-in-action` | full | Project overview, Project body, Participation path, Related insights |
| `the-bertelsmann-foundation-fellowship` | full, 15 children | + Outcomes / alumni |
| `cepi-2010` | full, orphaned parent | Project overview, Project body, Participation path |
| `2022` | full, null body | Project body band present and **empty** — no `[body copy]` |

`Episodes` appears on 0 of the 38 prerendered project pages; `body copy`
appears on 0 pages under `/projects` and `/insights`; each page holds exactly
one `<h1>`.

### Known gaps, not fixed here

- `wisdom-of-the-crowd` and `cepi-2011` have routes but no inbound link
  anywhere on the site, so the crawler never reaches them and they do not
  prerender. Both are archived / grid-pruned rows. Out of this issue's scope
  (it builds the template, not the link graph); raised as a residual.

