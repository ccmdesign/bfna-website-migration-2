# Tasks: Contentful → Directus Migration

**Input**: Design documents from `/specs/003-directus-migration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL and not included unless explicitly requested. Focus is on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Constitution Compliance**: All tasks MUST align with `.specify/memory/constitution.md` principles:
- Use Nuxt built-ins/VueUse for data operations (Principle III)
- Use CSS for presentation, composables for data (Principle II)
- This IS Phase 2 work - migrating data layer (Principle I)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths use Nuxt project structure:
- `bfna-website-nuxt/src/` for source files
- `bfna-website-nuxt/scripts/` for scripts
- `bfna-website-nuxt/.env` for environment variables

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Directus SDK setup

- [X] T001 Install @directus/sdk package in bfna-website-nuxt directory
- [X] T002 [P] Add DIRECTUS_URL and DIRECTUS_TOKEN environment variables to .env file
- [X] T003 [P] Create Directus client utility in bfna-website-nuxt/src/utils/directus.ts
- [X] T004 [P] Create TypeScript types file in bfna-website-nuxt/src/types/directus.ts with Schema interface and all collection type definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that MUST be complete before composable migration can begin

**⚠️ CRITICAL**: No composable migration can begin until this phase is complete

- [X] T005 Create error handling utility function with fallback to static JSON in bfna-website-nuxt/src/utils/directus.ts
- [X] T006 Create runtime cache utility functions (getCachedData, setCachedData) with 5-minute TTL in bfna-website-nuxt/src/utils/directus.ts
- [X] T007 Create test script to verify Directus client can connect and authenticate in bfna-website-nuxt/src/utils/__tests__/directus.test.ts (or integrate connection test into T003)

**Checkpoint**: Foundation ready - composable migration can now begin

---

## Phase 3: User Story 1 - Frontend Developer Migrates Data Composables (Priority: P1) 🎯 MVP

**Goal**: Update all 9 data composables to fetch from Directus API instead of static JSON files, ensuring the application continues to work identically for end users.

**Independent Test**: Update a single composable (e.g., `useProducts`), verify data structure matches expectations, and confirm pages using that composable render correctly. This proves the migration approach works.

### Implementation for User Story 1

#### Simple Composables (Array Structures)

- [X] T008 [P] [US1] Migrate useProducts composable to fetch from Directus with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useProducts.ts
- [X] T009 [P] [US1] Migrate useNews composable to fetch from Directus with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useNews.ts
- [X] T010 [P] [US1] Migrate useAnnouncements composable to fetch from Directus singleton with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useAnnouncements.ts

#### Complex Composables (Nested Structures)

- [X] T011 [US1] Migrate usePublications composable to combine publications, publication_updates, and publication_homepage_updates collections with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/usePublications.ts
- [X] T012 [US1] Migrate useVideos composable to combine videos, video_updates, and video_homepage_updates collections with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useVideos.ts
- [X] T013 [US1] Migrate useInfographics composable to combine infographics and infographic_homepage_updates collections with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useInfographics.ts
- [X] T014 [US1] Migrate usePodcasts composable to combine podcasts and podcast_homepage_updates collections with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/usePodcasts.ts

#### Special Case Composables (Data Transformations)

- [X] T015 [US1] Migrate useWorkstreams composable to transform array to object keyed by slug with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useWorkstreams.ts
- [X] T016 [US1] Migrate useWorkstream composable to fetch single workstream by slug with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/useWorkstream.ts
- [X] T017 [US1] Migrate usePeople composable to combine people collection with people_config singleton and separate by is_board_member flag with error handling and fallback to static JSON in bfna-website-nuxt/src/composables/data/usePeople.ts

#### Build-Time Caching Integration

- [X] T021 [US1] Add Nuxt payload cache support to all composables using getCachedData option in useAsyncData

**Checkpoint**: At this point, all 9 composables should fetch from Directus with integrated error handling. Pages should render identically to static JSON version.

---

## Phase 4: User Story 3 - Application Handles API Errors and Caching (Priority: P2)

**Goal**: Enhance error handling and implement runtime caching to reduce API calls and improve performance.

**Independent Test**: Simulate API failures and verify fallback behavior, then verify cache hits reduce API calls.

### Runtime Caching Implementation

- [X] T022 [US3] Integrate runtime cache utility into useProducts composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useProducts.ts
- [X] T023 [P] [US3] Integrate runtime cache utility into useNews composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useNews.ts
- [X] T024 [P] [US3] Integrate runtime cache utility into useAnnouncements composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useAnnouncements.ts
- [X] T025 [P] [US3] Integrate runtime cache utility into usePublications composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/usePublications.ts
- [X] T026 [P] [US3] Integrate runtime cache utility into useVideos composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useVideos.ts
- [X] T027 [P] [US3] Integrate runtime cache utility into useInfographics composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useInfographics.ts
- [X] T028 [P] [US3] Integrate runtime cache utility into usePodcasts composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/usePodcasts.ts
- [X] T029 [P] [US3] Integrate runtime cache utility into useWorkstreams composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useWorkstreams.ts
- [X] T030 [P] [US3] Integrate runtime cache utility into useWorkstream composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/useWorkstream.ts
- [X] T031 [P] [US3] Integrate runtime cache utility into usePeople composable with 5-minute TTL in bfna-website-nuxt/src/composables/data/usePeople.ts

### Error Handling Enhancement

- [X] T032 [US3] Enhance error logging to include collection name and error type in all composables
- [X] T033 [US3] Verify fallback behavior works correctly when Directus API is unavailable (test with invalid URL)
- [X] T034 [US3] Verify fallback behavior works correctly for partial API failures (some collections work, others don't)

**Checkpoint**: All composables have runtime caching and enhanced error handling. Cache hit rate should exceed 80% for repeated requests.

---

## Phase 5: Scroll-Based Loading Implementation

**Purpose**: Implement infinite scroll for large datasets per FR-011

- [ ] T035 Create useInfiniteScroll composable using VueUse useIntersectionObserver in bfna-website-nuxt/src/composables/data/useInfiniteScroll.ts
- [ ] T036 Integrate scroll-based loading into products page (load first 100 items, then next 100 at 80% scroll threshold) in bfna-website-nuxt/src/pages/products/index.vue
- [ ] T037 Integrate scroll-based loading into publications tab on updates page in bfna-website-nuxt/src/pages/updates.vue
- [ ] T038 Integrate scroll-based loading into videos tab on updates page in bfna-website-nuxt/src/pages/updates.vue
- [ ] T039 Integrate scroll-based loading into infographics tab on updates page in bfna-website-nuxt/src/pages/updates.vue

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, testing, and documentation

- [ ] T040 Update search index generation script to fetch from Directus in bfna-website-nuxt/scripts/generate-search-index.ts
- [ ] T041 Verify all pages render identically to static JSON version (visual parity check)
- [ ] T042 Test error handling by temporarily breaking Directus URL and verifying fallback works
- [ ] T043 Verify cache hit rate exceeds 80% for repeated data requests
- [ ] T044 Verify Directus API response times are under 500ms (95th percentile)
- [ ] T045 Verify build time increase is less than 30% compared to static JSON approach
- [ ] T046 Verify zero breaking changes - all existing pages render identically
- [ ] T047 [P] Update frontend migration documentation if needed in specs/003-directus-migration/frontend-changes/FRONTEND_MIGRATION.md
- [ ] T048 Verify TypeScript types are correct and provide type safety for all Directus queries
- [ ] T049 Test content updates in Directus and verify changes appear in frontend within 5 minutes (cache TTL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all composable migration
- **User Story 1 (Phase 3)**: Depends on Foundational completion - Core migration work
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion - Enhances existing composables
- **Scroll Loading (Phase 5)**: Can start after User Story 1, but benefits from caching (User Story 3)
- **Polish (Phase 6)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Depends on User Story 1 - Enhances composables created in US1

### Within Each User Story

- Simple composables can be migrated in parallel (T008-T010) - error handling integrated
- Complex composables should be migrated sequentially to verify pattern works (T011-T014) - error handling integrated
- Special case composables can be migrated after complex ones (T015-T017) - error handling integrated
- Caching added after migration (T022-T031)

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel (different files)
- **Phase 2**: T005 and T006 can run in parallel (different functions in same file, but can be done separately)
- **Phase 3**: T008, T009, T010 can run in parallel (different composables)
- **Phase 4**: T023-T031 can run in parallel (different composables, same pattern)
- **Phase 5**: T036-T039 can run in parallel (different pages)
- **Phase 6**: T047 can run in parallel with testing tasks

---

## Parallel Example: User Story 1 - Simple Composables

```bash
# Launch all simple composable migrations together:
Task: "Migrate useProducts composable to fetch from Directus"
Task: "Migrate useNews composable to fetch from Directus"
Task: "Migrate useAnnouncements composable to fetch from Directus singleton"
```

---

## Parallel Example: User Story 3 - Runtime Caching

```bash
# Launch all runtime cache integrations together:
Task: "Integrate runtime cache utility into useNews composable"
Task: "Integrate runtime cache utility into useAnnouncements composable"
Task: "Integrate runtime cache utility into usePublications composable"
Task: "Integrate runtime cache utility into useVideos composable"
# ... (all composables can be cached in parallel)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T007)
3. Complete Phase 3: User Story 1 - Migrate one composable first (T008), verify it works
4. Complete Phase 3: Migrate remaining composables (T009-T017), then add build-time caching (T021)
5. **STOP and VALIDATE**: Test all pages render correctly, verify error handling works
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (migrate all composables) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 (caching) → Test independently → Deploy/Demo
4. Add Scroll Loading → Test independently → Deploy/Demo
5. Polish and finalize → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Migrate simple composables with error handling (T008-T010)
   - Developer B: Migrate complex composables with error handling (T011-T014)
   - Developer C: Migrate special case composables with error handling (T015-T017)
