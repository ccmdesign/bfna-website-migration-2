# Recovered v1 Plane epics — BF-150 through BF-215

Source: Plane workspace `ccm-design`, project **CCM - BFNA** (`af63ebaf-04bc-44b0-9f2a-bc609f420b02`, identifier `BF`) — https://app.plane.so/ccm-design/projects/af63ebaf-04bc-44b0-9f2a-bc609f420b02/issues/

Pulled via the Plane REST API (read-only: `GET /work-items/`, no writes). All 66 sequence ids from BF-150 to BF-215 exist — no gaps. 6 top-level epics (BF-150–BF-155, `E0`–`E5`, no parent) + 60 sub-items (each parented to exactly one of the 6 epics), matching the E0–E5 / N.M numbering scheme in `architecture-and-epics.md` exactly (E0 ×9, E1 ×7, E2 ×8, E3 ×13, E4 ×11, E5 ×12 sub-items). Every item is in **Backlog** state; none carry an assignee — nothing has been started in Plane against this plan.

## Table — one row per item, ordered by epic then id

| BF-id | Title | State | Parent epic | Assignee |
|---|---|---|---|---|
| BF-150 | E0 — Foundations: composition fixes, tokens, entity contracts | Backlog | — | — |
| BF-175 | E0.1 — Ratify ADR-1 + ADR-2; amend design-system-approach.md for bf-* prefix | Backlog | BF-150 | — |
| BF-176 | E0.2 — Composition: unify the gap API across stack/cluster/switcher/grid | Backlog | BF-150 | — |
| BF-177 | E0.3 — Composition: fix the data-measure contract | Backlog | BF-150 | — |
| BF-178 | E0.4 — Replace raw grid-template-columns inline styles with primitive usage | Backlog | BF-150 | — |
| BF-179 | E0.5 — Wire the ccm token stylesheet globally | Backlog | BF-150 | — |
| BF-180 | E0.6 — Token cleanup: dead --colors-*, broken values, .icon conflict | Backlog | BF-150 | — |
| BF-181 | E0.7 — Define @nuxt/content collections + zod schemas (entity contracts) | Backlog | BF-150 | — |
| BF-182 | E0.8 — bf-* component scaffolding + auto-import config | Backlog | BF-150 | — |
| BF-183 | E0.9 — Decide tint/shade vs numeric color primitives; prune unused steps | Backlog | BF-150 | — |
| BF-151 | E1 — Data architecture: Directus → nuxt-content → composables (SSG) | Backlog | — | — |
| BF-184 | E1.1 — Verify/refresh the Directus build-time importer; move normalization into the pull | Backlog | BF-151 | — |
| BF-185 | E1.2 — Wire @nuxt/content collections to the importer output | Backlog | BF-151 | — |
| BF-186 | E1.3 — utils/format.ts: port the pure formatters from useWfContent | Backlog | BF-151 | — |
| BF-187 | E1.4 — Port the useWfContent query surface to queryCollection composables | Backlog | BF-151 | — |
| BF-188 | E1.5 — Site chrome as data: the nav registry for bfNav/bfFooter | Backlog | BF-151 | — |
| BF-189 | E1.6 — Reconcile the wireframe snapshot shape with the importer output | Backlog | BF-151 | — |
| BF-191 | E1.7 — Parity test + confirm static generation | Backlog | BF-151 | — |
| BF-152 | E2 — Atoms (bf-*) | Backlog | — | — |
| BF-156 | E2.1 — bfButton | Backlog | BF-152 | — |
| BF-157 | E2.2 — bfChip | Backlog | BF-152 | — |
| BF-158 | E2.3 — bfLogo | Backlog | BF-152 | — |
| BF-159 | E2.4 — bfMedia | Backlog | BF-152 | — |
| BF-160 | E2.5 — bfTime | Backlog | BF-152 | — |
| BF-161 | E2.6 — bfSkipLink | Backlog | BF-152 | — |
| BF-162 | E2.7 — External-link marker: pick one mechanism | Backlog | BF-152 | — |
| BF-165 | E2.8 — Icon system decision: one font, one utility | Backlog | BF-152 | — |
| BF-153 | E3 — Molecules (bf-*): card family, forms, filters | Backlog | — | — |
| BF-190 | E3.1 — bfCard base (slot-based inheritance root) | Backlog | BF-153 | — |
| BF-192 | E3.2 — bfCardInsight | Backlog | BF-153 | — |
| BF-193 | E3.3 — bfCardProject | Backlog | BF-153 | — |
| BF-195 | E3.4 — bfCardFeatured | Backlog | BF-153 | — |
| BF-197 | E3.5 — bfCardPerson | Backlog | BF-153 | — |
| BF-200 | E3.6 — bfCardProgram | Backlog | BF-153 | — |
| BF-202 | E3.7 — bfCardRow (list-row variant) | Backlog | BF-153 | — |
| BF-204 | E3.8 — bfBreadcrumb | Backlog | BF-153 | — |
| BF-205 | E3.9 — bfByline (resolve the ccmByLine naming collision) | Backlog | BF-153 | — |
| BF-207 | E3.10 — bfFormField + bfFormGroup | Backlog | BF-153 | — |
| BF-209 | E3.11 — bfFilterBar | Backlog | BF-153 | — |
| BF-211 | E3.12 — bfAccordion | Backlog | BF-153 | — |
| BF-213 | E3.13 — Load more / pagination | Backlog | BF-153 | — |
| BF-154 | E4 — Organisms (bf-*): chrome, hero, sections, grids | Backlog | — | — |
| BF-163 | E4.1 — bfNav (data-driven top bar) | Backlog | BF-154 | — |
| BF-164 | E4.2 — bfFooter | Backlog | BF-154 | — |
| BF-166 | E4.3 — bfHero | Backlog | BF-154 | — |
| BF-167 | E4.4 — bfPageHeader | Backlog | BF-154 | — |
| BF-168 | E4.5 — bfSection | Backlog | BF-154 | — |
| BF-169 | E4.6 — bfCtaSection | Backlog | BF-154 | — |
| BF-170 | E4.7 — bfNotice | Backlog | BF-154 | — |
| BF-171 | E4.8 — bfGridInsights + bfGridProjects | Backlog | BF-154 | — |
| BF-172 | E4.9 — Search shell | Backlog | BF-154 | — |
| BF-173 | E4.10 — Cross-links row | Backlog | BF-154 | — |
| BF-174 | E4.11 — Modal decision: person bio / video | Backlog | BF-154 | — |
| BF-155 | E5 — Templates & the wf-* → bf-* swap | Backlog | — | — |
| BF-194 | E5.1 — Site shell layout | Backlog | BF-155 | — |
| BF-196 | E5.2 — Home template | Backlog | BF-155 | — |
| BF-198 | E5.3 — Program hub template | Backlog | BF-155 | — |
| BF-199 | E5.4 — Insights index template | Backlog | BF-155 | — |
| BF-201 | E5.5 — Insight detail template | Backlog | BF-155 | — |
| BF-203 | E5.6 — Projects index template | Backlog | BF-155 | — |
| BF-206 | E5.7 — Project detail template | Backlog | BF-155 | — |
| BF-208 | E5.8 — About template | Backlog | BF-155 | — |
| BF-210 | E5.9 — Search template | Backlog | BF-155 | — |
| BF-212 | E5.10 — Archive template | Backlog | BF-155 | — |
| BF-214 | E5.11 — Shared not-found block | Backlog | BF-155 | — |
| BF-215 | E5.12 — Retire the legacy stack + dead code | Backlog | BF-155 | — |

