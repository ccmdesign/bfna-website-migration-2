# Content Inventory — Contentful vs Directus drift + GGS bucket evaluation

**Generated 2026-07-31** by item-level pull of both APIs (Contentful CDA space from `bfna-website/.env`, Directus `bfna.simplyas.com` `bfna_site` collections). Read-only; no writes. Raw data: [inventory.json](inventory.json) · per-item bucket sheet: [buckets.csv](buckets.csv) (442 rows).

Matching key: slugified `title` (Contentful) / `heading` (Directus) — **neither system has a slug field**. Archive cutoff: publish_date < 2023-07-31 (3-year rule).

## Headline findings

1. **Drift is purely additive — zero matched items were edited in Contentful after the Directus migration.** No field-level reconciliation needed for the 379 matched pairs; the worklist is only whole items missing from one side. (Caveat: Directus `videos`/`infographics` have no `date_updated` field, so edit-drift there is unverifiable by timestamp — but both are in full slug parity.)
2. **The 9 Contentful `news` cards are already superseded.** Directus `highlights` (8 rows) covers the same subjects (Lithium Rising, Indo-Pacific Nexus, Barometer indicator, Transponder…) in newer editorial copy. Recommendation: migrate nothing; retire `news`. (Answers Q12 from the data.)
3. **The "projects" bucket is polluted.** 61 items land there mechanically (type=website + super_products), but the real projects number ~14. The rest are yearly Fellowship "Class of 20XX" pages (17), participant pages, CEPI editions, and **podcast episodes stored as `products`** (~20 HTFD/Bridging the Atlantic/Wisdom of the Crowd episodes). Episodes belong in `insights` (or ride on `htfd_episodes`) — Q5 decides.
4. **Several "drift" items are renames, not adds/deletes**: `2020–2023 Participants` (C) ≈ `Class of 2020–2023` (D); generic super_product containers (`Editions`, `Episodes:`, `Latest Episodes`) were renamed to proper project names in Directus (`Wisdom of the Crowd`, `Leadership in Action`, `The Bertelsmann Foundation Fellowship`). Real net drift is smaller than raw counts suggest.

## Drift table (item-level, by slug)

| type (C→D) | C | D | only-C | only-D | matched | newer-in-C | notes |
|---|---|---|---|---|---|---|---|
| publication → publications | 175 | 185 | **9** | 19 | 165 | 0 | only-C = 2026 posts still landing on live site → **import** |
| video → videos | 43 | 43 | 0 | 0 | 43 | 0 | in sync |
| infographic → infographics | 48 | 55 | 0 | 7 | 48 | 0 | 7 post-migration Directus adds (2018–2020 backfill) |
| product → products | 121 | 117 | 5 | 6 | 111 | 0 | 4 of 5 only-C are renames; real only-C = "Authors" page |
| super_product → super_products | 8 | 8 | 4 | 4 | 4 | 0 | all 4 pairs look like renames — eyeball to confirm |
| workstream → workstreams | 8 | 8 | 0 | 0 | 8 | 0 | in sync |
| news → highlights | 9 | 8 | 9 | 8 | 0 | — | zero slug overlap, thematic overlap high → retire `news` |
| announcement → announcements | 1 | 1 | — | — | — | — | singleton, no heading field; eyeball |

Dupe slugs (same heading twice in one source): `democracys-canary-in-a-coal-mine` (1× dupe in both C and D — consistent); 5 product dupes in Contentful only (`green-ideas`, `federalism-in-crisis`, `no-collar-economy-vol-i/ii`, `transatlantic-trends-2021`) — Contentful's 121 is ~116 unique.

### Import worklist: 9 publications only in Contentful (all 2026, live-site additions)

A Kettle Full of Steam (05-26) · Germany One Year After Elections (02-26) · Meddle Meets Mettle (07-07) · Misplaced Passion, Myopic Policy (03-17) · Open Debate and Unlikely Bedfellows (06-12) · Seven Months to Midnight (02-09) · The Nuclear Option (07-21) · What Comes After Z? (05-27) · When Publics Portend Policy (03-03)

Plus: product "Authors" (only-C, type=report), announcement singleton diff, and the rename pairs to reconcile by hand. The 19 only-D publications (2016–2021) and 7 only-D infographics are presumed intentional post-migration additions — **keep, eyeball-confirm**.

## Bucket evaluation (union of both sources, 442 items)

