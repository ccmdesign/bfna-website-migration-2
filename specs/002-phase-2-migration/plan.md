# Implementation Plan: Phase 2 Migration - Component Architecture & Optimization

**Branch**: `002-phase-2-migration` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-phase-2-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Phase 2 migration focuses on consolidating duplicate workstream page files into a single dynamic route template, eliminating code duplication in the updates page through reusable composables and components, centralizing hero image configuration, generating navigation links dynamically from data, and creating a reusable base layout. The implementation leverages Nuxt Content for content file management, uses Vue composables for data operations, and maintains backward compatibility with legacy pages.

## Technical Context

**Language/Version**: TypeScript 5.0+, Vue 3.5.13, Nuxt 4.2.0  
**Primary Dependencies**: `@nuxt/content` (^3.7.1), `@nuxt/image` (^2.0.0), `@vueuse/core` (^14.0.0), `@vueuse/nuxt` (^14.0.0)  
**Storage**: Static JSON files in `src/content/data/` (migrating to individual Nuxt Content format files in `src/content/workstreams/`)  
**Testing**: Vitest via `@nuxt/test-utils` (testing infrastructure setup deferred to implementation phase)  
**Target Platform**: Web (SSR-enabled Nuxt application, static site generation for production)  
**Project Type**: Web application (Nuxt/Vue SPA with SSR)  
**Performance Goals**: Lighthouse scores 90+ for Performance, SEO, and Accessibility; optimal LCP via hero image preloading; zero CLS via explicit image dimensions  
**Constraints**: Must maintain backward compatibility with legacy pages using `legacy-base` layout; preserve existing URL structure with redirects; support same browser compatibility as legacy implementation  
**Scale/Scope**: 4 workstream pages (consolidating to 1 dynamic route), 1 updates page (eliminating tab duplication), navigation with 4-5 workstream links, hero images for multiple page themes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Reference**: `.specify/memory/constitution.md`

**Principles to Verify**:
- **I. "Good enough to work, ready to replace"**: ✅ Compliant - Plan explicitly defers CMS migration (Directus), design system integration, and data layer optimization to future phases. Focuses on component architecture improvements and duplication elimination.
- **II. CSS-First for Presentation, Composables for Data**: ✅ Compliant - Filter state management uses composables (`useCardFilters`), data transformation uses computed properties, presentation handled via CSS classes and existing CSS structure. Hero image preloading uses HTML `<link>` tags (presentation layer).
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Compliant - Uses `@nuxt/content` for content file management and route generation, `@nuxt/image` for image optimization, `useAsyncData`/`useFetch` for data fetching, VueUse composables for data operations, file-based routing for dynamic routes.

**Decision Framework**: Applied during spec creation - all scope decisions align with constitution principles. Phase 2 explicitly excludes Contentful optimization, design system integration, and CMS migration.

**Compliance Status**: ✅ Compliant

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   ├── legacy/              # Legacy components (molecules, organisms, etc.)
│   │   └── templates/            # Template-level components
│   ├── composables/
│   │   ├── data/                 # Data fetching composables (useWorkstreams, etc.)
│   │   └── legacy/                # Legacy UI composables (useCardFilters, etc.)
│   ├── content/
│   │   ├── data/                 # Static JSON data files (legacy format)
│   │   └── workstreams/          # Individual Nuxt Content format files (new)
│   ├── layouts/
│   │   ├── base.vue              # New reusable base layout
│   │   └── legacy-base.vue       # Legacy layout (maintained for backward compatibility)
│   ├── pages/
│   │   ├── workstreams/
│   │   │   └── [slug].vue        # Dynamic workstream route (new)
│   │   ├── democracy.vue         # Legacy route (to be removed after redirect setup)
│   │   ├── digital-world.vue     # Legacy route (to be removed after redirect setup)
│   │   ├── future-leadership.vue # Legacy route (to be removed after redirect setup)
│   │   ├── politics-society.vue  # Legacy route (to be removed after redirect setup)
│   │   └── updates.vue          # Updates page (to be refactored)
│   └── server/
│       └── api/                  # API routes (if needed for redirects)
└── tests/                        # Test files (deferred to implementation phase)
```

**Structure Decision**: Single Nuxt web application. All application code lives in `src/` directory. Content files migrate from single JSON file (`src/content/data/workstreams.json`) to individual Nuxt Content format files (`src/content/workstreams/{slug}.json`). Dynamic routes use Nuxt's file-based routing with `[slug].vue` pattern. Legacy pages maintained temporarily for redirect setup, then removed.

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

**Reference**: `.specify/memory/constitution.md`

**Principles Verified**:
- **I. "Good enough to work, ready to replace"**: ✅ Compliant - Design uses Nuxt Content for content management (temporary solution), defers CMS migration and design system integration. Focuses on architectural improvements without optimizing data layer.
- **II. CSS-First for Presentation, Composables for Data**: ✅ Compliant - Filter logic uses composables (`useUpdatesFilters`), data transformation uses computed properties, hero image preloading uses HTML `<link>` tags. Presentation handled via existing CSS structure.
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Compliant - Uses `queryContent()` from `@nuxt/content`, `useAsyncData()` for data fetching, file-based routing for dynamic routes, `useHead()` for head management. No custom implementations where Nuxt/VueUse can handle it.

**Decision Framework**: All design decisions align with constitution principles. No violations identified.

**Compliance Status**: ✅ Compliant

---

## Phase 0: Research - COMPLETE

**Output**: `research.md`

**Status**: All technical decisions documented. No blocking unknowns. Ready for implementation.

---

## Phase 1: Design & Contracts - COMPLETE

**Outputs**:
- `data-model.md` - Entity definitions, relationships, validation rules
- `contracts/interfaces.md` - Composable and component contracts
- `quickstart.md` - Step-by-step implementation guide
- Agent context updated (`cursor-agent`)

**Status**: All design artifacts generated. Ready for Phase 2 task breakdown.

---

## Implementation Readiness

**Ready for**: `/speckit.tasks` command to generate task breakdown

**Blockers**: None

**Dependencies**: 
- Data migration script (can be created during implementation)
- Nuxt Content collection configuration (documented in quickstart)

**Next Steps**: Run `/speckit.tasks` to generate detailed implementation tasks.
