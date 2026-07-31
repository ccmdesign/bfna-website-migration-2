# GGS Taxonomy → Directus Schema Draft

**Status: planning only — nothing created in Directus yet.**
Maps the GGS content model (Focus Areas / Programs / Insights) + Irene's Jul 2026 taxonomy to new Directus collections. New collections live in a "BFNA Website" folder in the existing `bfna.simplyas.com` instance; `workstreams` and friends are retired later via scripted migration.

## Design principles

- **Three content types, three collections.** Focus Areas (topics), Programs (initiatives), Insights (outputs). Nav buckets (Archives, Podcasts, Updates, Team) are *queries/views*, never rows in a taxonomy table — this kills the current `workstreams` conflation.
- **Tagging = relations, not strings.** GGS asks for tagging by focus area, program, and format. Focus area and program are M2M relations; format is a field on `insights`.
- **Visibility tiers are computed, not stored.** Tier 1/2 vs Archive derives from `publish_date` (3-year rule) at query time; only the exception ("evergreen") is a stored flag. <!-- ponytail: computed rule, add a stored tier field only if editors demand manual overrides -->
- **Terminology-agnostic slugs.** Collection keys use GGS names (`focus_areas`, `programs`, `insights`); display labels ("Programs" vs "Projects") stay editable copy so the Irene-vs-GGS naming question doesn't block schema work.

## Collections

### `focus_areas` (expect 3 rows)

Democracy · Transatlantic Relations & Global Challenges · Future Leadership

| field | type | notes |
|---|---|---|
| status | string | published workflow (same as today) |
| heading | string | display name |
| slug | string | route: `/[slug]` |
| tagline | string | one-liner for cards/nav |
| intro | text | hub-page intro framing the issue (GGS: "clear intro paragraphs") |
| image | file | hub hero |
| theme | string | CSS theme hook (replaces hardcoded per-slug CSS maps) |
| navigation_order | integer | drives data-driven nav |
| visible | boolean | show in nav |
| seo_description | string | per-hub meta (missing entirely today) |

### `programs` (expect ~14 rows)

Fellowship (BFF), Summer Enrichment Series, Leadership in Action, Astropolitics, Indo-Pacific Nexus, Critical Minerals, Transatlantic Periscope, Transatlantic Barometer, RANGE, City Solutions Series, Graphic Images, How to Fix Democracy, Election Analysis, BFNA Documentaries

| field | type | notes |
|---|---|---|
| status | string | |
| heading | string | |
| slug | string | route: `/programs/[slug]` (or external) |
| kind | string enum | `research-initiative` \| `platform` \| `fellowship` \| `podcast` \| `documentary-series` \| `magazine` — Irene's docx labels ("Research Initiative", "Data & Analysis Platform") normalized |
| focus_area | M2O → focus_areas | Irene's taxonomy: each program sits under exactly one area |
| excerpt | text | card copy (from Irene's docx) |
| description | text | program page body |
| external_url | string | for microsites (Periscope, Barometer, RANGE, bfnadocs.org) — null = on-site page |
| cover_image | file | |
| cta_label / cta_url | string | GGS: "participation path" / strong CTA |
| featured | boolean | homepage/hub curation |
| sort | integer | |

### `insights` (expect ~400 rows migrated)

One collection for all outputs; format is a facet, matching GGS's "Insights" nav + tag-by-format.

| field | type | notes |
|---|---|---|
| status | string | |
| heading / subheading | string | |
| slug | string | route: `/insights/[slug]` |
| format | string enum | `article` \| `report` \| `video` \| `infographic` |
| excerpt | text | |
| content | text | rich text |
| publish_date | date | drives sort AND archive tier |
| evergreen | boolean | exempt from 3-year archive demotion |
| focus_areas | M2M → focus_areas | multi — today's single FK is a real limitation |
| programs | M2M → programs | "produced through" relation (GGS: Insights = content produced through Programs) |
| internal_authors | M2M → people | reuse existing `people` |
| external_collaborators | M2M → external_collaborators | reuse existing |
| cover_image | file | |
| download_file | file | reports/infographic PDFs |
| video_url | string | format=video |
| original_publication_{name,url,date} | string/date | reprints (exists today, keep) |
| featured | boolean | |

Format-specific fields are nullable on the one collection. <!-- ponytail: split per-format collections only if the null-field count grows past ~5 -->

### Reused as-is
`people`, `external_collaborators`, `highlights` (homepage curation), `global_settings`. `htfd_episodes`/`docs_*` stay put — HTFD and Documentaries appear on the main site as `programs` rows pointing at their own data/microsites.

### Explicitly NOT modeled
- **Free-form topic tags** — GGS's three tag axes (focus area, program, format) are covered above; add a `tags` collection only when a real fourth axis shows up.
- **Stored visibility tier** — computed from `publish_date` + `evergreen`.
- **Nav as content** — nav derives from `focus_areas`/`programs` (`navigation_order`, `visible`) plus static routes.

## Migration map (old → new)

| old | new |
|---|---|
| workstreams: Democracy, Future Leadership | `focus_areas` (as-is) |
| workstreams: Politics & Society | `focus_areas`: Transatlantic Relations & Global Challenges |
| workstreams: Digital World | retired — its content re-tagged to surviving areas (editorial pass) |
| workstreams: Archives, Podcasts, Publications, Team | dropped — become views/queries |
| products (type=website: Periscope, Barometer, RANGE…) | `programs` |
| super_products (podcast series etc.) | `programs` |
| products (type=report/video, incl. podcast episodes) | `insights` (episodes may instead surface via htfd_episodes — decide during migration script) |
| publications | `insights` format=article/report |
| videos | `insights` format=video |
| infographics | `insights` format=infographic |
| Transponder Magazine (slug-matched product) | `programs` kind=magazine |

Mechanical except: (1) program-assignment of each insight — needs editorial pass or heuristic; (2) Digital World content re-tagging; (3) article vs report split on publications.

## Open questions (for Irene/Dani meeting)

1. Display labels: "Focus Areas"+"Programs" (GGS) vs "Programs"+"Projects" (Irene)? Schema unaffected; nav copy blocked.
2. Periscope/Barometer/RANGE: stay external microsites (external_url) or get on-site program pages with the microsite linked?
3. HTFD podcast episodes on main site: surfaced as insights, or only via the HTFD program page?
4. Do editors need manual tier overrides beyond `evergreen`?
