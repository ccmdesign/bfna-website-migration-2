# Website Overhaul — High-Level Feature List

**Status: scoping.** Derived from the GGS Site Flow + UX doc, Irene's Jul 2026 restructure, and the three-fronts framing (Data/UX greenfield, UI brownfield).

## 1. AI searchability (headline feature)

GGS's forward-looking bet: search is shifting to AI-generated answers, so BFNA content must be easy for machines to understand, surface, and **cite**.

- **schema.org structured data across all content types** — organization, article, report/publication, video, event
- Clear, descriptive titles and summaries on every page (enforced by CMS fields, not editor discipline)
- Explicit machine-readable relationships: insight → focus area → program (the taxonomy IS the AI-readability play)
- Standardized page structures so parsers (and people) always find the same things in the same places
- Archive stays fully indexed — old content remains citable by AI engines, never deleted

## 2. New information architecture

- 3 focus areas (per Irene's restructure) with hub landing pages
- Programs as first-class content (Fellowship, Periscope, Barometer, RANGE, HTFD, Documentaries…)
- Insights: one unified output feed (articles, reports, videos, infographics) with format facets
- Single data-driven navigation: About / Focus Areas / Programs / Insights / Search / Subscribe

## 3. Content tagging & tiers

- Tag every insight by focus area, program, and format (M2M relations in Directus)
- Visibility tiers: recent content featured, 3-year-old content auto-demotes to archive
- **Archive ≠ delete**: archived content keeps its URL, stays searchable and indexed (GGS explicit requirement)
- Archive index page, browsable by year

## 4. Standardized page templates

- Homepage: value proposition → focus areas → programs → recent content → CTA
- Focus-area hub: intro framing the issue → related programs → recent insights
- Program page: overview, participation path, outcomes, related content
- About: mission, institutional context, connection to focus areas

## 5. User pathways & engagement

- Strong specific CTAs replacing generic "Learn More"
- Working newsletter signup (Mailchimp-backed form — currently only an external link)
- Clear signaling when links leave the site (microsites, external platforms)
- Defined journeys: first-time visitor, topic explorer, program user, content visitor

## 6. Search

- Upgraded site search covering all content types, tier-aware (archive results labeled)
- Filter by focus area / program / format (rides on the tagging system)

## 7. Accessibility

- Correct heading hierarchy (fixes current duplicate-h1 bug), keyboard navigation, contrast compliance, alt text on all media
- A11y linting in CI so it stays fixed

## 8. Technical SEO foundation

- Sitemap (doesn't exist today), consistent per-page meta, canonical URLs
- Redirect map for all renamed/retired routes (politics-society, digital-world, archives)

## 9. Design system evolution (brownfield)

- Extend the `ccm*` design system with BFNA's existing visual identity — evolve the UI, no rebrand
- One component library serving all pages (retires the legacy component stack)
