# Front 2 — UX: Wireframes & Information Architecture

Read `00-shared-context.md` first. **Phase: discuss + specify.** Greenfield — GGS docs are the starting point, not a spec.

## Scope

- Site-wide IA + navigation proposal (single data-driven nav; today nav is hardcoded in 4 legacy components; `useWorkstreamNavigation.ts` exists but is commented out).
- Wireframes / page templates: homepage, focus-area hub, program page, insights feed + detail, about, archive index, search.
- User journeys per GGS strategy: first-time visitor, topic explorer, program user, content visitor. Specific CTAs over generic "Learn More"; clear external-link signaling for microsites.
- Redirect map for renamed/retired routes (precedent: `src/server/middleware/redirects.ts`).

## GGS inputs (and their problems)

- Site Flow + UX doc (May 21 2026) has the nav sketch and page-structure recs — but it contradicts GGS's own Strategy doc (Feb 2026): strategy says avoid parallel pathways/comprehensive listings; their nav enumerates everything (6 top-level + full dropdowns). **Treat the nav as a sketch to prune, not a spec.**
- Their Programs list is internally inconsistent (omits Fellowship/HTFD from nav, files Transponder under Insights, lists "Archives" as if a content type).
- Site Flow still says 4 focus areas — superseded by Irene's 3.

## Open questions blocking this front

- Q1/Q2: naming — "Focus Areas/Programs" vs "programs/projects" → nav labels.
- Q4: Periscope/Barometer/RANGE — link-out only vs on-site program pages (GGS recommends pages with participation paths).
- Q5: HTFD episodes in the Insights feed or only on its program page?
- Q6: Transponder Magazine — active? placement?
- Q7: Documentaries — external only or program page?
- Q10: archive page — chronological vs curated.
- Q14: is CCM the design authority now, or does GGS review? (Assume CCM.)

## Dependencies

- Consumes Front 1's taxonomy (nav is data-driven off it). Hands wireframes to Front 3 (components) and defines slots for Front 4 (search, newsletter, CTAs).
- Waits on: Claudio's answers doc.
