# Shared context — BFNA website overhaul (read first in every front session)

**Repo**: `bfna-website-migration-2` (this repo) = the NEW BFNA site. Nuxt 3 (`bfna-website-nuxt/src/`) + Directus (`https://bfna.simplyas.com`) via build-time importer (`contentImporter.js` → gitignored `content/*.json` → `@nuxt/content` collections). Ignore the current live 11ty/Contentful site entirely — this WIP repo is the product. Branch model: work on `dev`, `main` = production.

**Framing**: Data/Content = greenfield per GGS recommendations. UX = greenfield per GGS. UI/Branding = brownfield — evolve under existing BFNA branding, NO rebrand.

**Taxonomy (current best answer, pending Irene)**: Irene's Jul 29 2026 email supersedes GGS: **3** focus areas (not 4). Politics & Society → "Transatlantic Relations & Global Challenges"; Digital Economy/World dropped; Barometer/RANGE/Periscope become projects/programs under the renamed area. GGS ontology: Focus Areas (topics) / Programs (initiatives) / Insights (outputs), tagged, with visibility tiers (recent featured → 3+ years auto-archive; **archive ≠ delete**, stays indexed for AI SEO).

**Scoping docs** (all in `_process/scoping/`):
- `schema-draft.md` — proposed Directus collections: `focus_areas`, `programs`, `insights`
- `contentful-consolidation-plan.md` — Contentful→Directus sync/cutover (drift exists both ways)
- `archive-content-plan.md` — tier behavior; 296 of ~400 items (74%) are 3+ years old
- `questions-for-irene.md` — 15 questions + 8 GGS contradictions/gaps (call week of Aug 3 2026)
- `features.md` — 9 high-level features; AI searchability is the headline

**Process**: Claudio is answering the open questions/conflicts in a separate doc and will supply it back to each front session. Until then: plan around the questions, flag decisions as PENDING, do not implement against unanswered ones. No Directus writes in scoping phase.

**The 4 fronts** (each has its own brief in this folder):
1. `01-backend.md` — Directus schema, content migration/consolidation, importer
2. `02-ux-ia.md` — wireframes, information architecture, navigation, page templates
3. `03-design-system.md` — components visually close to old site, matching new UX
4. `04-features.md` — functional features (AI schema/SEO, search, newsletter, archive behavior)
