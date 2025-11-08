# Implementation Plan: Phase 1 Website Platform Migration

**Branch**: `001-nuxt-migration` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nuxt-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the BFNA website from Eleventy (11ty) to Nuxt 3, preserving legacy CSS and using static data extraction for Phase 1 component migration. The goal is to achieve 100% visual parity with the legacy platform while maintaining exact HTML structure and CSS classes. All Contentful content is extracted once as static JSON files, eliminating Contentful dependency from the Nuxt application. The migration follows a "good enough to work, ready to replace" principle, deferring all data layer optimizations to Phase 2.

## Technical Context

**Language/Version**: TypeScript 5.0+, Vue 3.5+, Nuxt 4.2.0 (Nuxt 3.13 runtime with Nuxt 4 compatibility date)  
**Primary Dependencies**: Nuxt 4, Vue 3, VueUse (@vueuse/core), @nuxt/image, @nuxt/content, Pinia  
**Storage**: Static JSON files (extracted from Contentful, stored in `src/content/data/`)  
**Testing**: Vitest, @nuxt/test-utils, Playwright (for visual regression testing)  
**Target Platform**: Web (SSR/SSG), Node.js runtime, deployable to Netlify/Vercel  
**Project Type**: Web application (Nuxt SSR/SSG)  
**Performance Goals**: Build time <5 minutes (SC-004), search results <300ms (SC-006), page load matching legacy platform  
**Constraints**: Must maintain exact HTML structure and CSS classes, zero Contentful dependency, independent deployment capability  
**Scale/Scope**: ~11 page types, 8 content types (products, publications, videos, infographics, team, podcasts, news, announcements), ~600+ content items total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Reference**: `.specify/memory/constitution.md`

**Principles to Verify**:
- **I. "Good enough to work, ready to replace"**: ✅ Compliant - Plan uses static JSON files, defers all Contentful optimization and data model refactoring to Phase 2. No Contentful SDK integration, no caching layers, no data validation.
- **II. CSS-First for Presentation, Composables for Data**: ✅ Compliant - All responsive behavior handled via CSS media queries. Data operations (search debouncing, filtering, lazy loading) use VueUse composables (`useDebounce`, `useIntersectionObserver`). Data fetching uses Nuxt built-ins (`useAsyncData`, `useFetch`).
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Compliant - Using Nuxt file-based routing, `useAsyncData`/`useFetch` for data, VueUse for utilities, `<NuxtImg>` for images. No custom implementations for functionality available in ecosystem.

**Decision Framework**: Applied throughout - Contentful integration, image optimization, and data layer improvements all deferred to Phase 2 per framework questions 1-3.

**Compliance Status**: ✅ Compliant

## Project Structure

### Documentation (this feature)

```text
specs/001-nuxt-migration/
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
│   ├── components/
│   │   ├── legacy/              # Migrated Nunjucks templates as Vue components
│   │   │   ├── atoms/           # Atomic design: smallest components
│   │   │   ├── molecules/       # Atomic design: component groups
│   │   │   ├── organisms/       # Atomic design: complex components
│   │   │   └── templates/       # Atomic design: page-level templates
│   │   ├── ds/                  # Existing DS components (preserved, not used in Phase 1)
│   │   └── [existing components]
│   ├── composables/
│   │   ├── legacy/              # Migrated Eleventy filters as composables
│   │   │   ├── useSearch.ts     # Migrated from search.js
│   │   │   ├── useCardFilters.ts # Migrated from cardFilters.js
│   │   │   └── useTypeWriter.ts  # Migrated from typeWriterEffect.js
│   │   ├── data/                # Data fetching composables
│   │   │   ├── useProducts.ts   # Reads from static JSON
│   │   │   ├── usePublications.ts
│   │   │   ├── useVideos.ts
│   │   │   └── [other content types]
│   │   └── [existing composables]
│   ├── content/
│   │   └── data/                # Static JSON files from Contentful extraction
│   │       ├── products.json
│   │       ├── publications.json
│   │       ├── videos.json
│   │       └── [other content types]
│   ├── layouts/
│   │   ├── legacy/              # Migrated Eleventy layouts
│   │   │   └── base.vue         # Migrated from base.njk
│   │   └── [existing layouts]
│   ├── pages/
│   │   ├── index.vue            # Homepage
│   │   ├── about.vue
│   │   ├── team.vue
│   │   ├── products/
│   │   │   └── [slug].vue
│   │   ├── publications/
│   │   │   └── [slug].vue
│   │   └── [other page types]
│   ├── public/
│   │   ├── css-legacy/          # Legacy CSS files (preserved, unplugged)
│   │   │   ├── global.css
│   │   │   └── [other CSS files]
│   │   ├── favicon/             # Copied from legacy
│   │   ├── files/               # Copied from legacy
│   │   ├── fonts/               # Copied from legacy
│   │   └── images/              # Copied from legacy
│   └── server/
│       └── api/
│           └── search.json.ts   # Search index endpoint (if needed)
├── nuxt.config.ts               # Nuxt configuration (legacy CSS unplugged)
└── package.json
```

**Structure Decision**: Web application structure using Nuxt's file-based routing and component organization. Legacy components organized under `components/legacy/` following atomic design principles. Legacy CSS preserved in `public/css-legacy/` but unplugged from `nuxt.config.ts`. Static data files stored in `src/content/data/` for easy access via composables.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - plan is compliant with all constitution principles.
