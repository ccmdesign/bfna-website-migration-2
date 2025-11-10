# Tasks: Phase 2 Migration - Component Architecture & Optimization

**Input**: Design documents from `/specs/002-phase-2-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Constitution Compliance**: All tasks MUST align with `.specify/memory/constitution.md` principles:
- Use Nuxt built-ins/VueUse for data operations (Principle III)
- Use CSS for presentation, composables for data (Principle II)
- Defer Phase 2 concerns appropriately (Principle I)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow Nuxt 4 web application structure:
- `bfna-website-nuxt/src/` - Application source code
- `bfna-website-nuxt/src/content/` - Content files
- `bfna-website-nuxt/src/composables/` - Vue composables
- `bfna-website-nuxt/src/pages/` - Page components
- `bfna-website-nuxt/src/components/` - Vue components
- `bfna-website-nuxt/src/layouts/` - Layout components
- `bfna-website-nuxt/src/server/` - Server routes and middleware

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Data migration and Nuxt Content configuration

- [ ] T001 Create `bfna-website-nuxt/src/content/workstreams/` directory for individual workstream content files
- [ ] T002 [P] Create data migration script `bfna-website-nuxt/scripts/migrate-workstreams.ts` to extract workstreams from `src/content/data/workstreams.json` and convert to individual files
- [ ] T003 Run migration script to create individual workstream files in `src/content/workstreams/{slug}.json` with slug, navigation_order, visible fields, and hero configuration
- [ ] T004 Create default hero configuration file `bfna-website-nuxt/src/content/data/hero-default.json` with webp, fallback, width, height, and theme fields
- [ ] T005 Configure Nuxt Content collection for workstreams in `bfna-website-nuxt/src/content.config.ts` (or `content.config.ts` at root) with schema validation
- [ ] T006 Run `npm run postinstall` to regenerate Nuxt types and verify workstreams collection appears

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core composables and infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create `useWorkstream` composable in `bfna-website-nuxt/src/composables/data/useWorkstream.ts` using `queryContent()` from Nuxt Content to fetch single workstream by slug or all workstreams
- [ ] T008 Create `useWorkstreamNavigation` composable in `bfna-website-nuxt/src/composables/data/useWorkstreamNavigation.ts` that queries all workstreams, filters by visibility, sorts by navigation_order, and generates navigation items
- [ ] T009 Create `useHeroImage` composable in `bfna-website-nuxt/src/composables/data/useHeroImage.ts` that gets hero config for a theme with fallback to default hero configuration
- [ ] T010 Create `useUpdatesFilters` composable in `bfna-website-nuxt/src/composables/legacy/useUpdatesFilters.ts` that manages filter state with sessionStorage persistence for updates page

**Checkpoint**: Foundation ready - all composables are functional. User story implementation can now begin.

---

## Phase 3: User Story 1 - Access Workstream Content (Priority: P1) 🎯 MVP

**Goal**: Users can access workstream pages through consistent routes that preserve existing URLs while enabling easier content management.

**Independent Test**: Navigate to `/democracy` or `/workstreams/democracy` and verify content displays correctly, legacy URLs redirect properly, and page structure matches existing functionality.

### Implementation for User Story 1

- [ ] T011 [US1] Create dynamic workstream route `bfna-website-nuxt/src/pages/workstreams/[slug].vue` that uses `useWorkstream` composable to fetch workstream data by slug
- [ ] T012 [US1] Implement 404 handling in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` using `notFound()` helper when workstream data is null
- [ ] T013 [US1] Render hero component in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` with workstream heading and description
- [ ] T014 [US1] Render products list in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` using LegacyMoleculesProductCardWebsite and LegacyMoleculesProductCard components
- [ ] T015 [US1] Render updates list in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` using LegacyMoleculesCard component (exclude if theme is 'podcasts')
- [ ] T016 [US1] Set page title in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` using `useHead()` composable with workstream heading
- [ ] T017 [US1] Configure legacy URL redirects in `bfna-website-nuxt/nuxt.config.ts` using `routeRules` to redirect `/{slug}` → `/workstreams/{slug}` for democracy, politics-society, future-leadership, digital-world
- [ ] T018 [US1] Verify redirects work correctly in production build and return 301 status code

**Checkpoint**: At this point, User Story 1 should be fully functional - users can access workstream pages via new routes and legacy URLs redirect correctly.

---

## Phase 4: User Story 2 - Browse Updates Content (Priority: P2)

**Goal**: Users can browse publications, videos, infographics, and podcasts through a unified interface with consistent filtering and display patterns, reducing code duplication.

