# BF-147 — IPN project page: fold in "Indo-Pacific in Focus" podcast

## Decision (Aug 4)
"Indo-Pacific in Focus" (podcast by Marshall Reid) is PART OF the Indo-Pacific Nexus
project, confirmed under TR&GC. There is no separate CMS row for the podcast (BF-149:
none was created to avoid fabricating content). So this item adds an **Episodes band**
to the IPN project page.

## Confirmed from data
- IPN slug: `indo-pacific-nexus` (projects.json). `kind: research-initiative`,
  `program: Transatlantic Relations & Global Challenges`, `external_url: null` → the
  page renders the **FULL project template** in `pages/wireframes/projects/[slug].vue`.
- Episode titles/descriptions are NOT in any CMS — they live in Word docs attached to
  Irene's May 11 email, not yet extracted.

## Approach — DATA-DRIVEN (preferred, chosen)
Rather than hardcoding IPN's slug in the template, add a placeholder `podcast` object to
the IPN row in `projects.json` and render an Episodes band generically whenever
`project.podcast` is present. Any future project carrying a podcast gets the band with
no template edit. This mirrors the existing `external_only` product-band pattern.

### 1. Data — `projects.json` (IPN row only)
Add:
```json
"podcast": {
  "title": "Indo-Pacific in Focus",
  "host": "Marshall Reid",
  "source_note": "Episode titles & descriptions pending extraction from Irene's May 11 docx.",
  "episodes": [
    { "title": "[Episode 1 — title pending, from Irene's May 11 docx]", "description": "[Description pending extraction from Irene's May 11 docx]" },
    { "title": "[Episode 2 — title pending, from Irene's May 11 docx]", "description": "[Description pending extraction from Irene's May 11 docx]" },
    { "title": "[Episode 3 — title pending, from Irene's May 11 docx]", "description": "[Description pending extraction from Irene's May 11 docx]" }
  ]
}
```
All rows read as OBVIOUS placeholders (bracketed, source-noted) — no fabricated titles.

### 2. Type — `useWfContent.ts`
Extend `WfProject` with an optional `podcast` field (title, host, source_note, episodes[]).
No new accessor needed — `projectBySlug` already returns the whole row.

### 3. Render — `[slug].vue` FULL template
Add a `wf-section` (label "Episodes", heading = podcast title) that renders when
`project.podcast` exists: host attribution line + source-note chip + a `<ul>` of
placeholder episode rows (title + description). Placed after the Participation path band,
before Cohorts. Only shows on projects that carry `podcast` data (i.e. IPN today).

## Notes / caveats
- `projects.json` is a wireframe snapshot refreshed from `_process` by contentImporter;
  a future refresh could drop this placeholder field. Acceptable for the wireframe per
  the card (episodes aren't real data yet). Flagged in the PR/comment.
- No `npm run generate` / `npm run build` (contentImporter overwrites data).
