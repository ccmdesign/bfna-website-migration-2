# Research: Phase 2 Migration - Component Architecture & Optimization

**Date**: 2025-01-27  
**Status**: Complete

## Overview

This research document consolidates findings for Phase 2 migration decisions. All technical context is well-defined from existing codebase analysis and specification requirements. No clarification needed - proceeding directly to design phase.

## Technology Choices

### Nuxt Content for Workstream Files

**Decision**: Use `@nuxt/content` module with individual JSON files in `content/workstreams/` directory.

**Rationale**:
- Already installed and configured (`@nuxt/content` ^3.7.1)
- Supports auto-discovery for route generation (FR-015)
- Enables content file-based data source (FR-003, SC-005)
- Provides built-in query API (`queryContent()`) for data fetching
- Supports static site generation at build time

**Alternatives Considered**:
- Single JSON file approach (current) - Rejected: Doesn't enable per-workstream content management, harder to scale
- Directus CMS integration - Rejected: Deferred to future phase per constitution
- Markdown files - Rejected: Workstream data is structured JSON, not prose content

### Dynamic Route Pattern

**Decision**: Use Nuxt file-based routing with `pages/workstreams/[slug].vue` pattern.

**Rationale**:
- Leverages Nuxt built-in routing (constitution principle III)
- Enables static site generation via Nuxt Content auto-discovery
- Supports 404 handling via `notFound()` helper
- Maintains URL structure with `/workstreams/{slug}` pattern

**Alternatives Considered**:
- Server-side API routes - Rejected: Adds unnecessary complexity, breaks static generation
- Client-side routing only - Rejected: Doesn't support SSR/SSG requirements

### Hero Image Configuration Strategy

**Decision**: Store hero configuration within each workstream content file, with default hero config in separate `content/data/hero-default.json` file.

**Rationale**:
- Centralizes configuration per workstream (FR-008)
- Enables fallback to default hero image (FR-009)
- Keeps configuration close to content data
- Supports theme-based hero selection

**Alternatives Considered**:
- Hardcoded image paths in components - Rejected: Violates FR-008, creates maintenance burden
- Separate hero config file per workstream - Rejected: Adds unnecessary file proliferation
- Environment variables - Rejected: Not appropriate for content-driven images

### Filter State Persistence

**Decision**: Use browser `sessionStorage` for filter state persistence when switching tabs.

**Rationale**:
- Meets requirement FR-007 for state persistence
- Provides graceful degradation (resets to defaults if corrupted)
- Uses browser built-in storage (no additional dependencies)
- Scope-limited to session (appropriate for filter state)

**Alternatives Considered**:
- URL query parameters - Rejected: Would require router manipulation, adds complexity
- Pinia store - Rejected: Overkill for simple filter state, adds dependency
- LocalStorage - Rejected: Persists across sessions unnecessarily

### Navigation Generation Pattern

**Decision**: Query all workstreams via Nuxt Content, filter by visibility flag, sort by navigation order field.

**Rationale**:
- Meets requirement FR-010 for dynamic navigation generation
- Uses Nuxt Content query API (leverages built-ins)
- Supports visibility filtering (FR-012)
- Enables automatic updates when workstreams added/removed

**Alternatives Considered**:
- Hardcoded navigation array - Rejected: Violates FR-010, creates maintenance burden
- Separate navigation config file - Rejected: Adds unnecessary abstraction layer
- Server API endpoint - Rejected: Breaks static generation, adds complexity

### Updates Page Tab Consolidation

**Decision**: Create reusable composable for tab content rendering, extract common filter logic to shared composable.

**Rationale**:
- Eliminates duplicate tab sections (FR-005)
- Maintains visual and functional parity
- Uses composables for data operations (constitution principle II)
- Reduces code duplication by 60%+ (SC-002)

**Alternatives Considered**:
- Keep duplicate tab sections - Rejected: Violates FR-005, increases maintenance burden
- Single unified component with props - Rejected: Would require significant refactoring, may break visual parity
- Separate components per content type - Rejected: Still creates duplication, doesn't solve root problem

## Implementation Patterns

### Hero Image Preloading

**Decision**: Use `<link rel="preload">` with `as="image"` and `fetchpriority="high"` in page `<head>`.

**Rationale**:
- Meets requirement FR-009a for optimal LCP performance
- Uses HTML standard approach (presentation layer)
- Supports explicit width/height attributes (FR-009b) to prevent CLS
- Leverages Nuxt `useHead()` composable for head management

### Legacy URL Redirects

**Decision**: Use Nuxt server middleware or `server/routes` for redirect handling.

**Rationale**:
- Meets requirement FR-002 for legacy URL preservation
- Supports pattern `/{slug}` → `/workstreams/{slug}`
- Works with static site generation
- Maintains SEO value of existing URLs

**Alternatives Considered**:
- Client-side redirects - Rejected: Poor SEO, slower user experience
- Netlify/Vercel redirects file - Rejected: Platform-specific, not portable
- Router navigation guards - Rejected: Only works client-side, breaks SSR

### Base Layout Structure

**Decision**: Create `layouts/base.vue` that includes Frame and Footer components, common head/meta elements.

**Rationale**:
- Meets requirement FR-013 for reusable base layout
- Prepares for future design system integration (SC-010)
- Maintains backward compatibility with `legacy-base` layout (FR-014)
- Uses Nuxt layout system (built-in functionality)

## Performance Considerations

### Static Site Generation

**Decision**: Use Nuxt Content's auto-discovery to generate all workstream routes at build time for production.

**Rationale**:
- Meets requirement FR-015 for static site generation
- Enables optimal performance (NFR-001, NFR-002)
- Supports development hybrid approach (on-demand generation)
- Leverages Nuxt built-in SSG capabilities

### Image Optimization

**Decision**: Use `@nuxt/image` component (`<NuxtImg>`) for hero images with explicit dimensions.

**Rationale**:
- Meets requirement FR-009b for CLS prevention
- Leverages Nuxt ecosystem (constitution principle III)
- Provides automatic image optimization
- Supports responsive images via srcset

## Conclusion

All technical decisions align with constitution principles and specification requirements. No blocking unknowns identified. Ready to proceed to Phase 1 design phase.