3. All developers: Add build-time caching (T021) and runtime caching (T022-T031)
4. Final integration and testing together

---

## Notes

- **[P] tasks** = different files, no dependencies - can work in parallel
- **[Story] label** maps task to specific user story for traceability
- Each composable migration is independent - can test individually
- Keep static JSON files during migration as fallback
- Verify each composable works before moving to next
- Test error handling by breaking Directus URL temporarily
- Monitor build times and API response times during migration
- Commit after each composable migration for easy rollback

---

## Task Summary

**Total Tasks**: 46

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (User Story 1): 11 tasks
- Phase 4 (User Story 3): 13 tasks
- Phase 5 (Scroll Loading): 5 tasks
- Phase 6 (Polish): 10 tasks

**By User Story**:
- User Story 1: 11 tasks (composable migration with integrated error handling)
- User Story 3: 13 tasks (caching and error handling enhancement)
- Scroll Loading: 5 tasks
- Polish: 10 tasks

**Parallel Opportunities**: 
- 4 tasks in Phase 1
- 9 tasks in Phase 4 (runtime caching)
- 4 tasks in Phase 5 (scroll loading integration)
- Multiple opportunities for parallel work within User Story 1

**Suggested MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) - 18 tasks total. This delivers fully functional Directus integration with integrated error handling.

