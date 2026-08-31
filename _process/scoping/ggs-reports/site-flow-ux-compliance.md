# Site Flow + UX Recommendations — Wireframe Compliance Check

> GGS doc (May 21, 2026) vs. Front 2 wireframes at `bfna-website-nuxt/src/pages/wireframes/` + `src/components/wireframe/` + `src/composables/useWfContent.ts`. Checked 2026-08-06.
>
> **Taxonomy note applying throughout:** the doc predates the final taxonomy. Its "4 Focus Areas + Programs & Platforms" model was superseded by Irene's adopted structure (Jul 31): **3 Programs > Projects**. Rows below treat the *intent* of each rec against the new labels; the label swap itself is one deliberate, already-approved divergence, not repeated per row.

Status key: **done** · **partial** · **missing** · **diverged** (deliberately different)

## Section 3 — Content Strategy Framework

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 1 | Content Visibility Framework — Tier 1 active / Tier 2 searchable / Tier 3 archive (3+ yrs, exceptions apply) | **done** | `useWfContent.ts`: `archived` + `evergreen` flags on insights; `active`/`archived` feeds; archive counts per program | — |
| 2 | Archive ≠ delete; archived content stays accessible/indexed (AI SEO) | **done** | `archive.vue` year-grouped index ("Everything stays online, searchable, and citable — nothing is deleted"); archived insights keep live URLs with archive banner (`insights/[slug].vue`); search includes archived items with "Archive" chip; "Include archived (N)" toggles on hub + insights feed | Wireframes carry `robots: noindex` (correct for wireframes); ensure production does NOT noindex archive |
| 3 | Content model: distinguish institutional / areas / programs / insights | **done** (labels diverged) | Distinct types: pages / programs / projects / insights in `useWfContent.ts` + dedicated templates per type; "Programs vs. Insights" distinction honored | — |
| 4 | Introduce tagging (area, program, format) | **done** | Insight chips = format + program + project(s) (`insights/[slug].vue` chips); project chips = kind + program; filters by format + program on insights feed | Granular topic/country tags deliberately NOT added — semantic search replaces them (Aug 4 call). Fine, but see row 8 |
| 5 | Standardize page structures incl. clear intro paragraphs | **done** | Shared `wfPageHeader` (heading + tagline) on every page; every page carries a descriptive summary from `pages.json`/dataset copy | — |
| 6 | Strengthen area landing pages as hubs | **done** | `[area].vue` = GGS hub template: intro framing → projects → recent insights → cross-nav to other programs | — |
| 7 | AI-search box: clear titles/summaries; explicit area↔program↔content relationships; consistent structures | **done** | Real M2M `insight.projects` + `program` fields surfaced as chips + "From {project}" / "More on {program}" sections | — |
| 8 | AI-search box: implement schema (structured data: organization, article, report, video, event) | **missing** | No JSON-LD/schema markup anywhere in wireframes (grep: none) | Expected — wireframes are noindex prototypes. Must land in production build (Front 1/3). Track as a build task so it doesn't fall through |

## Section 4 — Key Journeys

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 9 | First-time visitor: Home → Area → Content → Subscribe | **done** | Hero CTA "Explore our programs" → program cards → insights; global subscribe band on every page (`layouts/wireframe.vue`) | — |
| 10 | Topic explorer: Area → Content → Program | **done** | Hub insights carry project chips; cross-nav band "Also explore:" | — |
| 11 | Program user: Program → Action | **done** | Participation-path CTA section on every project page, incl. external ones (`projects/[slug].vue`, dataset `participation` copy) | — |
| 12 | Content visitor: Content → Area → Program | **done** | Insight chips link identity to program + projects; related section + archive banner links back to program's recent work | — |

