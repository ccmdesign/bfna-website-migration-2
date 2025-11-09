# Tasks: Search Functionality

**Input**: Design documents from `/specs/001-search-functionality/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

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
- `bfna-website-nuxt/scripts/` - Build-time scripts
- `bfna-website-nuxt/public/` - Static assets and generated files

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and search infrastructure setup

- [X] T001 Create search index generation script directory structure in `bfna-website-nuxt/scripts/`
- [X] T002 Add search index generation script command to `package.json` scripts section (e.g., "generate:search-index": "tsx scripts/generate-search-index.ts")
- [X] T003 [P] Create TypeScript interfaces for SearchIndexItem and SearchResult in `bfna-website-nuxt/src/types/search.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core search infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create search text processing utility functions (clean excerpt, squash text) in `bfna-website-nuxt/src/utils/search-text.ts` matching legacy behavior exactly
- [X] T005 Create URL normalization utility function in `bfna-website-nuxt/src/utils/url-normalize.ts` to map legacy URLs to Nuxt routes
- [X] T006 [P] Create search index generation script `bfna-website-nuxt/scripts/generate-search-index.ts` that reads from static JSON files and generates `public/search.json`
- [X] T007 [P] Implement search API endpoint `bfna-website-nuxt/src/server/api/search.get.ts` that loads search.json, performs substring matching, and returns results in legacy format
- [X] T008 Update useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` to use local API endpoint instead of external API
- [X] T009 Update useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` to fix debounce timing from 300ms to 550ms using VueUse `useDebounceFn`
- [X] T010 Update useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` to trim whitespace from search queries before processing
- [X] T011 Update useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` to handle empty queries by returning zero results without API call
- [X] T012 Update search page `bfna-website-nuxt/src/pages/search.vue` to properly initialize from localStorage and display search results

**Checkpoint**: Foundation ready - search index generation, API endpoint, and composable are functional. User story implementation can now begin.

---

## Phase 3: User Story 1 - Search from Header (Priority: P1) 🎯 MVP

**Goal**: Users can search from the header search field, which navigates them to the search results page with matching content displayed.

**Independent Test**: Type a search term in the header search field, submit it (Enter or click button), verify navigation to search results page with results displayed and search term pre-filled.

### Implementation for User Story 1

- [X] T013 [US1] Update Header component `bfna-website-nuxt/src/components/legacy/organisms/Header.vue` to connect `.frame-search__field` input to useSearch composable or handle input directly
- [X] T014 [US1] Update Header component `bfna-website-nuxt/src/components/legacy/organisms/Header.vue` to connect `.frame-search__submit` button to submit search and navigate to `/search` page
- [X] T015 [US1] Update Header component `bfna-website-nuxt/src/components/legacy/organisms/Header.vue` to handle Enter key press on `.frame-search__field` to submit search
- [X] T016 [US1] Update Header component `bfna-website-nuxt/src/components/legacy/organisms/Header.vue` to store search term in localStorage with key `bfna-search` before navigation
- [X] T017 [US1] Verify search page `bfna-website-nuxt/src/pages/search.vue` reads search term from localStorage on mount and displays results automatically

**Checkpoint**: At this point, User Story 1 should be fully functional - users can search from header and see results.

---

## Phase 4: User Story 2 - Search from Footer (Priority: P1)

**Goal**: Users can search from the footer search field, which navigates them to the search results page with matching content displayed.

**Independent Test**: Scroll to footer, type a search term in the footer search field, submit it, verify navigation to search results page with results displayed and search term pre-filled.

### Implementation for User Story 2

- [X] T018 [P] [US2] Update Footer component `bfna-website-nuxt/src/components/legacy/organisms/Footer.vue` to connect `.footer-search__input` input to handle search input
- [X] T019 [US2] Update Footer component `bfna-website-nuxt/src/components/legacy/organisms/Footer.vue` to connect `.footer-search__submit` button to submit search and navigate to `/search` page
- [X] T020 [US2] Update Footer component `bfna-website-nuxt/src/components/legacy/organisms/Footer.vue` to store search term in localStorage with key `bfna-search` before navigation
- [X] T021 [US2] Verify footer search integration works independently and displays results correctly

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can search from header or footer.

---

## Phase 5: User Story 3 - Search from Mobile Menu (Priority: P1)

**Goal**: Mobile users can search from the off-canvas menu search field, which closes the menu and navigates them to the search results page with matching content displayed.

**Independent Test**: Open mobile menu, type a search term in the menu search field, submit it, verify menu closes, navigation to search results page with results displayed and search term pre-filled.

### Implementation for User Story 3

- [X] T022 [P] [US3] Update OffCanvas component `bfna-website-nuxt/src/components/legacy/organisms/OffCanvas.vue` to connect `.menu-search__input` input to handle search input
- [X] T023 [US3] Update OffCanvas component `bfna-website-nuxt/src/components/legacy/organisms/OffCanvas.vue` to connect `.menu-search__submit` button to submit search, close menu, and navigate to `/search` page
- [X] T024 [US3] Update OffCanvas component `bfna-website-nuxt/src/components/legacy/organisms/OffCanvas.vue` to store search term in localStorage with key `bfna-search` before navigation
- [X] T025 [US3] Verify mobile menu search integration works independently, closes menu correctly, and displays results

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - users can search from header, footer, or mobile menu.

---

## Phase 6: User Story 4 - Live Search Results on Search Page (Priority: P2)

**Goal**: Users typing on the search page see search results update automatically after a 550ms delay, providing immediate feedback as they refine their query.

**Independent Test**: Navigate to search page, type a search term, verify results update automatically after 550ms delay, verify typing again cancels previous search and starts new one after delay.

