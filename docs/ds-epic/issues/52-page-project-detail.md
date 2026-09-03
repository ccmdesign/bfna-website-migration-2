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

_Runner appends here._