Rules applied (Irene Jul 29 > GGS May 21 where they conflict): publications/videos/infographics → `insights`; products type=website + super_products → `projects`; products type=report/video → `insights`; news → highlights review. Program via old workstream FK: Democracy and Future Leadership as-is; Politics & Society → Transatlantic Relations & Global Challenges; Digital World → PENDING Q3.

| bucket | items | notes |
|---|---|---|
| insights | 364 | formats: article\|report split TBD (184 pubs), video (43+30 product-videos), infographic (55), report (41 product-reports) |
| projects | 61 | **~14 real** after pulling out episodes, Class-of pages, participant pages — see below |
| highlights | 17 | 8 keep (Directus), 9 retire (Contentful news) |

### Program distribution (union)

| program | items |
|---|---|
| Transatlantic Relations & Global Challenges (was Politics & Society) | 212 |
| Democracy | 75 |
| Future Leadership | 36 |
| **PENDING Q3** — Digital World (retired area) | **31** |
| **RE-TAG** — was fake category "Podcasts" | 43 |
| **RE-TAG** — was fake category "Archives" | 10 |
| **RE-TAG** — no workstream at all | 35 |

88 items (20%) have no usable program signal and need the heuristic/manual pass; 31 more wait on Q3. The concrete Digital World list (6 pubs, 8 videos, 6 infographics, 11 products — incl. the whole **Hidden Layers** series) is in buckets.csv; 27 of 31 are already archive-tier or undated, so "straight to archive" costs little.

### Tier distribution (3-year rule, cutoff 2023-07-31)

| tier | items |
|---|---|
| archive (3y+) | 295 (~73%) |
| active | 111 |
| unknown — no publish_date | 36 (mostly type=website project pages, which don't tier anyway) |

Confirms the 74% figure in [archive-content-plan.md](../archive-content-plan.md) against the live union.

### Projects bucket cleanup (the 61 → ~14)

- **Real projects present**: Barometer, Periscope, RANGE, How to Fix Democracy, Summer Enrichment Series, Fellowship (BFF), Leadership in Action, City Solutions Series, Wisdom of the Crowd, Bridging the Atlantic, plus super_product containers. Missing from CMS entirely: Astropolitics (only as "2025 - Astropolitics" class page), Indo-Pacific Nexus, Critical Minerals, Graphic Images, Election Analysis, Transponder Magazine, BFNA Documentaries — these exist only as insights/news references and **need new `projects` rows authored at migration**.
- **Podcast episodes stored as products** (~20): HTFD Season 5 + specials, Bridging the Atlantic Eps 1–6, Wisdom of the Crowd episodes → `insights` or `htfd_episodes` (Q5).
- **Class of 2010–2026 + Participants pages** (~21): fellowship-year subpages, not projects. Proposal: fold under the Fellowship project page (or archive) — flag for Irene.
- **CEPI 2010/2011, 100 Questions**: legacy one-offs, archive-tier candidates.

### Project-assignment heuristic (Pass 2 preview)

Keyword hints over headings tag only 49 of 364 insights (Election Analysis 11, Transponder 9, Critical Minerals 4, …). The heading-only heuristic is weak — the real pass should also use the old `super_products.products` M2M (episode→series links) and workstream=Podcasts membership. Expect a large "no project" remainder, which is legitimate: most standalone publications belong to no project.

## Implications for the pending questions

- **Q3 (Digital World)**: 31 items, list now concrete; 27/31 already archive-tier → low-cost to archive, re-tag only the 4 active ones (2 AI infographics, Hidden Layers latest, Hotspots).
- **Q5 (HTFD episodes)**: ~20 episode-products must move somewhere regardless — decision affects both migration and importer.
- **Q12 (news)**: data says highlights already superseded news; recommend retire without migration.
- **New question for Irene**: the 7 missing project pages (Astropolitics, Indo-Pacific Nexus, Critical Minerals, Graphic Images, Election Analysis, Transponder, Documentaries) have no CMS entries — confirm the ~14-project list and who writes their copy.
- **New question**: are the "Class of 20XX" pages kept as Fellowship subpages, archived, or dropped?

## Not done here (deliberately)

No writes anywhere; no asset audit (ctfassets.net URL sweep belongs to consolidation Phase 2); no docs/HTFD/Barometer collections (out of `bfna_site` scope); no field-hash diffing (unnecessary — timestamp evidence shows no edit drift).