**Independent Test**: Navigate to `/updates`, switch between content type tabs, apply filters, and verify cards update in real-time as filters are selected with proper filtering behavior.

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create reusable `UpdatesPageTab` component in `bfna-website-nuxt/src/components/templates/UpdatesPageTab.vue` with props for contentType, items, and showFilters
- [ ] T020 [US2] Implement filter rendering logic in `bfna-website-nuxt/src/components/templates/UpdatesPageTab.vue` that conditionally shows LegacyMoleculesSimpleFilters component based on showFilters prop
- [ ] T021 [US2] Implement card rendering logic in `bfna-website-nuxt/src/components/templates/UpdatesPageTab.vue` that displays LegacyMoleculesCard components for content items
- [ ] T022 [US2] Integrate `useUpdatesFilters` composable in `bfna-website-nuxt/src/components/templates/UpdatesPageTab.vue` to apply filter logic to cards
- [ ] T023 [US2] Refactor `bfna-website-nuxt/src/pages/updates.vue` to use `UpdatesPageTab` component for publications, videos, infographics, and podcasts tabs
- [ ] T024 [US2] Remove duplicate tab code from `bfna-website-nuxt/src/pages/updates.vue` and replace with reusable component instances
- [ ] T025 [US2] Implement filter state persistence in `bfna-website-nuxt/src/composables/legacy/useUpdatesFilters.ts` using sessionStorage with key `updates-filters`
- [ ] T026 [US2] Implement filter state loading on mount in `bfna-website-nuxt/src/composables/legacy/useUpdatesFilters.ts` with graceful degradation (reset to defaults if corrupted)
- [ ] T027 [US2] Verify filter state persists when switching between content type tabs on updates page
- [ ] T028 [US2] Verify podcasts tab displays without filters (showFilters=false) in `bfna-website-nuxt/src/pages/updates.vue`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - updates page eliminates duplication while maintaining functionality.

---

## Phase 5: User Story 3 - View Hero Images (Priority: P3)

**Goal**: Users see appropriate hero images for each page theme without hardcoded image paths, enabling easier image management.

**Independent Test**: Visit pages with different themes (homepage, democracy, digital-world, etc.) and verify correct hero images display with proper preloading and fallback handling.

### Implementation for User Story 3

- [ ] T029 [US3] Integrate `useHeroImage` composable in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` to get hero config for workstream theme
- [ ] T030 [US3] Implement hero image preloading in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` using `useHead()` with `<link rel="preload" as="image" fetchpriority="high">` for webp and fallback paths
- [ ] T031 [US3] Update LegacyMoleculesHero component usage in `bfna-website-nuxt/src/pages/workstreams/[slug].vue` to use hero config from composable (if component supports it) or pass hero image paths
- [ ] T032 [US3] Verify hero image fallback works correctly when theme-specific hero is missing (should use default hero from `hero-default.json`)
- [ ] T033 [US3] Verify hero images have explicit width and height attributes from configuration to prevent CLS (Cumulative Layout Shift)
- [ ] T034 [US3] Test hero image preloading on homepage and verify default hero displays correctly

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - hero images are centralized and preload correctly.

---

## Phase 6: User Story 4 - Navigate Site Structure (Priority: P3)

**Goal**: Users see consistent navigation that reflects available workstreams without hardcoded links, enabling automatic updates when workstreams are added or removed.

**Independent Test**: View site navigation and verify workstream links appear correctly, CSS classes are applied properly, and navigation order matches data configuration.

### Implementation for User Story 4

- [ ] T035 [US4] Integrate `useWorkstreamNavigation` composable in `bfna-website-nuxt/src/components/legacy/organisms/MainNav.vue` to get navigation items dynamically
- [ ] T036 [US4] Replace hardcoded workstream links in `bfna-website-nuxt/src/components/legacy/organisms/MainNav.vue` columns array with computed property that maps navigation items from composable
- [ ] T037 [US4] Preserve CSS class generation in `bfna-website-nuxt/src/components/legacy/organisms/MainNav.vue` using pattern `frame-nav--{slug}` from navigation items
- [ ] T038 [US4] Verify navigation displays workstreams in correct order (navigation_order field, then alphabetically by heading)
- [ ] T039 [US4] Test hiding workstream from navigation by setting `visible: false` in workstream content file and verifying link does not appear
- [ ] T040 [US4] Verify navigation gracefully degrades when no workstreams are available (displays navigation without workstream links)

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently - navigation is data-driven and updates automatically.

---

## Phase 7: User Story 5 - Use Consistent Layout Structure (Priority: P4)