## Section 5 — Cross-Site UX

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 13 | Clarify content model | **done** | See rows 3–7 | — |
| 14 | Prioritize pathways (few clear actions) | **done** | One primary + one secondary CTA per hero; single global subscribe band (pages never render their own) | — |
| 15 | Reduce cognitive load | **done** (wireframe-level) | Zoned templates, capped lists (slice 4/6/9), pruned program grids (`inProjectGrid`) | Re-verify at Front 3 UI stage when visual density returns |
| 16 | Strong CTAs, no generic language | **done** | No "Learn More" anywhere in wireframe pages; CTAs are specific ("See how to get involved", "Visit {name} ↗", participation CTAs from dataset) | — |
| 17 | Signal external links | **done** | `a[data-external]::after { content: " ↗" }` in `public/css/wireframe.css`; applied in nav, footer, chips, product bands, microsite CTAs | — |
| 18 | Standardize templates | **done** | Shared `wf*` component library + single `wireframe.vue` layout shell | — |

## Section 6 — Navigation

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 19 | Top-level nav: About / Focus Areas / Programs / Insights / Search / Subscribe | **diverged** | Implemented: About / Programs / Projects / Insights dropdowns + Search + Subscribe + **Podcasts ↗ / Documentaries ↗** external buttons (`MENUS` in `useWfContent.ts`, BF-142). "Focus Areas"→"Programs", "Programs"→"Projects" per final taxonomy | Taxonomy swap already Irene-approved. The two added external buttons (Podcasts, Documentaries) exceed GGS's six-item nav — flag to Irene as a deliberate addition; Podcasts URL still placeholder |
| 20 | Areas visible in dropdown, prominent on homepage, reinforced in About | **partial** | Dropdown ✓ (Programs menu); homepage ✓ ("Our Programs" is first section after hero); About page has mission/board/team/Stiftung/contact but **no explicit programs connection/section** | Add a "connection to programs" element to `about.vue` (or confirm mission copy suffices) |
| 21 | About sub-nav: Board, Team, Stiftung, Contact | **done** | Exact match + "Mission" added (`MENUS`) | — |
| 22 | Areas sub-nav: Democracy / Politics & Society / Future Leadership / Digital World | **diverged** | 3 Programs from final taxonomy render instead (data-driven from `programs.json`) | None — superseded taxonomy, approved |
| 23 | Programs sub-nav: Periscope, RANGE, Barometer, BFNA Documentaries | **diverged** | Projects dropdown = 5 flagships (Barometer, Periscope, RANGE, How to Fix Democracy, Fellowship) + "All Projects →"; Documentaries moved out to external nav button with no landing page (BF-142); links go to on-site project pages, external ↗ lives on the page CTA (Q4 resolved) | Confirm flagship list with Irene (Q1 wording noted in code) |
| 24 | Insights sub-nav: Publications, Infographics, Videos, Archives, Transponder | **diverged** | Implemented: All / Articles / Reports / Videos / Infographics / Archive. "Publications" split into Articles+Reports; **Transponder removed from Insights** — repositioned as external-only "product" band on homepage (Q6 pending) | Transponder placement (product band, not Insights menu) needs Irene sign-off — flagged as Q6 in code |
| 25 | Search in top-level nav | **done** | `wfNav.vue` Search link → `search.vue` (semantic search wireframe with program/format facets) | Real vector search is Front 4 |
| 26 | Subscribe in top-level nav | **done** | Subscribe button anchors to global `#subscribe` band on every page | — |

## Section 7 — Page-Level

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 27 | Homepage structure: value prop → areas → programs → content → CTA | **done** | `index.vue` zones: announcement + hero value prop → programs → featured projects → product band → insights (featured + latest) → subscribe | — |
| 28 | Homepage headline "Strengthening the Transatlantic Relationship" + intro | **done** | `pages.json` `home` row uses that exact headline; intro merges GGS value prop with Irene's About opening (placeholder until Irene confirms) | Get Irene's confirmation on the intro copy |
| 29 | Area page: intro framing the issue + connection to programs/content | **done** | `[area].vue` hub: dataset intro (Irene Jul 29 copy) → projects grid → recent insights → cross-nav | — |
| 30 | Program page: overview + participation path; outcomes + related content | **done** | `projects/[slug].vue`: overview/body, participation-path CTAs, cohort/"The Fellows" outcomes band, related insights; external projects get compact template + microsite CTA | — |
| 31 | About page: mission + institutional context; connection to areas | **partial** | Mission copy + Stiftung context + board/team/contact all present; explicit connection-to-programs element absent (same as row 20) | Same fix as row 20 |

