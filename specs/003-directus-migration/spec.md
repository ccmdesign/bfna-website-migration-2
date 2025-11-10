# Feature Specification: Contentful → Directus Migration

**Feature Branch**: `003-directus-migration`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Contentful → Directus Migration: Replace static JSON files with Directus API calls, migrate data composables to use Directus SDK, update data models if needed, implement proper error handling and caching. Focus on documenting what needs to change and generating Directus-ready JSON schemas for backend developer."

## Clarifications

### Session 2025-01-27

- Q: What should happen when Directus API fails? → A: Fallback to static JSON files (keep as backup during migration)
- Q: What should be the cache TTL duration? → A: 5 minutes (balances freshness and performance, aligns with SC-006)
- Q: What happens when required fields are missing from Directus responses? → A: Log warning and use null/empty defaults. Required fields and default values should be enforced in Directus schema, so Directus only sends empty data where acceptable.
- Q: How does caching behave during build-time vs runtime? → A: Separate caches - build-time uses Nuxt payload cache (persists across builds), runtime uses in-memory cache with 5-minute TTL
- Q: How does the system handle very large datasets that exceed API response limits? → A: Implement scroll-based loading (infinite scroll): load first 100 items, then load next 100 when user scrolls to 80% of content

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frontend Developer Migrates Data Composables (Priority: P1)

A frontend developer needs to update all data composables to fetch from Directus API instead of static JSON files, ensuring the application continues to work identically for end users.

**Why this priority**: This is the core migration task. Without updating composables, the application cannot access Directus data. This must work before any optimization or enhancement work.

**Independent Test**: Can be fully tested by updating a single composable (e.g., `useProducts`) to fetch from Directus, verifying the data structure matches expectations, and confirming pages using that composable render correctly. This delivers immediate value by proving the migration approach works.

**Acceptance Scenarios**:

1. **Given** Directus API is configured and accessible, **When** a composable fetches data from Directus, **Then** the returned data structure matches the current static JSON structure exactly
2. **Given** a page component uses a migrated composable, **When** the page loads, **Then** content displays identically to the static JSON version
3. **Given** Directus API returns an error, **When** a composable attempts to fetch data, **Then** the application handles the error gracefully without crashing

---

### User Story 2 - Backend Developer Configures Directus Collections (Priority: P1)

A backend developer needs clear documentation and JSON schemas to configure Directus collections that match the current data structure, enabling content editors to manage content through Directus.

**Why this priority**: Directus must be configured correctly before frontend can consume the API. This is a prerequisite for the migration.

**Independent Test**: Can be fully tested by creating Directus collections using the provided schemas, importing sample data, and verifying the API returns data in the expected format. This delivers value by enabling content management through Directus.

**Acceptance Scenarios**:

1. **Given** Directus JSON schemas are provided, **When** a backend developer creates collections in Directus, **Then** all required fields and relationships are configured correctly
2. **Given** sample data is imported into Directus, **When** API endpoints are queried, **Then** returned data structure matches frontend expectations
3. **Given** content editors update content in Directus, **When** frontend fetches updated data, **Then** changes are reflected immediately (or after cache refresh)

---

### User Story 3 - Application Handles API Errors and Caching (Priority: P2)

The application gracefully handles Directus API failures and implements appropriate caching to reduce API calls and improve performance.

**Why this priority**: Production applications must handle failures gracefully. Caching improves performance and reduces API load, but is not required for initial migration.

**Independent Test**: Can be fully tested independently by simulating API failures and verifying fallback behavior, then implementing caching and verifying cache hits reduce API calls. This delivers value by improving reliability and performance.

**Acceptance Scenarios**:

1. **Given** Directus API is unavailable, **When** a composable attempts to fetch data, **Then** the application falls back to static JSON files (kept as backup during migration)
2. **Given** data is fetched from Directus, **When** the same data is requested again within cache TTL, **Then** cached data is returned without API call
3. **Given** content is updated in Directus, **When** cache TTL expires, **Then** fresh data is fetched from API

---

### Edge Cases