**Goal**: Developers can use a reusable base layout structure for new pages while maintaining consistency, preparing for future design system integration.

**Independent Test**: Create a new page using the base layout and verify Frame, Footer, and common head/meta elements render correctly.

### Implementation for User Story 5

- [ ] T041 [US5] Create base layout component `bfna-website-nuxt/src/layouts/base.vue` that includes Frame component (navigation)
- [ ] T042 [US5] Include Footer component in `bfna-website-nuxt/src/layouts/base.vue`
- [ ] T043 [US5] Set common head/meta elements in `bfna-website-nuxt/src/layouts/base.vue` using `useHead()` composable
- [ ] T044 [US5] Prepare base layout structure in `bfna-website-nuxt/src/layouts/base.vue` for future design system integration (add comments/placeholders)
- [ ] T045 [US5] Verify legacy pages continue using `legacy-base` layout and function exactly as before without changes
- [ ] T046 [US5] Test base layout by creating a new test page with `definePageMeta({ layout: 'base' })` and verifying Frame and Footer render

**Checkpoint**: At this point, all user stories should be independently functional - base layout is ready for future use.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, and improvements that affect multiple user stories

- [ ] T047 [P] Verify all workstream pages load correctly via `/workstreams/{slug}` routes
- [ ] T048 [P] Verify legacy URL redirects function correctly for 100% of existing workstream URLs
- [ ] T049 [P] Verify 404 pages display for invalid workstream slugs within 1 second of page load
- [ ] T050 [P] Verify navigation displays workstreams in correct order and hidden workstreams don't appear
- [ ] T051 [P] Verify hero images preload correctly and fallback to default when missing
- [ ] T052 [P] Verify updates page filters work correctly and filter state persists when switching tabs
- [ ] T053 [P] Verify base layout renders Frame and Footer correctly
- [ ] T054 [P] Run Lighthouse audit and verify scores 90+ for Performance, SEO, and Accessibility
- [ ] T055 [P] Verify static site generation works for all workstream routes at build time
- [ ] T056 Remove legacy workstream page files after redirects confirmed working: `bfna-website-nuxt/src/pages/democracy.vue`, `digital-world.vue`, `future-leadership.vue`, `politics-society.vue`
- [ ] T057 Deprecate or remove `bfna-website-nuxt/src/content/data/workstreams.json` after migration verified complete (keep as backup initially)
- [ ] T058 Update `bfna-website-nuxt/src/composables/data/useWorkstreams.ts` to use Nuxt Content query API instead of JSON import (if still using old composable)
- [ ] T059 Verify all pages maintain visual parity with legacy implementation
- [ ] T060 Run quickstart.md validation checklist to ensure all implementation steps completed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T005-T006) - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion (T007-T010)
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P3 → P4)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent, uses existing updates page
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 (hero images on workstream pages) but can be tested independently
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent, uses navigation component
- **User Story 5 (P4)**: Can start after Foundational (Phase 2) - Independent, creates new layout

### Within Each User Story

- Composables before components
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T002 can run in parallel with T001 (different concerns)
- **Foundational Phase**: All composables (T007-T010) can run in parallel (different files)
- **User Stories**: Once Foundational completes, all user stories can start in parallel (if team capacity allows)
- **Polish Phase**: Most validation tasks (T047-T055) can run in parallel

---

## Parallel Example: User Story 1

```bash
# All foundational composables can run in parallel:
Task: "Create useWorkstream composable in src/composables/data/useWorkstream.ts"
Task: "Create useWorkstreamNavigation composable in src/composables/data/useWorkstreamNavigation.ts"
Task: "Create useHeroImage composable in src/composables/data/useHeroImage.ts"
Task: "Create useUpdatesFilters composable in src/composables/legacy/useUpdatesFilters.ts"

# After foundational phase, User Story 1 tasks can proceed:
Task: "Create dynamic workstream route in src/pages/workstreams/[slug].vue"
Task: "Configure legacy URL redirects in nuxt.config.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (data migration, Nuxt Content config)
2. Complete Phase 2: Foundational (all composables) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (workstream pages and redirects)
4. **STOP and VALIDATE**: Test User Story 1 independently - verify workstream pages load, redirects work, 404s display
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Polish & Cleanup → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (workstream pages)
   - Developer B: User Story 2 (updates page refactor)
   - Developer C: User Story 3 (hero images) + User Story 4 (navigation)
   - Developer D: User Story 5 (base layout)
3. Stories complete and integrate independently
4. Polish phase can run in parallel across team

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Keep legacy page files until redirects confirmed working in production
- Maintain `workstreams.json` as backup until migration verified complete