## Descriptions

Total combined `description_stripped` text for all 66 items is ~1,574 lines — well over the ~300-line budget in the spec. Per the spec's fallback: **full descriptions for the 6 epics (BF-150–BF-155) below; first line only for each of the 60 sub-items**, shown inline in the table note beneath each epic.

### BF-150 — E0 — Foundations: composition fixes, tokens, entity contracts

Epic E5 — Templates & the wf-* → bf-* swap. The payoff epic: page templates rebuilt on bf-* components, wireframes retired, legacy stack deleted.
The goal state
Claudio, 2026-08-07: "The ideal scenario is that, after final wireframe validation from the client, we will be able to swap wf-* components with bf-* components."
Everything in E0–E4 exists to make this epic mechanical. Each page swap should be a component-name change plus a data-source change — not a redesign.
Gate
This epic does not start until the client has validated the wireframes. The wireframes at /wireframes/* are the artefact under review. Building templates before sign-off risks rebuilding them twice.
Shared context
Source docs: _process/scoping/atomic-component-inventory.md (Level 4 — Templates table) and _process/scoping/architecture-and-epics.md.
The 9 wireframe pages at src/pages/wireframes/ are the specification. Each has a production counterpart to replace.
Legacy production pages run on layouts/legacy-base.vue (429 lines) + public/global.css (3,676 lines).
Acceptance test for every page sub-item
The bf-* page renders the same content as its wf-* twin. Same records, same counts, same ordering, same chips, same empty states. Diff the rendered text if useful — this is the safety net that makes the swap provable rather than eyeballed.
Also required per page: light and dark mode checked, keyboard navigation works, heading hierarchy is valid (no duplicate h1 — a known legacy bug), and the page is verified on a running localhost, not just type-checked.
Two cleanups this epic finishes
The 3× duplicated "unknown page" fallback. insights/[slug].vue, projects/[slug].vue and [area].vue each carry identical not-found markup. One shared block replaces all three.
The legacy retirement. 23 components in src/components/legacy/**, plus dead code found in the 2026-08-07 sweep: legacy/Header.vue (0 refs), custom/projectCard.vue (0 refs), 6 demo-only ds/ components, layouts/{default,docs2,enhanced-hybrid}.vue, and the byte-identical duplicate of global.css in src/public/css-legacy/.
Sub-items
BF-194 — Site shell layout
Per-page swap (each acceptance-tested against its wf-* twin):
BF-196 — Home
BF-198 — Program hub
BF-199 — Insights index
BF-201 — Insight detail
BF-203 — Projects index
BF-206 — Project detail
BF-208 — About
BF-210 — Search
BF-212 — Archive
Cleanup:
BF-214 — Shared not-found block
BF-215 — Retire the legacy stack + dead code
Dependencies
Needs all of E0–E4. This is the only epic that hard-depends on E1 (data), since templates are where content actually gets queried.

**Sub-items (9) — first line of description each:**

- **BF-175 — E0.1 — Ratify ADR-1 + ADR-2; amend design-system-approach.md for bf-* prefix**: Objective
- **BF-176 — E0.2 — Composition: unify the gap API across stack/cluster/switcher/grid**: Objective
- **BF-177 — E0.3 — Composition: fix the data-measure contract**: Objective
- **BF-178 — E0.4 — Replace raw grid-template-columns inline styles with primitive usage**: Objective
- **BF-179 — E0.5 — Wire the ccm token stylesheet globally**: Objective
- **BF-180 — E0.6 — Token cleanup: dead --colors-*, broken values, .icon conflict**: Objective
- **BF-181 — E0.7 — Define @nuxt/content collections + zod schemas (entity contracts)**: Objective
- **BF-182 — E0.8 — bf-* component scaffolding + auto-import config**: Objective
- **BF-183 — E0.9 — Decide tint/shade vs numeric color primitives; prune unused steps**: Objective

---

### BF-151 — E1 — Data architecture: Directus → nuxt-content → composables (SSG)

Epic E1 — Data architecture. Static site generation with @nuxt/content as the data layer. Directus stays a build-time source; composables replace stores.
The decision (ADR-2, 2026-08-07)
This is a read-only marketing site — blog, projects, people, program hubs. No cart, no auth, no cross-route mutable state, no heavy interaction flows. Pinia was evaluated and rejected as the data layer: a store earns its place with shared mutable client state, and there isn't any.
Directus → contentImporter.js → content/*.json → queryCollection() → data composables → pages → bf-* components
(CMS)      (build-time, EXISTS)  (nuxt-content)    (@nuxt/content)     (ported wf surface)  (readers)  (props only)
What already exists (verified 2026-08-07)
@nuxt/content v3.7.1 is installed.
The build-time importer already works: contentImporter.js + src/directus/*.js (npm run directus:pull) fetch each Directus collection and write one JSON file per item to content/<collection>/<slug>.json, flattening junction/relation fields at pull time. Eleven collections: highlights, super_products, workstreams, videos, people, external_collaborators, publications, infographics, products, announcements, docs.
NOT the importer: src/utils/directus.ts is a runtime SDK client (live fetch per request). It is fully commented out and is the rejected path — delete or leave dead.
src/composables/data/{useNews,usePeople,useWorkstreams}.ts are also fully commented out — the per-component fetch pattern, also rejected.
Wireframes currently run on a hand-curated 6-file aggregate snapshot at src/assets/wireframe-data/*.json via useWfContent (6 types + 33 query/format helpers). That shape differs from the importer's per-item output — reconciling them is sub-item 6.
Rules
Normalization happens at import time, in the importer — HTML-entity decoding, excerpt derivation, relation denormalization. Front 2's rule stands: strip/decode at the data layer, never in components. The plain() calls currently living in wf cards move down into the pull.
Relationships are denormalized on pull — each insight carries its resolved program/project refs. No relational joins at query time.
Components never touch the data layer (ADR-1). Not even nav/footer — the layout reads the data and passes props.
Refresh model: manual directus:pull + rebuild, matching how CCM has always worked. A Directus webhook → Netlify build hook is a later nicety, not in scope.
Pinia tripwire
Not installed as a data layer, not deleted from package.json. Reconsider only if a genuinely stateful client island appears: a filter/compare tray that persists across routes, saved/bookmarked items, or a multi-step form. If that happens, one scoped store for that island — never the content pipeline. Recorded so this isn't silently re-litigated.
Sub-items
BF-184 — Verify/refresh the build-time importer; move all normalization into the pull
BF-185 — Wire @nuxt/content collections to the importer output
BF-186 — utils/format.ts: port the pure formatters
BF-187 — Port the useWfContent query surface to queryCollection composables
BF-188 — Site chrome as data: the nav registry
BF-189 — Reconcile the wireframe snapshot with the importer output
BF-191 — Parity test + confirm static generation
Known path defect (verified 2026-08-07, fixed in BF-185)
content.config.ts resolves contentDir to a repo-root content/ directory that does not exist in the checkout, while srcDir is src/ and the only content on disk is src/content/docs. The importer's write target and Nuxt Content's read path do not line up today. This must be resolved before anything queries content.
Dependencies
Needs E0 sub-item 7 (collection schemas). Runs in parallel with E2/E3/E4 — components don't wait on this. Only E5 (templates) hard-depends on it.

**Sub-items (7) — first line of description each:**

- **BF-184 — E1.1 — Verify/refresh the Directus build-time importer; move normalization into the pull**: Objective
- **BF-185 — E1.2 — Wire @nuxt/content collections to the importer output**: Objective
- **BF-186 — E1.3 — utils/format.ts: port the pure formatters from useWfContent**: Objective
- **BF-187 — E1.4 — Port the useWfContent query surface to queryCollection composables**: Objective
- **BF-188 — E1.5 — Site chrome as data: the nav registry for bfNav/bfFooter**: Objective
- **BF-189 — E1.6 — Reconcile the wireframe snapshot shape with the importer output**: Objective
- **BF-191 — E1.7 — Parity test + confirm static generation**: Objective

---

### BF-152 — E2 — Atoms (bf-*)

Epic E2 — Atoms (bf-*). The smallest tier: the components everything else composes from. Bottom-up migration starts here.
Shared context
Source docs: _process/scoping/atomic-component-inventory.md (Level 1 — Atoms table) and _process/scoping/architecture-and-epics.md (ADR-1).
Location: src/components/bf/atoms/ · auto-imported as <bf-*> (E0 sub-item 8 sets this up).
Wireframe reference: the wf-* equivalents in src/components/wireframe/ are the working prototypes. Their behaviour is validated; port it, don't reinvent it.
Legacy reference: src/components/legacy/** + public/global.css (~190 BEM classes) is what these replace on production pages.
Rules for every atom in this epic (ADR-1)
Presentational only — props and slots in, events out. No data-layer access: no queryCollection, no content composable, no store.
$attrs fallthrough is the composability contract. Every component forwards class, style and data-* to its root so composition primitives can be applied from outside (class="bf-chip | cluster", data-gap="xs"). Components own meaning; primitives own layout; callers own placement.
Typed props via TS interfaces — defineProps<...>(), not runtime objects.
Semantic tokens only. Components consume --color-primary, --color-text, --color-surface — never primitives like --color-base-tint-05. This is what keeps the primitive-naming decision (E0 sub-item 9) a swappable implementation detail.
WCAG 2.1 AA is the baseline, decided now rather than waiting on the GGS audit: visible focus states, real semantic elements, no colour-only meaning.
Sub-items
BF-156 — bfButton (the highest-leverage atom: 16 raw call sites in the wireframes alone)
BF-157 — bfChip
BF-158 — bfLogo
BF-159 — bfMedia
BF-160 — bfTime
BF-161 — bfSkipLink
BF-162 — External-link marker: pick one mechanism
BF-165 — Icon system decision: one font, one utility
Definition of done
Each atom renders in place of its wf-* counterpart with the same content, passes an axe check, exposes a documented prop contract, and carries no layout CSS a composition primitive should own.

**Sub-items (8) — first line of description each:**

- **BF-156 — E2.1 — bfButton**: Objective
- **BF-157 — E2.2 — bfChip**: Objective
- **BF-158 — E2.3 — bfLogo**: Objective
- **BF-159 — E2.4 — bfMedia**: Objective
- **BF-160 — E2.5 — bfTime**: Objective
- **BF-161 — E2.6 — bfSkipLink**: Objective
- **BF-162 — E2.7 — External-link marker: pick one mechanism**: Objective
- **BF-165 — E2.8 — Icon system decision: one font, one utility**: Objective

---

### BF-153 — E3 — Molecules (bf-*): card family, forms, filters

Epic E3 — Molecules (bf-*). The card family and the other multi-part components. This is the bulk of the design-system work and the epic where the inheritance pattern earns its keep.
Shared context
Source docs: _process/scoping/atomic-component-inventory.md (Level 2 — Molecules table) and _process/scoping/architecture-and-epics.md (ADR-1).
Location: src/components/bf/molecules/ · auto-imported as <bf-*>.
Wireframe reference: src/components/wireframe/wfCard*.vue already implements the exact base + wrapper pattern described below, validated across 9 pages. Port it.
The card inheritance pattern (ADR-1 — the reason this epic is structured this way)
Claudio's requirement: "I don't think we should concentrate everything in a single card. Let's create these different cards, even if they all inherit a parent common card. I want a bigger freedom to customize these cards."
bfCard is the slot-based inheritance root. It owns the shared chrome and exposes anatomy sockets: media, chips, default, actions.
Typed wrappers are thin and prop-based. bfCardInsight, bfCardProject, bfCardFeatured, bfCardPerson, bfCardProgram, bfCardRow each take one entity prop (insight: Insight) plus presentation flags, and fill the base's slots. Per-card freedom, shared chrome in one place.
Shared behaviour goes in composables, not mixins. useExcerpt(), useCardChips(), useMediaRatio(). Options-API extends/mixins is the old inheritance mechanism — composables are its Vue 3 replacement and what we standardize on.
Shared prop contracts are TS interfaces, intersected: defineProps<CardBaseProps & { insight: Insight }>().
inheritAttrs: false + v-bind="$attrs" on the base so wrappers stay transparent to composition classes.
The base stays public. When a typed wrapper doesn't fit, pages may use bfCard + slots directly.
Rule of three before a prop grows: the slot version must appear twice before a wrapper gains a prop for it. The wireframes count as occurrence one.
Card behaviours that must survive the port
Equal height in grids — > :last-child { margin-block-start: auto } pushes the CTA to the bottom.
Stretched heading link, not whole-card link. The ds/ccmCard pattern wraps the entire card in one <a>, which forbids nested links and hurts screen-reader output. wfCard's stretched-heading-link allows nested chip/CTA links. Adopt the wf pattern.
Real content tolerance. Legacy excerpts run 100–980 chars and contain HTML entities. Components must not assume lorem-length text; decoding happens in the data layer (E1), not here.
Sub-items
The card family (build 1 first — everything else inherits from it):
BF-190 — bfCard base (slot-based inheritance root)
BF-192 — bfCardInsight
BF-193 — bfCardProject
BF-195 — bfCardFeatured
BF-197 — bfCardPerson
BF-200 — bfCardProgram
BF-202 — bfCardRow (list-row variant)
The rest:
BF-204 — bfBreadcrumb
BF-205 — bfByline (resolve the ccmByLine naming collision)
BF-207 — bfFormField + bfFormGroup
BF-209 — bfFilterBar
BF-211 — bfAccordion
BF-213 — Load more / pagination
Dependencies
Needs E2 (atoms) — cards compose bfChip, bfMedia, bfTime, bfButton. Entity types come from E0 sub-item 7.

**Sub-items (13) — first line of description each:**

- **BF-190 — E3.1 — bfCard base (slot-based inheritance root)**: Objective
- **BF-192 — E3.2 — bfCardInsight**: Objective
- **BF-193 — E3.3 — bfCardProject**: Objective
- **BF-195 — E3.4 — bfCardFeatured**: Objective
- **BF-197 — E3.5 — bfCardPerson**: Objective
- **BF-200 — E3.6 — bfCardProgram**: Objective
- **BF-202 — E3.7 — bfCardRow (list-row variant)**: Objective
- **BF-204 — E3.8 — bfBreadcrumb**: Objective
- **BF-205 — E3.9 — bfByline (resolve the ccmByLine naming collision)**: Objective
- **BF-207 — E3.10 — bfFormField + bfFormGroup**: Objective
- **BF-209 — E3.11 — bfFilterBar**: Objective
- **BF-211 — E3.12 — bfAccordion**: Objective
- **BF-213 — E3.13 — Load more / pagination**: Objective

---

### BF-154 — E4 — Organisms (bf-*): chrome, hero, sections, grids

Epic E4 — Organisms (bf-*). Page-level composite regions: site chrome, heros, section bands, grids, search.
Shared context
Source docs: _process/scoping/atomic-component-inventory.md (Level 3 — Organisms table) and _process/scoping/architecture-and-epics.md (ADR-1).
Location: src/components/bf/organisms/ · auto-imported as <bf-*>.
Wireframe reference: src/components/wireframe/ — wfSection (26 uses) and wfPageHeader (9 uses) are the two workhorses of the entire interface.
Slots vs props (ADR-1, ratifying the gap Front 2 left open)
Front 2 recorded a slots-vs-props decision for cards only. This epic closes the rest:
Sections + page header: slot-based with convenience props (label, heading, layout). Sections hold arbitrary content, so slots are the primary interface.
Hero: props + an actions slot. Structured content in, free-form buttons through the slot.
Grids: thin data-in / cards-out wrappers over the .grid primitive — they encode column policy and equal-height, nothing more.
The IA shift to keep in mind
The legacy site's chrome is a left rail (legacy/Frame.vue — logo, nav, search, social, menu trigger, plus OffCanvas drawer). The new UX is a top bar. This is a rebuild, not a port: nav content currently hardcoded across four legacy components (MainNav, OffCanvas, PlatformNav, dead Header) is replaced by one data-driven registry. ds/ccmTopbar is a hardcoded placeholder — treat it as a name, not a base.
Known defects to fix while porting
ccmSection: the fullWidth prop has no CSS behind it (silent no-op), and props leak onto the DOM as junk attributes (image-left etc. rendered on <section>). Fix both in bfSection.
7 raw grid overrides: wireframe pages bypass .grid with inline grid-template-columns: repeat(N, 1fr), contradicting the fluid data-min-width contract. The grid organisms replace these (tracked in E0 sub-item 4).
Nav/footer take props. They read nothing themselves — the layout reads the nav registry (E1 sub-item 5) and passes it down.
Sub-items
BF-163 — bfNav (data-driven top bar)
BF-164 — bfFooter
BF-166 — bfHero
BF-167 — bfPageHeader (the 9× workhorse)
BF-168 — bfSection (the 26× workhorse; fixes the fullWidth no-op + prop leak)
BF-169 — bfCtaSection
BF-170 — bfNotice
BF-171 — bfGridInsights + bfGridProjects
BF-172 — Search shell
BF-173 — Cross-links row
BF-174 — Modal decision: person bio / video (decision, not a build)
Dependencies
Needs E2 + E3. bfNav/bfFooter also need the nav registry shape from E1 sub-item 5 — the components can be built against a fixture before that lands.

**Sub-items (11) — first line of description each:**

- **BF-163 — E4.1 — bfNav (data-driven top bar)**: Objective
- **BF-164 — E4.2 — bfFooter**: Objective
- **BF-166 — E4.3 — bfHero**: Objective
- **BF-167 — E4.4 — bfPageHeader**: Objective
- **BF-168 — E4.5 — bfSection**: Objective
- **BF-169 — E4.6 — bfCtaSection**: Objective
- **BF-170 — E4.7 — bfNotice**: Objective
- **BF-171 — E4.8 — bfGridInsights + bfGridProjects**: Objective
- **BF-172 — E4.9 — Search shell**: Objective
- **BF-173 — E4.10 — Cross-links row**: Objective
- **BF-174 — E4.11 — Modal decision: person bio / video**: Objective

---

### BF-155 — E5 — Templates & the wf-* → bf-* swap

Epic E5 — Templates & the wf-* → bf-* swap. The payoff epic: page templates rebuilt on bf-* components, wireframes retired, legacy stack deleted.
The goal state
Claudio, 2026-08-07: "The ideal scenario is that, after final wireframe validation from the client, we will be able to swap wf-* components with bf-* components."
Everything in E0–E4 exists to make this epic mechanical. Each page swap should be a component-name change plus a data-source change — not a redesign.
Gate
This epic does not start until the client has validated the wireframes. The wireframes at /wireframes/* are the artefact under review. Building templates before sign-off risks rebuilding them twice.
Shared context
Source docs: _process/scoping/atomic-component-inventory.md (Level 4 — Templates table) and _process/scoping/architecture-and-epics.md.
The 9 wireframe pages at src/pages/wireframes/ are the specification. Each has a production counterpart to replace.
Legacy production pages run on layouts/legacy-base.vue (429 lines) + public/global.css (3,676 lines).
Acceptance test for every page sub-item
The bf-* page renders the same content as its wf-* twin. Same records, same counts, same ordering, same chips, same empty states. Diff the rendered text if useful — this is the safety net that makes the swap provable rather than eyeballed.
Also required per page: light and dark mode checked, keyboard navigation works, heading hierarchy is valid (no duplicate h1 — a known legacy bug), and the page is verified on a running localhost, not just type-checked.
Two cleanups this epic finishes
The 3× duplicated "unknown page" fallback. insights/[slug].vue, projects/[slug].vue and [area].vue each carry identical not-found markup. One shared block replaces all three.
The legacy retirement. 23 components in src/components/legacy/**, plus dead code found in the 2026-08-07 sweep: legacy/Header.vue (0 refs), custom/projectCard.vue (0 refs), 6 demo-only ds/ components, layouts/{default,docs2,enhanced-hybrid}.vue, and the byte-identical duplicate of global.css in src/public/css-legacy/.
Sub-items
BF-194 — Site shell layout
Per-page swap (each acceptance-tested against its wf-* twin):
BF-196 — Home
BF-198 — Program hub
BF-199 — Insights index
BF-201 — Insight detail
BF-203 — Projects index
BF-206 — Project detail
BF-208 — About
BF-210 — Search
BF-212 — Archive
Cleanup:
BF-214 — Shared not-found block
BF-215 — Retire the legacy stack + dead code
Dependencies
Needs all of E0–E4. This is the only epic that hard-depends on E1 (data), since templates are where content actually gets queried.

**Sub-items (12) — first line of description each:**

- **BF-194 — E5.1 — Site shell layout**: Gate — work does not start until the client has validated the wireframes. The wf-* layer is the specification; if it changes after review, this ticket changes with it.
- **BF-196 — E5.2 — Home template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-198 — E5.3 — Program hub template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-199 — E5.4 — Insights index template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-201 — E5.5 — Insight detail template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-203 — E5.6 — Projects index template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-206 — E5.7 — Project detail template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-208 — E5.8 — About template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-210 — E5.9 — Search template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-212 — E5.10 — Archive template**: Gate — work does not start until the client has validated the wireframes. The wf-* page is the specification; if it changes after review, this ticket changes with it.
- **BF-214 — E5.11 — Shared not-found block**: Gate — work does not start until the client has validated the wireframes. The wf-* pages are the specification; if they change after review, this ticket changes with them.
- **BF-215 — E5.12 — Retire the legacy stack + dead code**: Gate — work does not start until the client has validated the wireframes. This is the last ticket in the epic: nothing here is deleted until every bf-* template above is live and verified.

---
