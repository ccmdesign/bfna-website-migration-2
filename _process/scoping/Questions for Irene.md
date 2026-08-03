**call week of Aug 3, 2026**

Context: BFNA website overhaul (new Nuxt/Directus site). Data + UX greenfield per GGS recommendations; UI evolves under existing branding. GGS doc is from May 21 and predates Irene's Jul 29 restructure email. Irene answered the first batch inline on **Jul 31** (email); answers folded in below. Mapping proposal to review with her: [content-mapping.md](content-mapping.md).

## Taxonomy & naming

**Labels** — ✅ **Answered (Irene, Jul 31)**: "I spoke with GGS to clarify, we will call the Focus Areas – **Programs** as this is in line with the internal language we use. What GGS identifies as Programs we call **Projects**. Moving forward we will have 3 Programs and within these programs multiple projects." → **Adopted (Jul 31, same day)**: wireframes, scoping docs, and data files all flipped to **Programs** (3) / **Projects**; FYI on the call, nothing left to confirm.

**Confirm the GGS doc is superseded where they conflict** — ✅ **Answered (Irene, Jul 31)**: "Yes, we move from 4 to 3 and call these programs moving forward: Democracy; Transatlantic Relations & Global Challenges (prior Politics & Society); Future Leadership."

**Content mapping from GGS** — ✅ **Answered (Irene, Jul 31)**: GGS did not produce one and likely won't ("No they did not, not sure they will deliver this. Happy to answer any questions you might have in this regard."). → Our proposal is [content-mapping.md](content-mapping.md); the open items are its Questions section (Q-1…Q-4).

**Existing Digital World / Digital Economy content** — ✅ area confirmed dropped (Jul 29 email to GGS: "We drop Digital Economy"). **Handled without a question**: of its 31 insights, 27 are archived (→ Archives bucket, unmapped), 3 Hidden Layers stragglers get force-archived (series looks retired), and the remaining 3 active items (Hotspots + 2 infographics) re-tag to Transatlantic Relations & Global Challenges. Details in content-mapping.md.

## Projects / platforms

**Periscope, Barometer, RANGE**: keep them as external microsites we link out to, or should the new site have a proper page per project (with the microsite as the CTA)? GGS recommends project pages with participation paths.

**Podcasts & series — episodes as Insights or project-page-only?** GGS never provided an item-level content map (confirmed Jul 31), so this needs your call. Your May 11 email fixed the podcast lineup and pattern — order: How to Fix Democracy · The Transponder · Indo-Pacific in Focus · Wisdom of the Crowd · Bridging the Atlantic, each with "all the individual episodes" listed on its project sub-page. Open question: do episodes *also* surface in the sitewide Insights feed, or only on their project page? Applies to Leadership in Action (9 episodes), Bridging the Atlantic (6), Wisdom of the Crowd (6), and The Transponder podcast (15+). (How to Fix Democracy stays out of scope — separate site; only its project card is in play.) Related data gap: The Transponder and Indo-Pacific in Focus episodes are in the Word docs attached to your May 11 email but in neither CMS — we'll extract from those docs unless there's a newer list.

**The Transponder**: the CMS has the *magazine* (7 issues, last May 2025); your emails show an active *podcast* of the same name (ep 15 featured in July). One Transponder project with two formats, or two separate projects? Is the magazine continuing? (GGS had filed Transponder under Insights — superseded by treating it as a project.)

**Indo-Pacific**: is "Indo-Pacific in Focus" (the podcast) part of the Indo-Pacific Nexus project (the microsite)? Do its episodes live on the main site or on the microsite?

**BFNA Documentaries**: same question as Periscope — external site only, or an on-site project page?

## Archive policy (GGS 3-year rule)

*(Claudio, Jul 31: archived items go to a single unmapped Archives bucket — searchable but not linked elsewhere on the site; no per-item questions for Irene. The questions below are about the policy edges, not individual items.)*

**The big number**: applying GGS's "archive 3+ years old" rule archives ~74% of current content (296 of 400 items). Nothing is deleted — it stays reachable, searchable, and indexed — but hubs and listings would only surface the recent ~104 items. Comfortable with that?

**Exceptions**: who flags "evergreen" content that shouldn't demote (flagship reports, explainers)? You/Sam, or should we propose a starting list?

**Archive page**: purely chronological by year, or curated ("notable past work")?







## Contradictions & gaps across the GGS documents

Reviewed all GGS deliverables sent over the past 12 months:

| doc                                              | date         |
| ------------------------------------------------ | ------------ |
| Scope of Work (proposal)                         | Aug 12, 2025 |
| Web Project Work Plan                            | Dec 8, 2025  |
| Accessibility Audit — **executive summary only** | Jan 13, 2026 |
| Audience-Centric Web Strategy                    | Feb 20, 2026 |
| Site Flow + UX Recommendations                   | May 21, 2026 |

**Contradictions between documents:**

1. **Archive vs delete.** The Work Plan (D2) promises "high-level guidelines on which content to keep, archive, **delete**." The Site Flow doc says the opposite: "Archiving does not mean deleting the content off of the website." And the Strategy doc — where those keep/archive/delete guidelines were supposed to live — contains none at all. → *Ask: is anything ever deleted, or is 3-year archival the whole policy? Who decides keep/evergreen?*
2. **Tagging/coding scope flip.** The Work Plan lists "Back-end Coding: label and code all site content… to optimize for SEO, accessibility" as a GGS deliverable (running Jan–Mar). The Site Flow doc (May) says tagging systems and CMS templates are "beyond this project with GGS." → ✅ **Effectively answered (Irene, Jul 31)**: no content map/labeling was delivered and none is expected — CCM absorbs it. Our remap proposal: [content-mapping.md](content-mapping.md). *Still worth noting on the call re: scope/budget.*
3. **Their nav contradicts their own strategy.** The Strategy doc: avoid "too many parallel pathways," don't "expose the full complexity of the organization," elevate priorities "over comprehensive listings." The Site Flow nav then lists everything: 6 top-level items with dropdowns enumerating 4 focus areas + 4 programs + 5 insight types + 4 about pages. → *For CCM: treat the nav as a starting sketch, not a spec; our IA proposal can prune it and still honor their strategy.*
4. **Programs list is internally inconsistent.** In the Site Flow doc, the content model says "Programs = Fellowship, Barometer, Periscope, other microsites, etc." but the Programs nav omits Fellowship (and podcasts/HTFD entirely), and files Transponder Magazine under Insights. "Archives" sits in the Insights nav as if it were a content type — violating their own focus-areas/programs/content distinction. → *Resolved by our schema draft; confirm with Irene which programs get nav placement.*
5. **Stale taxonomy.** The Site Flow doc (May) still recommends "reinforcing BFNA's **four** focus areas" — superseded by Irene's Jul 29 three-program restructure. (Q1–3 above.)

**Deliverable gaps:**

6. **Accessibility audit**: the promised "full report of recommended updates" was never received — only an executive summary; the original full-audit doc link from Jan is now dead (404). → *Ask Irene/GGS for the full report, or budget our own audit.*
7. **Copy (D4)**: "final copy for 4–5 central pages" was due Feb per their own work plan; in May the Site Flow doc still said "final copy will follow." What we actually have is **Irene's own text** (Jul 29 docx), not GGS copy. → *Ask: is GGS copy still coming, or is Irene's text final?*
8. **Timeline/PM role**: the proposal made GGS "primary project manager"; their plan closed out end of March. Site Flow arrived May 21, and their role quietly became "available for future consultation (pending contract extension)." → *Overlaps Q14 — clarify who runs the project now.*
