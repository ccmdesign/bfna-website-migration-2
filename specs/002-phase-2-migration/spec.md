# Feature Specification: Phase 2 Migration - Component Architecture & Optimization

**Feature Branch**: `002-phase-2-migration`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Phase 2 Migration: Component Architecture & Optimization - Migrating barebones implementation to Nuxt way with structural improvements, duplication elimination, data-driven configuration, Nuxt Content integration, and framework leverage"

## Clarifications

### Session 2025-01-27

- Q: Should loading states be explicitly defined for async operations? → A: Minimal loading states (skeleton/spinner only for critical paths like workstream page load)
- Q: Should we explicitly document what's NOT included in Phase 2? → A: Add explicit out-of-scope section listing excluded areas
- Q: Should we specify exact fallback behaviors for "handle gracefully" cases? → A: Define specific fallback behaviors for each graceful handling case
- Q: How should the migration from existing JSON to Nuxt Content format be handled? → A: Manual one-time migration (script or manual process to convert JSON to individual files)
- Q: Where should the default hero image configuration be stored? → A: Separate default hero config file (e.g., `content/data/hero-default.json`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Workstream Content (Priority: P1)

Users need to access workstream pages (Democracy, Digital World, Future Leadership, Politics & Society) through consistent, maintainable routes that preserve existing URLs while enabling easier content management.

**Why this priority**: Workstream pages are core navigation destinations. Consolidating duplicate page files reduces maintenance burden and enables future content management improvements. Legacy URL preservation ensures no broken links for existing users and bookmarks.

**Independent Test**: Can be fully tested by navigating to any workstream page (e.g., `/democracy` or `/workstreams/democracy`) and verifying content displays correctly, legacy URLs redirect properly, and page structure matches existing functionality.

**Acceptance Scenarios**:

1. **Given** a user visits `/democracy`, **When** the page loads, **Then** they are redirected to `/workstreams/democracy` and see the Democracy workstream content
2. **Given** a user visits `/workstreams/digital-world`, **When** the page loads, **Then** they see the Digital World workstream content with correct heading, description, products, and updates
3. **Given** a user visits `/workstreams/invalid-workstream`, **When** the page loads, **Then** they see a 404 error page
4. **Given** content editors need to update workstream data, **When** they modify content files, **Then** changes appear on the workstream page without code changes

---

### User Story 2 - Browse Updates Content (Priority: P2)

Users need to browse publications, videos, infographics, and podcasts through a unified interface with consistent filtering and display patterns, reducing code duplication while maintaining current functionality.

**Why this priority**: Updates page serves as a content discovery hub. Eliminating duplication makes future enhancements easier and reduces bug surface area. Consistent patterns improve maintainability.

**Independent Test**: Can be fully tested by navigating to `/updates`, switching between content type tabs, applying filters, and verifying cards update in real-time as filters are selected with proper filtering behavior.

**Acceptance Scenarios**:

1. **Given** a user visits `/updates`, **When** they view the Publications tab, **Then** they see publication cards with filters available
2. **Given** a user is on the Videos tab, **When** they apply a filter, **Then** only matching video cards are displayed in real-time as the filter is selected
3. **Given** a user switches to the Podcasts tab, **When** the tab loads, **Then** they see podcast cards without filters (as podcasts don't require filtering)
4. **Given** a user applies filters on one tab, **When** they switch to another tab and return, **Then** their previous filter selections are preserved

---

### User Story 3 - View Hero Images (Priority: P3)

Users need to see appropriate hero images for each page theme without hardcoded image paths scattered across multiple files, enabling easier image management and updates.

**Why this priority**: Hero images are visual anchors for pages. Centralizing configuration reduces duplication and makes image updates simpler. Lower priority than content access but important for maintainability.

**Independent Test**: Can be fully tested by visiting pages with different themes (homepage, democracy, digital-world, etc.) and verifying correct hero images display with proper preloading (preload links in head with fetchpriority) and fallback handling.

**Acceptance Scenarios**:

1. **Given** a user visits the homepage, **When** the page loads, **Then** they see the default hero image
2. **Given** a user visits a Democracy workstream page, **When** the page loads, **Then** they see the Democracy-themed hero image
3. **Given** a user visits a page with an invalid theme, **When** the page loads, **Then** they see the default hero image as fallback
4. **Given** content editors need to update hero images, **When** they modify image configuration, **Then** changes appear on all pages using that theme without code changes

---

### User Story 4 - Navigate Site Structure (Priority: P3)

Users need consistent navigation that reflects available workstreams without hardcoded links, enabling automatic updates when workstreams are added or removed.

**Why this priority**: Navigation is fundamental to site usability. Data-driven navigation reduces maintenance and ensures consistency. Lower priority than content access but important for long-term maintainability.

**Independent Test**: Can be fully tested by viewing the site navigation and verifying workstream links appear correctly, CSS classes are applied properly, and navigation order matches data configuration.

**Acceptance Scenarios**:

1. **Given** a user views any page, **When** they see the navigation menu, **Then** workstream links appear in the configured order
2. **Given** a workstream is added to the data, **When** navigation renders, **Then** the new workstream link appears automatically
3. **Given** a workstream is marked as hidden in data, **When** navigation renders, **Then** that workstream link does not appear
4. **Given** a user hovers over a workstream link, **When** CSS is applied, **Then** the correct theme-based CSS class is active

---

### User Story 5 - Use Consistent Layout Structure (Priority: P4)

Developers need a reusable base layout structure that can be extended for new pages while maintaining consistency, preparing for future design system integration.

**Why this priority**: Base layout provides foundation for future pages and design system integration. Lowest priority as it's primarily a developer-facing improvement, but enables future work.

**Independent Test**: Can be fully tested by creating a new page using the base layout and verifying Frame, Footer, and common head/meta elements render correctly.

**Acceptance Scenarios**:

1. **Given** a developer creates a new page, **When** they use the base layout, **Then** Frame and Footer components render automatically
2. **Given** a page uses the base layout, **When** it loads, **Then** common meta tags and third-party integrations are included
3. **Given** legacy pages continue using legacy-base layout, **When** they load, **Then** they function exactly as before without changes

---

### Edge Cases

- What happens when a workstream slug doesn't match any content file? → System displays 404 error page (FR-004)
- How does the system handle missing hero image files or invalid image paths? → System uses default hero image as fallback (FR-009)
- What happens when filter state is corrupted in session storage? → System resets filter state to defaults (no filters applied, show all content)
- How does the system handle navigation when no workstreams are available in data? → System displays navigation without workstream links (graceful degradation)
- What happens when a workstream page is accessed directly via URL before content file exists? → System displays 404 error page (FR-004, NFR-006)
- How does the system handle invalid content type filters on updates page? → System ignores invalid filter values and displays all content for that content type

## Requirements *(mandatory)*

**Constitution Reference**: All requirements MUST comply with `.specify/memory/constitution.md`. Use the Decision Framework to determine scope (Phase 1 vs Phase 2).

### Out of Scope

The following are explicitly **NOT** included in Phase 2:

- **Design System Integration**: Integration with `components/ds/` components and design token alignment deferred to future phase
- **CMS Migration**: Directus migration and data layer restructuring deferred to future phase
- **External Script Audit**: Card consolidation and external script handling deferred until script audit completed
- **Theme CSS System Refactoring**: Theme CSS system changes deferred until design system integration phase
- **New Feature Development**: No new user-facing features, only architectural improvements and duplication elimination
- **Legacy Page Migration**: Legacy pages continue using `legacy-base` layout; migration to `base` layout deferred to future phase
- **Comprehensive Testing Infrastructure**: Testing setup and test coverage expansion deferred to implementation phase

### Functional Requirements

- **FR-001**: System MUST consolidate duplicate workstream page files into a single dynamic route template
- **FR-002**: System MUST preserve legacy workstream URLs through redirects following pattern: `/{slug}` → `/workstreams/{slug}` for all workstreams
- **FR-003**: System MUST load workstream content from individual Nuxt Content format files (`content/workstreams/{slug}.json`) rather than a single JSON file
- **FR-004**: System MUST display custom 404 error pages for invalid workstream slugs that include site navigation and link to homepage
- **FR-005**: System MUST eliminate duplicate code patterns in updates page tabs while maintaining visual and functional parity (same appearance and outcomes, internal implementation can differ)
- **FR-006**: System MUST support optional filters for updates content types (filters available for publications/videos/infographics, not for podcasts). Invalid filter values MUST be ignored and all content for that type displayed
- **FR-007**: System MUST preserve filter state when users switch between content type tabs using browser sessionStorage. If sessionStorage is corrupted or inaccessible, System MUST reset filter state to defaults (no filters applied)
- **FR-008**: System MUST centralize hero image configuration within each workstream content file. Default hero image configuration MUST be stored in a separate data file (e.g., `content/data/hero-default.json`)
- **FR-009**: System MUST provide fallback hero images using the default hero image from the default configuration file when theme-specific images are unavailable or invalid themes are specified
- **FR-009a**: System MUST preload critical hero images in page `<head>` using `<link rel="preload">` with `as="image"` and `fetchpriority="high"` for optimal LCP performance
- **FR-009b**: System MUST specify explicit `width` and `height` attributes on hero images from configuration to prevent layout shift (CLS)
- **FR-010**: System MUST generate navigation links dynamically from workstream data by querying all workstreams and filtering by visibility flag (where `visible !== false` or `hidden !== true`), then sorting by navigation order field
- **FR-011**: System MUST preserve CSS class generation for navigation items using pattern `frame-nav--{slug}` based on workstream slug
- **FR-012**: System MUST support hiding workstreams from navigation via data configuration (visibility flag in workstream data)
- **FR-013**: System MUST provide a reusable base layout component for new pages that is used via `definePageMeta({ layout: 'base' })`
- **FR-014**: System MUST maintain backward compatibility with legacy pages using legacy-base layout, ensuring visual and functional parity (same appearance and outcomes as before)
- **FR-015**: System MUST enable static site generation for all new dynamic routes using Nuxt Content's auto-discovery to generate routes from content files at build time. Development environment MAY use hybrid approach (on-demand generation) for faster builds, but production builds MUST generate all routes statically

### Non-Functional Requirements

- **NFR-001**: System MUST achieve Lighthouse scores of 90+ for Performance, SEO, and Accessibility
- **NFR-002**: System MUST follow Nuxt/Vue performance best practices including hero image preloading, proper caching, and optimized static generation
- **NFR-003**: System MUST meet WCAG 2.1 AA accessibility standards for navigation and filter interactions
- **NFR-004**: System MUST support mobile-first responsive design with graceful degradation
- **NFR-005**: System MUST maintain browser compatibility with existing legacy site support (same browsers as legacy implementation)
- **NFR-006**: System MUST display 404 error pages when workstream content files are missing or inaccessible
- **NFR-007**: System MUST provide minimal loading states (skeleton/spinner) for critical async operations such as workstream page content loading

### Dependencies

- **DEP-001**: System REQUIRES Nuxt Content module (`@nuxt/content`) for content file management and route generation
- **DEP-002**: System DEPENDS on existing workstream data structure format (workstreams.json structure and fields)
- **DEP-003**: System DEPENDS on existing updates content data structure format (publications, videos, infographics, podcasts metadata format)

### Data Migration Strategy

- **MIG-001**: Migration from existing `workstreams.json` to individual Nuxt Content format files (`content/workstreams/{slug}.json`) MUST be performed as a manual one-time process (via script or manual conversion) before implementation
- **MIG-002**: Migration script/process MUST preserve all existing workstream data fields and structure
- **MIG-003**: After migration, System MUST use only Nuxt Content format files; legacy JSON file MUST be removed or deprecated

### Key Entities *(include if feature involves data)*

- **Workstream**: Represents a content area (Democracy, Digital World, etc.) with heading, description, theme identifier, associated products, updates, navigation order, and visibility flag. Identified by slug used in URLs. Contains Hero Configuration as nested entity.
- **Updates Content**: Represents content items (publications, videos, infographics, podcasts) displayed on updates page with metadata for filtering and card display.
- **Hero Configuration**: Represents image configuration for page themes including webp and fallback image paths, dimensions, and theme identifier. Stored within workstream content files. Default hero configuration stored in separate data file (`content/data/hero-default.json`). Falls back to default hero image when theme-specific images are unavailable. Nested within Workstream entity.
- **Navigation Item**: Represents a workstream entry in site navigation with label, route path, CSS class identifier (pattern: `frame-nav--{slug}`), navigation order, and visibility flag. Derived from Workstream entity data.

### Entity Relationships

- **Workstream → Hero Configuration**: One-to-one relationship. Each Workstream contains one Hero Configuration entity.
- **Workstream → Navigation Item**: One-to-one relationship. Navigation Items are derived from Workstream entities (filtered and sorted for display).
- **Note**: Entity relationships will be reviewed and refined during implementation phase.

### Data Validation Requirements

- **VAL-001**: Workstream slug MUST be URL-safe (alphanumeric, hyphens, underscores only)
- **VAL-002**: Navigation order field MUST be numeric (integer)
- **VAL-003**: Visibility flag MUST be boolean or undefined (treated as visible if undefined)
- **VAL-004**: Hero image paths MUST be valid relative or absolute URLs
- **VAL-005**: Hero image dimensions (width, height) MUST be positive integers
- **VAL-006**: Content type filters MUST match valid content types (publications, videos, infographics, podcasts)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Workstream page code duplication reduced by 75% (from 4 duplicate files to 1 dynamic route)
- **SC-002**: Updates page code duplication reduced by 60% or more through reusable composables and components
- **SC-003**: All hero image configurations moved to data files with zero hardcoded image paths in component code
- **SC-004**: Navigation links generated 100% from data with zero hardcoded navigation items
- **SC-005**: All new workstream pages use content file-based data source instead of static JSON
- **SC-006**: Legacy URL redirects function correctly for 100% of existing workstream URLs
- **SC-007**: Content editors can update workstream data without code changes
- **SC-008**: Filter state persists correctly when users switch between updates page tabs
- **SC-009**: Invalid workstream slugs display 404 pages within 1 second of page load
- **SC-010**: Base layout component ready for future design system integration without structural changes
