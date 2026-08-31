# Digest — GGS "Audience-Centric Web Strategy" (Feb 20, 2026)

> Source: `audience-strategy.md` (same folder), extracted from Google Doc `1EW04HEudNaU1-VO6cBzfi6EiMUZenZiEi2nXeGT0BFE`.
> Doc type: **principles checklist / decision framework**, not a persona or research report. It precedes the GGS "Site Flow + UX Recommendations" doc (named as the next deliverable in "What's Next"), which is the doc that translates these principles into page-level guidance.

## Audiences identified

**None are named.** The doc deliberately stays audience-agnostic: it frames five *audience questions* ("Am I in the right place?", "Where am I?", "What do I do next?", "Can I use this?", "Can I trust this?") rather than defining segments. The only audience characterization given:

| Implied audience trait | Where | Implication |
|---|---|---|
| External visitors with **limited context** about BFNA | S1 | No jargon, no internal-program framing; assume zero prior knowledge |
| New visitors easily overwhelmed by **parallel pathways** | S1, S3 | Few, prioritized entry paths — not comprehensive listings |
| Users who navigate **non-visually** (assistive tech) | S2, S4 | Structure/labeling must work without visual cues |
| Repeat visitors who **reengage on their own terms** | S5 | Low-friction continuation, partial engagement is a valid outcome |

Priority ranking of audiences: **not provided** — expect it (if anywhere) in the Site Flow + UX doc.

## Recommendations mapped to actions

Each row = one of the 5 sections (audience question + "Organizational decision" callout + 6-item checklist).

| # | What (GGS principle) | Rationale | Concrete action for us | Addressed by wireframes? | Front |
|---|---|---|---|---|---|
| 1 | **Entry + Relevance** — at-a-glance clarity on what BFNA is/does; prioritize, don't be comprehensive; external-audience language, no jargon | New visitors decide in moments whether the site is worth their time | Homepage hero copy must state what BFNA is + problems it addresses; elevate priority work over full listings; copy pass for jargon (GGS copy recs will feed this) | **Partial** — hero + 3-programs + featured-projects structure embodies prioritization; actual messaging/copy not yet done (lo-fi) | 2 (structure) + 3 (copy/UI) |
| 2 | **Orientation + Way-Finding** — consistent, predictable nav/labels/templates; signal exits to microsites & affiliated platforms | Users shouldn't relearn patterns page to page | Keep one nav pattern site-wide; templatize program/project/insight pages identically; add explicit external-link treatment for Transponder & other microsites/affiliated platforms | **Partial** — consistent templates exist (3 program hubs share structure, project pages share structure); microsite-exit signaling (Transponder band → external) not yet designed | 2 + 3 |
| 3 | **Choice + Cognitive Load** — few intentional choices per page; unequal prominence by priority; specific CTAs; progressive disclosure | Too many equal options stalls users; nav shouldn't compensate for missing prioritization | Audit each wireframe for CTA count/specificity; make program/project prominence deliberately unequal (needs BFNA's priority call); progressive disclosure on project pages | **Partial** — participation CTAs on project pages are specific; 3-Programs taxonomy limits pathways; per-page CTA audit + prominence hierarchy not done | 2 |
| 4 | **Access + Inclusion** — non-visual navigation, clear feedback on interactions, labeled links/downloads/media, accessibility as core functionality | Removes barriers; supports usability and trust for all users | A11y as build requirement: semantic structure, landmarks, focus states, filter/search feedback states, labeled downloads (file type/size), device/context testing | **No** — lo-fi wireframes don't encode a11y; belongs to UI build | 3 (build) |
| 5 | **Trust, Continuity + Exit** — consistent credible presence; nonpartisan positioning; low-friction reengagement; related content for ongoing learning; partial engagement is valid | Trust drives return visits; no pressure/persuasion patterns | Keep subscribe low-pressure (no popups/nags); related-insights modules support "ongoing learning"; archive items staying indexed serves continuity; copy must stay nonpartisan/neutral | **Yes (mostly)** — related insights on project pages, subscribe section, archive-stays-indexed rule all align; neutrality is a copy concern for later | 2 + 3 (copy) + 4 (archive/indexing) |

Cross-cutting: the doc explicitly gives **CCM a mandate** to recommend changes aligned with best practices — useful to cite when pushing back on "list everything" requests.

## Contradictions with decisions already made

**None.** The framework validates existing decisions: 3-Programs > Projects taxonomy (fewer parallel pathways, S1/S3), archive ≠ delete with items indexed (continuity, S5), semantic search (multiple ways of navigating, S2/S4), participation CTAs (specific purposeful CTAs, S3).

## Top 5 actions by impact

1. **Get BFNA's priority ranking** — S1/S3 both hinge on unequal prominence ("priority topics elevated", "not every program given equal prominence"). Wireframes currently treat the 3 programs equally; someone (Irene/leadership) must rank what gets elevated. Blocker for hi-fi.
2. **Design the external-transition pattern** — explicit visual/copy treatment for exits to Transponder, microsites, downloads, affiliated platforms (S2 + S5). Not in wireframes; cheap to add now, applies site-wide.
3. **CTA audit of the wireframes** — per page: how many actions, are they specific, is there one clear next step, is disclosure progressive (S3). Do before UI design locks in.
4. **Bake accessibility into the Front-3 build spec** — semantic HTML, non-visual navigation, interaction feedback, labeled links/media as acceptance criteria, not a post-launch pass (S4).
5. **Hold homepage hero for the GGS copy deliverable** — S1's "what BFNA is, at a glance, no jargon" is a copy problem; GGS copy recommendations are the named next deliverable. Keep hero copy placeholder until then; don't wordsmith twice.