### Implementation for User Story 4

- [X] T026 [US4] Verify useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` debounce timing is 550ms (already updated in T009)
- [X] T027 [US4] Verify useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` cancels pending searches when user continues typing before delay completes
- [X] T028 [US4] Update search page `bfna-website-nuxt/src/pages/search.vue` to bind search input to useSearch composable query reactive ref
- [X] T029 [US4] Update search page `bfna-website-nuxt/src/pages/search.vue` to watch query changes and trigger debounced search automatically
- [X] T030 [US4] Update search page `bfna-website-nuxt/src/pages/search.vue` to clear results and show zero count when search input is cleared

**Checkpoint**: At this point, live search on search page should work - results update automatically as users type with proper debouncing.

---

## Phase 7: User Story 5 - Search Results Display and Navigation (Priority: P2)

**Goal**: Search results display correctly as cards with all expected fields, and clicking results navigates to correct content pages without errors.

**Independent Test**: Perform a search, verify results display as cards with heading, subheading, excerpt, and theme, click a result link, verify navigation to correct page without 404 errors.

### Implementation for User Story 5

- [X] T031 [US5] Verify search API endpoint `bfna-website-nuxt/src/server/api/search.get.ts` filters out items with empty/null/missing URLs (FR-005)
- [X] T032 [US5] Verify search API endpoint `bfna-website-nuxt/src/server/api/search.get.ts` returns results in correct format with url, heading, subheading, excerpt, theme fields
- [X] T033 [US5] Update search page `bfna-website-nuxt/src/pages/search.vue` to display search results as cards with heading, subheading, excerpt, and theme information
- [X] T034 [US5] Update search page `bfna-website-nuxt/src/pages/search.vue` to display result count correctly
- [X] T035 [US5] Update search page `bfna-website-nuxt/src/pages/search.vue` to handle empty results state (zero count, no cards displayed)
- [X] T036 [US5] Verify search result links navigate correctly to content pages (test with publications, videos, infographics URLs)
- [X] T037 [US5] Update search page `bfna-website-nuxt/src/pages/search.vue` to hide navigation search button when on search page (FR-019)

**Checkpoint**: At this point, search results should display correctly and all links should navigate without errors.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final improvements

- [X] T038 [P] Update search API endpoint `bfna-website-nuxt/src/server/api/search.get.ts` to handle search index file missing or corrupted errors gracefully (return empty array, log server-side)
- [X] T039 [P] Update search API endpoint `bfna-website-nuxt/src/server/api/search.get.ts` to handle search processing errors gracefully (return empty array, log server-side)
- [X] T040 [P] Update useSearch composable `bfna-website-nuxt/src/composables/legacy/useSearch.ts` to handle API errors gracefully (show empty results, log to console in dev mode)
- [X] T041 Verify search handles special characters in queries correctly (case-insensitive substring matching)
- [X] T042 Verify search handles very long search queries without performance degradation
- [X] T043 Verify search handles direct navigation to `/search` page without search term (shows empty state with zero results)
- [X] T044 Verify search index generation script handles missing or malformed source data files gracefully
- [X] T045 Run search index generation script and verify `public/search.json` is created with correct format
- [X] T049 [P] Verify search index includes all available content from publications, videos, and infographics data sources (SC-007) - compare item counts in source files vs search.json
- [X] T050 Verify search performance meets requirements (< 300ms per query, SC-006)
- [X] T051 Verify all search result URLs navigate correctly (100% link accuracy, SC-003)
- [X] T052 Verify search index generation script runs automatically during `npm run build` (integrate into build pipeline, not just scripts section)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Stories 1, 2, 3 (P1) can proceed in parallel after Foundational
  - User Story 4 (P2) depends on search page working (from Foundational)
  - User Story 5 (P2) depends on search API working (from Foundational)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, can run in parallel
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent of US1/US2, can run in parallel
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on search page and composable working
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on search API returning correct format

### Within Each User Story

- Core implementation before integration
- Component updates before verification
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T003 can run in parallel with T001/T002
- **Phase 2**: T006 and T007 can run in parallel (different files)
- **Phase 2**: T008, T009, T010, T011 can be done together (same file, sequential)
- **Phase 3-5**: User Stories 1, 2, 3 can be worked on in parallel by different developers
- **Phase 6-7**: User Stories 4 and 5 can be worked on in parallel
- **Phase 8**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: User Stories 1, 2, 3

```bash
# After Foundational phase completes, these can run in parallel:

# Developer A: User Story 1 (Header)
Task: "Update Header component to connect search input"
Task: "Update Header component to connect search submit button"
Task: "Update Header component to handle Enter key"

# Developer B: User Story 2 (Footer)
Task: "Update Footer component to connect search input"
Task: "Update Footer component to connect search submit button"

# Developer C: User Story 3 (Mobile Menu)
Task: "Update OffCanvas component to connect search input"
Task: "Update OffCanvas component to connect search submit button"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Header search)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Header) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Footer) → Test independently → Deploy/Demo
4. Add User Story 3 (Mobile Menu) → Test independently → Deploy/Demo
5. Add User Story 4 (Live Search) → Test independently → Deploy/Demo
6. Add User Story 5 (Results Display) → Test independently → Deploy/Demo
7. Add Polish → Final validation → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Header)
   - Developer B: User Story 2 (Footer)
   - Developer C: User Story 3 (Mobile Menu)
3. After P1 stories complete:
   - Developer A: User Story 4 (Live Search)
   - Developer B: User Story 5 (Results Display)
4. Team: Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Search index generation must run before API can work
- All search inputs use localStorage pattern for search term passing
- Debounce timing must be exactly 550ms to match legacy behavior
- Search text processing must match legacy squash filter exactly