## Section 8 — Accessibility

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 32 | Heading hierarchy, accessible nav, contrast, keyboard, alt text | **partial** (by design) | Wireframes have: skip link, `aria-label="Main"` nav, semantic headings, alt text on media, `aria-label` on search input. Contrast/keyboard/full WCAG is a Front 3 (UI) concern; separate GGS Accessibility Audit is the governing doc | Full audit compliance belongs to the production UI pass — see `accessibility-audit.md` in this folder |

## Sections 9–10 — Brand & Implementation

| # | Recommendation | Status | Evidence | Action needed |
|---|---|---|---|---|
| 33 | Align redesign with upcoming Stiftung rebrand; develop visual/voice system | **diverged** | Project direction (three-fronts): UI is brownfield — evolve current design, **no rebrand**. GGS itself notes rebrand timeline extends beyond this work | Decision point for Irene: confirm "evolve now, align with Stiftung rebrand later" is the accepted sequencing |
| 34 | Content governance, tagging systems, CMS templates (post-project) | **partial** | Directus schema + consolidated dataset effectively ARE the tagging system + CMS templates in progress (Front 1); formal governance doc not started | Governance doc = future BFNA/CCM task, out of wireframe scope |

---

## Gaps (missing / needs action)

1. **Schema / structured data (row 8)** — the only hard *missing* item. Correctly absent from noindex wireframes, but nothing tracks it for production. Add organization/article/report/video schema to the Front 1/3 build backlog.
2. **About ↔ Programs connection (rows 20, 31)** — GGS asks twice (nav visibility note + About template) for the About page to reinforce the programs; `about.vue` has no programs section or link band. Small wireframe addition.
3. **Production indexability of archive** — wireframe layout sets `robots: noindex` globally (correct now); the GGS archive-stays-indexed principle must be preserved when templates go to production.
4. **Homepage intro copy confirmation** — implemented with GGS-recommended headline, but intro is flagged in code as "placeholder until Irene confirms."

## Divergences (deliberate — flag for Irene sign-off where noted)

1. **Taxonomy: 4 Focus Areas → 3 Programs > Projects** — supersedes the doc's entire labeling. Already adopted by Irene (Jul 31). No sign-off needed; noted for the record.
2. **Nav additions: Podcasts ↗ + Documentaries ↗ external buttons** (row 19, BF-142) — GGS recommended a lean six-item nav; we added two external buttons and removed Documentaries' on-site landing page. **Needs Irene sign-off** (and the real podcast-platform URL).
3. **Transponder Magazine moved out of the Insights menu** (row 24) — now an external-only "product" band on the homepage, no project page. **Needs Irene sign-off** — tracked as open question Q6 in the wireframe code.
4. **Projects dropdown = curated flagships, not GGS's four** (row 23) — flagship list (incl. How to Fix Democracy, Fellowship) is a CCM/Irene curation call (Q1); links go on-site with external ↗ on the page CTA rather than straight to microsites (Q4 resolved). Confirm flagship list only.
5. **No granular topic tagging on search** (row 4) — semantic ranking (Front 4) replaces country/topic facets per the Aug 4 call. Consistent with GGS's discoverability *goal*, different mechanism. No sign-off needed.
6. **No rebrand alignment now** (row 33) — brownfield UI evolution contradicts the doc's "align with Stiftung rebrand" only in sequencing; GGS conceded the timeline mismatch. Worth one explicit line to Irene confirming the sequencing.
