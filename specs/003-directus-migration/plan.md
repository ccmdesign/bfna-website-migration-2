# Implementation Plan: Contentful → Directus Migration

**Branch**: `003-directus-migration` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-directus-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the Nuxt frontend application from static JSON files to Directus API integration. Replace all data composables to fetch from Directus instead of importing static JSON, implement error handling with fallback to static JSON files, and add separate caching strategies for build-time and runtime. Generate Directus collection schemas for backend developer to configure Directus collections matching current data structure.

**Technical Approach**: Use Directus SDK (`@directus/sdk`) with Nuxt's `useAsyncData` for data fetching. Implement scroll-based loading for large datasets. Use Nuxt payload cache for build-time and in-memory cache with 5-minute TTL for runtime.

## Technical Context

**Language/Version**: TypeScript 5.0+ / JavaScript (ES2020+)  
**Primary Dependencies**: 
- Nuxt 4.2.0
- Vue 3.5.13
- @directus/sdk (to be installed)
- @vueuse/core 14.0.0 (for scroll-based loading utilities)
- @nuxt/content 3.7.1 (existing, may be used for fallback)

**Storage**: Directus CMS (external API), static JSON files (fallback during migration)  
**Testing**: Vitest (existing test setup), @nuxt/test-utils  
**Target Platform**: Node.js server (SSR), modern browsers (client-side)  
**Project Type**: Web application (Nuxt 3 SSR)  
**Performance Goals**: 
- Directus API response times < 500ms (95th percentile)
- Cache hit rate > 80%
- Build time increase < 30% compared to static JSON
- Content updates visible within 5 minutes

**Constraints**: 
- Must maintain exact data structure compatibility with current JSON format
- Zero breaking changes to component interfaces
- Must support both build-time and runtime data fetching
- Fallback to static JSON files required during migration period

**Scale/Scope**: 
- 9 data composables to migrate
- 17 Directus collections to configure
- ~500+ content items across collections
- Support for scroll-based loading (100 items per batch)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Reference**: `.specify/memory/constitution.md`

**Principles to Verify**:
- **I. "Good enough to work, ready to replace"**: ✅ This IS Phase 2 work - migrating from temporary static JSON to Directus. No optimization deferred - this is the optimization.
- **II. CSS-First for Presentation, Composables for Data**: ✅ Data operations handled via composables (`useAsyncData`, Directus SDK). No presentation logic in data layer.
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Using `useAsyncData` (Nuxt built-in), `@directus/sdk` (established library), `@vueuse/core` for scroll utilities. No custom implementations.

**Decision Framework**: Applied - This is Phase 2 data layer migration, explicitly in scope per constitution.

**Compliance Status**: ✅ Compliant

**Justification**: 
- This migration is Phase 2 work per constitution (data layer improvements)
- Uses Nuxt built-ins (`useAsyncData`) and established libraries (`@directus/sdk`)
- Data operations in composables, no presentation logic
- No custom implementations - leveraging ecosystem

## Project Structure

### Documentation (this feature)

```text
specs/003-directus-migration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── directus-api.md  # Directus API integration contracts
├── directus-schemas/    # Already created - Directus collection schemas
├── frontend-changes/    # Already created - Frontend migration guide
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bfna-website-nuxt/
├── src/
│   ├── composables/
│   │   └── data/              # Data composables (9 files to migrate)
│   │       ├── useProducts.ts
│   │       ├── usePublications.ts
│   │       ├── useVideos.ts
│   │       ├── useInfographics.ts
│   │       ├── usePeople.ts
│   │       ├── useWorkstreams.ts
│   │       ├── useWorkstream.ts
│   │       ├── usePodcasts.ts
│   │       ├── useNews.ts
│   │       └── useAnnouncements.ts
│   ├── utils/
│   │   └── directus.ts        # NEW: Directus client utility
│   ├── types/
│   │   └── directus.ts        # NEW: Directus TypeScript types
│   └── content/
│       └── data/               # Static JSON files (kept as fallback)
│           ├── products.json
│           ├── publications.json
│           └── ... (other JSON files)
├── scripts/
│   └── generate-search-index.ts  # Update to use Directus
└── .env                         # Add DIRECTUS_URL and DIRECTUS_TOKEN
```

**Structure Decision**: Single Nuxt application. New files: `src/utils/directus.ts` for Directus client, `src/types/directus.ts` for TypeScript types. Existing composables in `src/composables/data/` will be updated. Static JSON files remain as fallback.

## Complexity Tracking

> **No violations** - All implementations use Nuxt built-ins and established libraries.

## Phase 0: Research

See [research.md](./research.md) for detailed research findings.

**Key Research Areas**:
1. Directus SDK integration patterns with Nuxt 3
2. Caching strategies for build-time vs runtime in Nuxt
3. Error handling patterns with fallback mechanisms
4. Scroll-based loading implementation with VueUse
5. TypeScript type generation from Directus schemas

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions.

**Key Entities**:
- Product, Publication, Video, Infographic, Podcast, News (content items)
- Person (team members)
- Workstream (content categories)
- Announcement (singleton)

**Relationships**: Junction tables for updates/homepage features (publication_updates, video_updates, etc.)

### API Contracts

See [contracts/directus-api.md](./contracts/directus-api.md) for API integration contracts.

**Key Contracts**:
- Directus client initialization
- Collection query patterns
- Error handling interface
- Caching interface
- Scroll-based loading interface

### Quickstart Guide

See [quickstart.md](./quickstart.md) for implementation quickstart.

**Quickstart Sections**:
- Prerequisites (Directus instance, environment variables)
- Installation steps (SDK, client setup)
- Migration steps (composable-by-composable)
- Testing checklist
- Rollback procedure

## Phase 2: Implementation Tasks

*Note: Tasks will be generated by `/speckit.tasks` command, not this plan.*

**High-Level Task Groups**:
1. Setup: Install SDK, create client utility, configure env vars
2. Migrate Composables: Update each composable to use Directus
3. Error Handling: Implement fallback to static JSON
4. Caching: Implement build-time and runtime caching
5. Scroll Loading: Implement infinite scroll for large datasets
6. Testing: Verify all pages work, test error handling
7. Documentation: Update search index generation, document changes

## Dependencies & Prerequisites

**External Dependencies**:
- Directus instance must be provisioned and accessible
- Directus collections must be created using provided schemas
- Sample data must be imported into Directus for testing

**Internal Dependencies**:
- Nuxt 4.2.0+ (already installed)
- Vue 3.5.13+ (already installed)
- @vueuse/core 14.0.0+ (already installed)
- @directus/sdk (to be installed)

**Environment Variables**:
- `DIRECTUS_URL` - Directus API endpoint
- `DIRECTUS_TOKEN` - Directus authentication token

## Risk Assessment

**Low Risk**:
- Using established Directus SDK
- Fallback to static JSON provides safety net
- No breaking changes to component interfaces

**Medium Risk**:
- Build-time performance impact (mitigated by payload cache)
- Cache invalidation complexity (mitigated by 5-minute TTL)
- Scroll-based loading UX (mitigated by VueUse utilities)

**Mitigation Strategies**:
- Incremental migration (one composable at a time)
- Keep static JSON files during migration
- Comprehensive testing at each step
- Monitor build times and API response times

## Success Metrics

- ✅ All 9 composables fetch from Directus successfully
- ✅ Zero breaking changes to components
- ✅ API response times < 500ms (95th percentile)
- ✅ Cache hit rate > 80%
- ✅ Build time increase < 30%
- ✅ Content updates visible within 5 minutes
- ✅ Zero unhandled errors in production
