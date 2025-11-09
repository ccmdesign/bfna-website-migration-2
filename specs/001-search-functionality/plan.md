# Implementation Plan: Search Functionality

**Branch**: `001-search-functionality` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-search-functionality/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement search functionality that generates a search index from static JSON data files, provides a server API endpoint for search queries, and integrates search inputs across header, footer, and mobile menu components. The implementation must match legacy behavior exactly, including substring matching, 550ms debounce timing, and search text generation (combine fields, strip HTML, lowercase, deduplicate words).

## Technical Context

**Language/Version**: TypeScript 5.0+, Node.js (via Nuxt 4.2.0)  
**Primary Dependencies**: Nuxt 4.2.0, Vue 3.5.13, @vueuse/core 14.0.0, @nuxt/content 3.7.1  
**Storage**: Static JSON files (`src/content/data/publications.json`, `videos.json`, `infographics.json`), generated `public/search.json`  
**Testing**: Vitest via @nuxt/test-utils  
**Target Platform**: Web (SSR-enabled Nuxt application)  
**Project Type**: Web application (Nuxt/Vue)  
**Performance Goals**: Search results returned in under 300ms per query (SC-006), initial search results within 3 seconds (SC-001), live search updates within 1 second after typing stops (SC-002)  
**Constraints**: Must match legacy behavior exactly (550ms debounce, substring matching, search text generation), no external API dependencies (SC-004), all search result URLs must navigate correctly without 404 errors (SC-003)  
**Scale/Scope**: Static content search across publications, videos, and infographics (~hundreds of items), single-page search results (no pagination)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Reference**: `.specify/memory/constitution.md`

**Principles to Verify**:
- **I. "Good enough to work, ready to replace"**: ✅ Compliant - Using static JSON files (temporary data layer), no Contentful optimization, search index generation is simple build-time script
- **II. CSS-First for Presentation, Composables for Data**: ✅ Compliant - Search UI uses existing CSS/card components, search logic in composable (`useSearch.ts`), debouncing via VueUse `useDebounceFn`
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Compliant - Using Nuxt server API routes (`server/api/search.get.ts`), VueUse for debouncing, Nuxt built-ins for data fetching

**Decision Framework**: Applied the 7-question framework:
1. ✅ Not Contentful-specific (using static JSON)
2. ✅ Not image optimization
3. ✅ Data fetching uses static JSON files (Phase 1 approach)
4. ✅ Component structure/UI (search inputs in Header/Footer/OffCanvas)
5. ✅ CSS/styling (existing card components)
6. ✅ Using Nuxt built-ins (server API routes) and VueUse (debouncing)
7. ✅ Presentation via CSS, data operations via composables

**Compliance Status**: ✅ Compliant

## Project Structure

### Documentation (this feature)

```text
specs/001-search-functionality/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bfna-website-nuxt/
├── src/
│   ├── server/
│   │   └── api/
│   │       └── search.get.ts          # Search API endpoint
│   ├── composables/
│   │   └── legacy/
│   │       └── useSearch.ts           # Search composable (update existing)
│   ├── pages/
│   │   └── search.vue                  # Search page (update existing)
│   ├── components/
│   │   └── legacy/
│   │       └── organisms/
│   │           ├── Header.vue         # Update search input integration
│   │           ├── Footer.vue         # Update search input integration
│   │           └── OffCanvas.vue      # Update search input integration
│   └── content/
│       └── data/
│           ├── publications.json      # Source data
│           ├── videos.json            # Source data
│           └── infographics.json       # Source data
├── scripts/
│   └── generate-search-index.ts        # Build-time search index generation
├── public/
│   └── search.json                     # Generated search index (build output)
└── package.json                        # Add search index generation script
```

**Structure Decision**: Web application structure using Nuxt 4 conventions. Search index generation script runs at build time, server API endpoint handles search queries, composable manages client-side search state and debouncing, components integrate search inputs.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all principles compliant.

## Phase 0: Research Complete

**Status**: ✅ Complete  
**Output**: [research.md](./research.md)

All technical decisions resolved:
- Search index generation approach (build-time, static file)
- Search text processing (match legacy squash filter)
- Search API endpoint pattern (Nuxt server API route)
- Search matching algorithm (substring matching)
- Debouncing approach (VueUse, 550ms)
- URL normalization (build-time)
- Component integration (localStorage, composable)
- Error handling (empty results + server logging)
- Input normalization (trim whitespace)

## Phase 1: Design Complete

**Status**: ✅ Complete  
**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions, relationships, data flow
- [contracts/search-api.md](./contracts/search-api.md) - API contract and OpenAPI schema
- [quickstart.md](./quickstart.md) - Developer quickstart guide

**Agent Context**: Updated `.cursor/rules/specify-rules.mdc` with feature technology stack.

## Phase 2: Planning Complete

**Status**: ✅ Complete

All planning artifacts generated. Ready for `/speckit.tasks` to create implementation tasks.

## Summary

Implementation plan complete with:
- ✅ Technical context defined
- ✅ Constitution compliance verified
- ✅ Research decisions documented
- ✅ Data model defined
- ✅ API contracts specified
- ✅ Quickstart guide created
- ✅ Agent context updated

**Next Command**: `/speckit.tasks` to generate implementation tasks.