- What happens when Directus returns data in a different structure than expected? → Fallback to static JSON files
- How does the system handle partial API failures (some collections work, others don't)? → Each composable falls back independently to its corresponding static JSON file
- What happens when Directus API rate limits are exceeded? → Fallback to static JSON files
- How does caching behave during build time vs runtime? → Separate caching strategies: build-time uses Nuxt payload cache (persists across builds for faster rebuilds), runtime uses in-memory cache with 5-minute TTL
- What happens when required fields are missing from Directus responses? → Required fields and default values are enforced in Directus schema. If missing fields occur (data integrity issue), log warning and use null/empty defaults. Directus should only send empty data where acceptable per schema configuration.
- How does the system handle very large datasets that exceed API response limits? → Implement scroll-based loading (infinite scroll): load first 100 items initially, then load next 100 items when user scrolls to 80% of current content

## Requirements *(mandatory)*

**Constitution Reference**: All requirements MUST comply with `.specify/memory/constitution.md`. This migration is Phase 2 work, focusing on data layer improvements per the constitution's scope constraints.

### Functional Requirements

- **FR-001**: System MUST replace all static JSON file imports with Directus API calls in data composables
- **FR-002**: System MUST maintain exact data structure compatibility with current static JSON format
- **FR-003**: System MUST implement error handling for Directus API failures by falling back to static JSON files (kept as backup during migration period)
- **FR-004**: System MUST implement separate caching strategies: build-time uses Nuxt payload cache (persists across builds), runtime uses in-memory cache with 5-minute TTL
- **FR-005**: System MUST provide Directus JSON schemas for all content collections (products, publications, videos, infographics, people, workstreams, podcasts, news, announcements) with required field constraints and default values enforced
- **FR-006**: System MUST document all frontend changes required for Directus migration
- **FR-007**: System MUST preserve all existing composable interfaces (no breaking changes to components using composables)
- **FR-008**: System MUST handle Directus authentication/authorization appropriately
- **FR-009**: System MUST support both build-time and runtime data fetching patterns
- **FR-011**: System MUST implement scroll-based loading (infinite scroll) for large datasets: load first 100 items initially, then load next 100 items when user scrolls to 80% of current content

### Key Entities *(include if feature involves data)*

- **Product**: Content item representing reports, websites, or videos. Fields include title, type, subheading, description, image, buttons, theme, permalink, workstream, team_section
- **Publication**: Content item representing written publications. Fields include heading, subheading, content (HTML), authors, excerpt, by_line, theme, workstream, breadcrumbs. Special structure: `{ items, updates, homePageUpdates }`
- **Video**: Content item representing video content. Fields include heading, video (url, thumbnail), content, authors, theme, workstream, breadcrumbs. Special structure: `{ items, updates, homePageUpdates }`
- **Infographic**: Content item representing visual infographics. Fields include heading, subheading, image, infographic, content, authors, theme, workstream, breadcrumbs
- **Person**: Team member entity. Fields include name, job_title, email, bio, image, linkedin, twitter
- **Workstream**: Content category/workstream. Fields include heading, description, theme, slug, button, image, products_list, updates_list. Structure: object keyed by slug (e.g., `{ "politics-society": {...}, "democracy": {...} }`)
- **Podcast**: Content item representing podcast episodes. Fields include heading, excerpt, image, button, theme, workstream
- **News**: News item. Fields include heading, excerpt, image, url, buttonLabel, type
- **Announcement**: Announcement content. Fields include workstream, message (array), url

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 9 data composables successfully fetch from Directus API without breaking existing component functionality
- **SC-002**: Directus API response times are under 500ms for single collection queries (95th percentile)
- **SC-003**: Cache hit rate exceeds 80% for repeated data requests during build and runtime (with 5-minute TTL)
- **SC-004**: Application handles API failures gracefully with zero unhandled errors in production
- **SC-005**: Directus collections are configured with 100% field coverage matching current JSON structure
- **SC-006**: Content editors can update content in Directus and see changes reflected in frontend within 5 minutes (cache TTL is 5 minutes)
- **SC-007**: Build time increases by less than 30% compared to static JSON approach
- **SC-008**: Zero breaking changes to components - all existing pages render identically after migration

## Assumptions

- Directus instance is already provisioned and accessible
- Directus API authentication method is determined by backend team (token-based assumed)
- Content migration from Contentful to Directus is handled separately by backend team
- Directus SDK for JavaScript/TypeScript is available and compatible with Nuxt 3
- Build-time data fetching can use Directus API (not just runtime)
- Cache TTL is set to 5 minutes for runtime caching (balances freshness with performance and aligns with SC-006 requirement for content updates to appear within 5 minutes)
- Build-time caching uses Nuxt payload cache which persists across builds for faster rebuilds
- Runtime caching uses in-memory cache with 5-minute TTL
- Directus collections enforce required field constraints and default values in schema, ensuring data integrity at the source
- If missing fields occur despite schema enforcement (data integrity issue), frontend logs warning and uses null/empty defaults
- Large datasets are handled via scroll-based loading (infinite scroll): load first 100 items initially, then load next 100 items when user scrolls to 80% of current content
- API rate limits are sufficient for build-time and runtime usage patterns

## Dependencies

- Directus instance must be configured and accessible before frontend migration begins
- Directus collections must be created using provided schemas before API integration
- Sample data must be available in Directus for testing
- Directus SDK package must be installed in Nuxt project
- Environment variables for Directus API endpoint and authentication must be configured

## Out of Scope

- Content migration from Contentful to Directus (handled by backend team)
- Directus instance setup and infrastructure (handled by backend team)
- Content editor training or Directus UI customization
- Data model optimization or refactoring (preserve current structure)
- Image optimization or CDN integration (handled separately)
- Real-time updates via WebSockets or subscriptions
