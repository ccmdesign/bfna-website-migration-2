# Top Navigation Proposal (Front 2 input)

**Generated 2026-07-31** from the content inventory ([inventory/drift-and-buckets.md](inventory/drift-and-buckets.md)) + GGS docs. Conflict rule applied: Irene Jul 29 (3 programs) > GGS Site Flow May 21 > GGS Strategy Feb 20. Per GGS's own strategy ("prioritize pathways over comprehensive listings"), their enumerate-everything nav sketch is pruned. Labels final per Irene Jul 31: "**Programs**" (3, top level) / "**Projects**" (within them).

## 1. Top Nav

| Top link | Dropdown items |
|---|---|
| **About** | Mission (top of page) · Board of Directors · Team · Bertelsmann Stiftung · Contact |
| **Programs** | Democracy · Transatlantic Relations & Global Challenges · Future Leadership |
| **Projects** | Transatlantic Barometer ↗ · Transatlantic Periscope ↗ · RANGE ↗ · How to Fix Democracy · BFNA Documentaries ↗ · Fellowship (BFF) · Transponder Magazine · **All Projects →** |
| **Insights** | All Insights · Articles · Reports · Videos · Infographics · **Archive** |
| Search (icon) | — |
| **Subscribe** (CTA button) | — |

Pruning decisions vs GGS sketch: 4 top-level areas → 3 programs (Irene); their 4-item projects dropdown (GGS "Programs") omitted Fellowship/HTFD — restored, flagships only + index (full ~15 would bloat the dropdown); Transponder moved from Insights (it's a magazine = project, not a format); "Archives" stays but as the last Insights item, not a sibling content type; format links are **filters on one /insights feed**, not separate page templates. ↗ = external microsite, signaled per GGS.

## 2. Content per page (3y rule applied: active = publish_date ≥ 2023-07-31)

Working totals: **96 active insights** / 268 archived (by year 2007–2023). Caveats: 16 active items still need re-tagging (mostly ex-"Podcasts"), 4 active are Digital World (Q3), and the article-vs-report split on 66 publications is TBD — per-program counts will shift a little.

### Home `/` (order per Claudio Jul 31, aligned to GGS identity-first template)
- Hero: GGS value prop ("Strengthening the Transatlantic Relationship") — tall/prominent
- 3 program cards
- Featured projects (4–6, `featured` flag)
- Insights: featured strip (the 8 published Directus `highlights`) + ~6–9 most recent of the 96 active
- Subscribe CTA

### About `/about`
- Mission + institutional copy (Irene's Jul 29 docx text — GGS copy never delivered)
- Board of Directors + Team (existing `people` collection)
- Bertelsmann Stiftung cross-link · Contact

### Program hubs `/[slug]` (3 pages: intro + projects + active insights, per GGS hub template)
| Hub | Projects (provisional assignment) | Active insights today |
|---|---|---|
| Transatlantic Relations & Global Challenges | Barometer ↗, Periscope ↗, RANGE ↗, Astropolitics, Indo-Pacific Nexus, Critical Minerals | **57** (47 articles/reports TBD, 7 reports, 2 videos, 1 infographic) |
| Democracy | How to Fix Democracy, City Solutions Series, Election Analysis, Graphic Images | **12** (10 articles/reports, 2 videos) — most of the 16 re-tag actives (podcast eps) likely land here |
| Future Leadership | Fellowship (BFF), Summer Enrichment Series, Leadership in Action | **7** (4 articles/reports, 3 videos) — thin; hub leans on projects + Class-of content |

Each hub: intro paragraph (GGS requirement), project cards, active insights list (archive reachable via filter, not shown by default).

### Projects index `/projects`
- All ~15 projects grouped by program; external-link badges on Barometer/Periscope/RANGE/Documentaries/(Transponder?)
- 7 projects have **no CMS entry yet** (Astropolitics, Indo-Pacific, Critical Minerals, Graphic Images, Election Analysis, Transponder, Documentaries) — rows authored at migration

### Project page `/projects/[slug]`
- Overview + participation path CTA (GGS template), external microsite link where applicable
- Related insights via M2M (active first, archive collapsed)
- Fellowship page absorbs the ~21 "Class of 20XX"/Participants pages (pending Irene)
- HTFD page: episodes surface here (feed inclusion = Q5)

### Insights feed `/insights`
- Default view: **96 active items**, newest first
- Filters: format (66 articles/reports pending split · 16 reports · 11 videos · 3 infographics) × program × project
- "Include archive" toggle reveals the 268 archived (labeled)
- Note: only 3 active infographics — the format nearly stopped in 2020; flag to Irene before giving it a nav slot

### Archive `/archive`
- 268 archived insights grouped by year: 2023 (27) · 2022 (28) · 2021 (28) · 2020 (41) · 2019 (32) · 2018 (21) · 2017 (10) · 2016 (34) · 2015 (27) · 2014 (15) · 2007 (1) + 4 undated
- Chronological (curated "notable work" strip = Q10); every item indexed, no noindex; item pages carry archive banner
- `evergreen` exemptions pull items back out of here (list TBD, Q9)

### Search + Subscribe
- Search: all 364 insights + projects + institutional pages; archive results labeled
- Subscribe: real signup form → Mailchimp (Q13)

## Pending answers that would move this nav
Q5 (HTFD episodes in feed) · Q6 (Transponder active?) · Q10 (archive curation) · Q3 (the 4 active Digital World items' new home).

**Signals from Irene's doc (Jul 31 2026, noted by Claudio):**
- **Q1**: her copy consistently says "Projects" (e.g. "Projects – Democracy") — weight toward her "Projects" over GGS's "Programs" for the nav label. Not yet confirmed as final. **Wireframes flipped to "Projects" as the working label (routes `/projects/*`) on Jul 31.**
- **Q1 RESOLVED (Irene email, Jul 31):** top level = "**Programs**" (3), things within = "**Projects**" — BFNA internal language, clarified with GGS. Adopted the same day across wireframes, scoping docs, and data files (projects routes `/projects/*`; the 3 program hubs at `/[slug]`). Supersedes the earlier same-day wireframe-feedback resolution that kept "Focus Areas".
- **Q6/Q7 status**: her doc contains NO copy for BFNA Documentaries or Transponder Magazine — the only two projects still without descriptions. Both remain genuinely open (Q7's page *pattern* is decided — thin page + microsite CTA — but whether/what to publish is not).

**Resolved — Q4/Q7 (Claudio, Jul 31 2026):** microsite projects (Barometer, Periscope, RANGE, Documentaries) get thin on-site project pages with the microsite as the primary CTA — per GGS recommendation. Not pure link-outs.
