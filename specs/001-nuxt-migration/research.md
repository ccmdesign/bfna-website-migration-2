# Research: Phase 1 Website Platform Migration

**Date**: 2025-01-27  
**Feature**: Phase 1 Website Platform Migration  
**Plan**: [plan.md](./plan.md)

## Overview

This document consolidates research findings and technical decisions for the Phase 1 migration from Eleventy to Nuxt 3. All technical choices align with the constitution principles and migration strategy.

## Technical Decisions

### Static Data Extraction Strategy

**Decision**: Extract all Contentful content once as static JSON files, eliminate Contentful dependency entirely from Nuxt application.

**Rationale**: 
- Simplifies migration by removing network dependencies and API complexity
- Enables easier testing with predictable, version-controlled data
- Provides clean separation between Phase 1 (component migration) and Phase 2 (CMS migration)
- Eliminates risk of Contentful API changes, token expiration, or network issues

**Alternatives considered**:
- **Contentful SDK integration**: Rejected - adds unnecessary complexity for temporary data layer (Phase 1 principle: "good enough to work, ready to replace")
- **Hybrid approach**: Rejected - mixing static and API calls adds complexity without benefit
- **Direct Contentful queries**: Rejected - violates Phase 1 scope constraints

**Implementation**: Use existing `scripts/extract-contentful-data.js` in legacy repo, copy JSON files to `src/content/data/`, create thin composables using `useAsyncData()`/`useFetch()`.

### CSS Preservation Strategy

**Decision**: Copy all legacy CSS files exactly as-is to `public/css-legacy/`, preserve but "unplug" from `nuxt.config.ts` (comment out or conditionally disable).

**Rationale**:
- Preserves CSS for future Phase 2+ integration with DS components
- Maintains exact styling during Phase 1 migration
- Enables easy re-enabling when needed for DS component integration

**Alternatives considered**:
- **Migrate CSS to new structure**: Rejected - violates "preserve exactly" requirement and adds unnecessary work
- **Delete legacy CSS**: Rejected - needed for future DS integration
- **Active CSS integration**: Rejected - Phase 1 focuses on component migration, not CSS refactoring

**Implementation**: Copy entire `bfna-website-legacy/src/assets/css` tree to `bfna-website-nuxt/src/public/css-legacy/`, create `legacy-styles.css` with `@import` statements, disable in `nuxt.config.ts`.

### Component Migration Approach

**Decision**: Migrate Nunjucks templates to Vue components maintaining exact HTML structure and CSS classes, organize using atomic design principles.

**Rationale**:
- Maintains visual parity requirement (FR-001, SC-001)
- Atomic design provides clear organization for future refactoring
- Preserves all styling through exact class preservation

**Alternatives considered**:
- **Refactor components during migration**: Rejected - violates "minimal refactors" principle
- **Skip component organization**: Rejected - needed for maintainability and Phase 2 readiness

**Implementation**: Create `components/legacy/` structure with atoms/molecules/organisms/templates, migrate each `.njk` template to `.vue` component preserving HTML structure.

### Data Fetching Pattern

**Decision**: Use Nuxt built-ins (`useAsyncData`, `useFetch`) with static JSON files, prefer VueUse utilities for data operations.

**Rationale**:
- Aligns with Constitution Principle III (Leverage Nuxt Built-ins)
- Provides SSR/SSG support out of the box
- VueUse utilities handle common patterns (debouncing, intersection observer)

**Alternatives considered**:
- **Custom fetch wrapper**: Rejected - Nuxt built-ins provide better SSR/SSG support
- **Axios/fetch directly**: Rejected - loses Nuxt SSR benefits and caching
- **Pinia for all state**: Rejected - `useState` sufficient for component-level state

**Implementation**: Create composables in `composables/data/` using `useAsyncData()` to read from static JSON files.

### Error Handling Strategy

**Decision**: Implement minimal error handling (basic 404 page, generic error messages, no loading states).

**Rationale**:
- Aligns with "good enough to work" principle
- Keeps Phase 1 focused on core migration
- Error handling improvements deferred to Phase 2

**Alternatives considered**:
- **Comprehensive error handling**: Rejected - violates Phase 1 scope, adds unnecessary complexity
- **Match legacy exactly**: Rejected - legacy may have inconsistent error handling, minimal approach is cleaner

**Implementation**: Create basic `error.vue` layout, generic error messages in composables, no loading state indicators.

### Browser Compatibility

**Decision**: Match legacy platform's browser support exactly (verify browser list from legacy and maintain identically).

**Rationale**:
- Ensures no regression in browser support
- Maintains user experience parity
- Avoids introducing new compatibility requirements

**Alternatives considered**:
- **Modern browsers only**: Rejected - may exclude legacy users
- **ES6+ only**: Rejected - may not match legacy support

**Implementation**: Verify browser support list from legacy platform documentation/analytics, configure Nuxt/Babel to match.

### Image Handling

**Decision**: Use `<NuxtImg>` component out of the box, do not migrate Contentful-specific image optimization filters.

**Rationale**:
- Aligns with Constitution Principle III (use Nuxt modules)
- `<NuxtImg>` provides built-in optimization
- Contentful filters deferred to Phase 2 per scope constraints

**Alternatives considered**:
- **Migrate contentfulImage filter**: Rejected - violates Phase 1 scope (FR-014)
- **Custom image optimization**: Rejected - `<NuxtImg>` provides sufficient optimization

**Implementation**: Replace all image references with `<NuxtImg>` component, use image URLs from static JSON data.

### URL Redirect Handling

**Decision**: Match legacy platform's redirect rules exactly (verify legacy redirect behavior and replicate).

**Rationale**:
- Maintains SEO value and user experience
- Preserves existing URL structure
- Avoids broken links

**Alternatives considered**:
- **Basic redirects only**: Rejected - may miss important legacy redirects
- **New redirect strategy**: Rejected - violates "match legacy" requirement

**Implementation**: Extract redirect rules from legacy `_redirects` file, implement in Nuxt using route rules or Nitro middleware.

## Technology Stack Decisions

### Nuxt Version

**Decision**: Nuxt 4.2.0 (Nuxt 3.13 runtime with Nuxt 4 compatibility date).

**Rationale**: Provides latest features while maintaining compatibility, aligns with project's Nuxt 4 compatibility goal.

### Vue Version

**Decision**: Vue 3.5+ (as required by Nuxt 4).

**Rationale**: Required dependency, provides Composition API and modern reactivity.

### VueUse

**Decision**: Use `@vueuse/core` for data-related utilities (debouncing, intersection observer, etc.).

**Rationale**: Aligns with Constitution Principle III, provides well-tested utilities for common patterns.

### Testing Framework

**Decision**: Vitest + @nuxt/test-utils for unit/integration tests, Playwright for visual regression testing.

**Rationale**: Vitest integrates well with Nuxt, Playwright enables visual parity verification (SC-001).

## Open Questions Resolved

### Nuxt Runtime Target

**Resolution**: Nuxt 4.2.0 with Nuxt 3.13 runtime - confirmed compatible and provides future-proofing.

### Eleventy Shortcodes/Filters

**Resolution**: Migrate non-Contentful filters to composables, defer Contentful filters to Phase 2 per scope constraints.

### Hosting Constraints

**Resolution**: Support Netlify-style redirects via Nuxt route rules, search index as Nitro endpoint or static JSON.

## References

- [Migration Spec Draft](../../../_process/migration-spec-draft.md)
- [Constitution](../../../../.specify/memory/constitution.md)
- [Feature Specification](./spec.md)

