# Tasks: Phase 1 Website Platform Migration

**Input**: Design documents from `/specs/001-nuxt-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are excluded.

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

- **Web app**: `bfna-website-nuxt/src/` at repository root
- Legacy assets: `bfna-website-legacy/src/assets/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, data extraction, and asset copying

- [X] T001 Extract Contentful data by running `scripts/extract-contentful-data.js` in `bfna-website-legacy/` (Data files already exist in export directory)
- [X] T002 Copy extracted JSON files from `bfna-website-legacy/_data/contentful-export/` to `bfna-website-nuxt/src/content/data/`
- [X] T003 [P] Copy favicon assets from `bfna-website-legacy/src/assets/favicon/` to `bfna-website-nuxt/src/public/favicon/`
- [X] T004 [P] Copy file assets from `bfna-website-legacy/src/assets/files/` to `bfna-website-nuxt/src/public/files/`
- [X] T005 [P] Copy font assets from `bfna-website-legacy/src/assets/fonts/` to `bfna-website-nuxt/src/public/fonts/`
- [X] T006 [P] Copy image assets from `bfna-website-legacy/src/assets/images/` to `bfna-website-nuxt/src/public/images/`
- [X] T007 Copy legacy CSS files from `bfna-website-legacy/src/assets/css/` to `bfna-website-nuxt/src/public/css-legacy/`
- [X] T008 Create `bfna-website-nuxt/src/public/css-legacy/legacy-styles.css` with @import statements for all legacy CSS partials
- [X] T009 Verify VueUse is installed: `npm install @vueuse/core @vueuse/nuxt` in `bfna-website-nuxt/`
- [X] T010 Verify @nuxt/image module is configured in `bfna-website-nuxt/nuxt.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Create directory structure `bfna-website-nuxt/src/components/legacy/atoms/`
- [X] T012 [P] Create directory structure `bfna-website-nuxt/src/components/legacy/molecules/`
- [X] T013 [P] Create directory structure `bfna-website-nuxt/src/components/legacy/organisms/`
- [X] T014 [P] Create directory structure `bfna-website-nuxt/src/components/legacy/templates/`
- [X] T015 Create directory structure `bfna-website-nuxt/src/composables/data/`
- [X] T016 Create directory structure `bfna-website-nuxt/src/composables/legacy/`
- [X] T017 Create directory structure `bfna-website-nuxt/src/layouts/legacy/`
- [X] T018 [P] [US2] Create data composable `useProducts.ts` in `bfna-website-nuxt/src/composables/data/useProducts.ts` using `useAsyncData()` to read from `src/content/data/products.json`
- [X] T019 [P] [US2] Create data composable `usePublications.ts` in `bfna-website-nuxt/src/composables/data/usePublications.ts` using `useAsyncData()` to read from `src/content/data/publications.json`
- [X] T020 [P] [US2] Create data composable `useVideos.ts` in `bfna-website-nuxt/src/composables/data/useVideos.ts` using `useAsyncData()` to read from `src/content/data/videos.json`
- [X] T021 [P] [US2] Create data composable `useInfographics.ts` in `bfna-website-nuxt/src/composables/data/useInfographics.ts` using `useAsyncData()` to read from `src/content/data/infographics.json`
- [X] T022 [P] [US2] Create data composable `usePeople.ts` in `bfna-website-nuxt/src/composables/data/usePeople.ts` using `useAsyncData()` to read from `src/content/data/people.json`
- [X] T023 [P] [US2] Create data composable `usePodcasts.ts` in `bfna-website-nuxt/src/composables/data/usePodcasts.ts` using `useAsyncData()` to read from `src/content/data/podcasts.json`
- [X] T024 [P] [US2] Create data composable `useNews.ts` in `bfna-website-nuxt/src/composables/data/useNews.ts` using `useAsyncData()` to read from `src/content/data/news.json`
- [X] T025 [P] [US2] Create data composable `useAnnouncements.ts` in `bfna-website-nuxt/src/composables/data/useAnnouncements.ts` using `useAsyncData()` to read from `src/content/data/announcement.json`
- [X] T026 [P] [US2] Create data composable `useWorkstreams.ts` in `bfna-website-nuxt/src/composables/data/useWorkstreams.ts` using `useAsyncData()` to read from `src/content/data/workstreams.json`
- [X] T027 Migrate base layout from `bfna-website-legacy/src/_includes/layouts/base.njk` to `bfna-website-nuxt/src/layouts/legacy/base.vue` preserving exact HTML structure and CSS classes
- [X] T028 Configure `bfna-website-nuxt/nuxt.config.ts` to unplug legacy CSS (comment out or conditionally disable `css-legacy/legacy-styles.css` import)
- [X] T029 Create basic error page `bfna-website-nuxt/src/error.vue` with minimal error handling (basic 404 page per FR-016)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Website Visitors Access All Pages (Priority: P1) 🎯 MVP

**Goal**: Website visitors can access and view all pages on the new platform exactly as they appeared on the legacy platform, with no visible differences in appearance, functionality, or content.

**Independent Test**: Navigate through all page types (homepage, product pages, publication pages, team pages, search, etc.) and verify visual parity, content accuracy, and interactive functionality match the legacy site exactly.

### Implementation for User Story 1

- [X] T030 [US1] Migrate homepage template from `bfna-website-legacy/src/index.html` to `bfna-website-nuxt/src/pages/index.vue` preserving exact HTML structure and CSS classes
- [X] T031 [US1] Migrate about page template from `bfna-website-legacy/src/about.html` to `bfna-website-nuxt/src/pages/about.vue` preserving exact HTML structure and CSS classes
- [X] T032 [US1] Migrate team page template from `bfna-website-legacy/src/team.html` to `bfna-website-nuxt/src/pages/team.vue` preserving exact HTML structure and CSS classes
- [X] T033 [US1] Create products listing page `bfna-website-nuxt/src/pages/products/index.vue` using data from `useProducts()` composable
- [X] T034 [US1] Create product detail page `bfna-website-nuxt/src/pages/products/[slug].vue` preserving exact HTML structure and CSS classes from legacy product template
- [X] T035 [US1] Create publications listing page `bfna-website-nuxt/src/pages/publications/index.vue` using data from `usePublications()` composable
- [X] T036 [US1] Create publication detail page `bfna-website-nuxt/src/pages/publications/[slug].vue` preserving exact HTML structure and CSS classes from legacy publication template
- [X] T037 [US1] Create videos listing page `bfna-website-nuxt/src/pages/videos/index.vue` using data from `useVideos()` composable
- [X] T038 [US1] Create video detail page `bfna-website-nuxt/src/pages/videos/[slug].vue` preserving exact HTML structure and CSS classes from legacy video template
- [X] T039 [US1] Create podcasts listing page `bfna-website-nuxt/src/pages/podcasts/index.vue` using data from `usePodcasts()` composable
- [X] T040 [US1] Create podcast detail page `bfna-website-nuxt/src/pages/podcasts/[slug].vue` preserving exact HTML structure and CSS classes from legacy podcast template
- [X] T041 [US1] Migrate search page template from `bfna-website-legacy/src/search.html` to `bfna-website-nuxt/src/pages/search.vue` preserving exact HTML structure and CSS classes
- [X] T042 [US1] Migrate archives page template from `bfna-website-legacy/src/archives.html` to `bfna-website-nuxt/src/pages/archives.vue` preserving exact HTML structure and CSS classes
- [X] T043 [US1] Migrate card component from `bfna-website-legacy/src/_includes/modules/card.njk` to `bfna-website-nuxt/src/components/legacy/molecules/Card.vue` preserving exact HTML structure and CSS classes
- [X] T044 [US1] Migrate header/navigation component from `bfna-website-legacy/src/_includes/` to `bfna-website-nuxt/src/components/legacy/organisms/Header.vue` preserving exact HTML structure and CSS classes
- [X] T045 [US1] Migrate footer component from `bfna-website-legacy/src/_includes/` to `bfna-website-nuxt/src/components/legacy/organisms/Footer.vue` preserving exact HTML structure and CSS classes
- [X] T046 [US1] Migrate breadcrumb component from `bfna-website-legacy/src/_includes/` to `bfna-website-nuxt/src/components/legacy/molecules/Breadcrumb.vue` preserving exact HTML structure and CSS classes
- [ ] T047 [US1] Verify all pages render with identical visual appearance, layout, and styling compared to legacy platform (visual parity check per SC-001)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - all page types accessible with visual parity

---

## Phase 4: User Story 2 - All Content Displays Accurately (Priority: P1)

**Goal**: All website content (products, publications, videos, infographics, team information, podcasts, news) displays accurately with correct formatting, images, and metadata.

**Independent Test**: Compare content from extracted data files against rendered pages, verifying all fields, relationships, and nested structures display correctly.

### Implementation for User Story 2

- [ ] T048 [US2] Verify all content fields display correctly in product pages (title, heading, type, subheading, description, team_section per data-model.md)
- [ ] T049 [US2] Verify all content fields display correctly in publication pages (title, heading, authors, content, excerpt, publication_date per data-model.md)
- [ ] T050 [US2] Verify all content fields display correctly in video pages (title, heading, video_url, thumbnail_url, description, speakers per data-model.md)
- [ ] T051 [US2] Verify all content fields display correctly in infographic pages (title, heading, image_url, description, alt_text per data-model.md)
- [ ] T052 [US2] Verify all content fields display correctly in podcast pages (title, heading, audio_url, description, duration, hosts per data-model.md)
- [ ] T053 [US2] Verify all content fields display correctly in news pages (title, heading, content, excerpt, published_date, source per data-model.md)
- [ ] T054 [US2] Verify all content fields display correctly in team pages (name, role, bio, image_url, linkedin, twitter per data-model.md)
- [ ] T055 [US2] Verify images display correctly with proper sizing using `<NuxtImg>` component in all content pages
- [ ] T056 [US2] Verify relationships display correctly (publications with authors, products with team_section per data-model.md)
- [ ] T057 [US2] Verify rich text/markdown formatting renders correctly with proper HTML structure in content pages
- [ ] T058 [US2] Verify all content types display with 100% data accuracy (all fields, relationships, nested structures match legacy platform per SC-002)

**Checkpoint**: At this point, User Story 2 should be complete - all content displays accurately with correct formatting

---

## Phase 5: User Story 3 - Navigation and Routing Work Correctly (Priority: P1)

**Goal**: All navigation links, URLs, and routing function correctly, maintaining the same URL structure as the legacy site.

**Independent Test**: Navigate through all site sections using main navigation, breadcrumbs, and internal links, verifying URLs match legacy structure and all routes resolve correctly.

### Implementation for User Story 3

- [ ] T059 [US3] Verify file-based routing in `bfna-website-nuxt/src/pages/` matches legacy URL structure exactly (FR-004)
- [ ] T060 [US3] Extract redirect rules from `bfna-website-legacy/src/_redirects` and verify legacy redirect behavior
- [ ] T061 [US3] Implement redirect rules matching legacy platform exactly in `bfna-website-nuxt/nuxt.config.ts` using route rules or Nitro middleware (FR-020)
- [ ] T062 [US3] Verify main navigation links navigate to correct pages with expected URL structure
- [ ] T063 [US3] Verify breadcrumb navigation works correctly and links resolve properly
- [ ] T064 [US3] Verify internal links within content pages navigate correctly
- [ ] T065 [US3] Verify browser back/forward buttons work correctly (browser history per acceptance scenario)
- [ ] T066 [US3] Verify direct URLs from legacy site load correctly or redirect appropriately on new platform
- [ ] T067 [US3] Verify search result links navigate to correct pages
- [ ] T068 [US3] Run automated link checking to verify zero broken links (SC-003)
- [ ] T069 [US3] Verify all navigation links and URLs function correctly with zero broken links (SC-003)

**Checkpoint**: At this point, User Story 3 should be complete - all navigation and routing work correctly

---

## Phase 6: User Story 4 - Interactive Features Function Correctly (Priority: P2)

**Goal**: All client-side interactive features (search, filtering, card interactions, typewriter effects, lazy loading) work correctly with appropriate performance characteristics.

**Independent Test**: Interact with each feature independently, verifying behavior matches legacy site and performance is acceptable.

### Implementation for User Story 4

- [ ] T070 [US4] Migrate search functionality from `bfna-website-legacy/src/assets/js/search.js` to `bfna-website-nuxt/src/composables/legacy/useSearch.ts` using `useDebounce()` from VueUse (300ms per SC-006)
- [ ] T071 [US4] Integrate `useSearch()` composable into search page `bfna-website-nuxt/src/pages/search.vue`
- [ ] T072 [US4] Verify search results update appropriately with debouncing behavior matching legacy site (300ms per SC-006)
- [ ] T073 [US4] Migrate filtering functionality from `bfna-website-legacy/src/assets/js/cardFilters.js` to `bfna-website-nuxt/src/composables/legacy/useCardFilters.ts` using Vue reactivity (`ref`, `computed`)
- [ ] T074 [US4] Integrate `useCardFilters()` composable into content listing pages
- [ ] T075 [US4] Verify filtering functionality works correctly and updates display appropriately
- [ ] T076 [US4] Migrate typewriter effect from `bfna-website-legacy/src/assets/js/typeWriterEffect.js` to `bfna-website-nuxt/src/composables/legacy/useTypeWriter.ts` (use VueUse `useInterval` if applicable)
- [ ] T077 [US4] Integrate `useTypeWriter()` composable into pages that use typewriter effect
- [ ] T078 [US4] Implement lazy loading using `useIntersectionObserver()` from VueUse for lazy-loaded content in `bfna-website-nuxt/src/composables/legacy/useLazyLoading.ts`
- [ ] T079 [US4] Integrate lazy loading composable into pages with lazy-loaded content
- [ ] T080 [US4] Verify lazy loading triggers correctly when content comes into view
- [ ] T081 [US4] Verify animations and state changes occur smoothly for dynamic UI elements
- [ ] T082 [US4] Verify all interactive features function correctly with performance characteristics matching or exceeding legacy platform (search results <300ms per SC-006)

**Checkpoint**: At this point, User Story 4 should be complete - all interactive features work correctly

---

## Phase 7: User Story 5 - Site Can Be Deployed Independently (Priority: P2)

**Goal**: The new platform can be built and deployed independently of the legacy platform, enabling parallel operation and gradual cutover.

**Independent Test**: Build the application, verify it produces a deployable artifact, and confirm it runs without dependencies on the legacy platform.

### Implementation for User Story 5

- [ ] T083 [US5] Verify build command `npm run build` completes successfully without errors in `bfna-website-nuxt/`
- [ ] T084 [US5] Verify build completes in under 5 minutes (SC-004)
- [ ] T085 [US5] Verify build produces deployable artifact without requiring legacy platform to be running
- [ ] T086 [US5] Verify deployed application serves pages correctly without requiring legacy platform dependencies (SC-005)
- [ ] T087 [US5] Verify all static assets (CSS, images, fonts) load correctly from new platform (zero 404 errors per SC-008)
- [ ] T088 [US5] Verify application runs in production without requiring legacy platform to be running (SC-005)
- [ ] T089 [US5] Verify application rebuilds correctly when data files are updated (FR-017)
- [ ] T090 [US5] Verify manual content update process: re-run extraction script and rebuild reflects changes correctly (FR-017)
- [ ] T091 [US5] Run dependency audit to verify zero Contentful API calls or dependencies exist in deployed application (SC-010)
- [ ] T092 [US5] Verify runtime monitoring shows zero Contentful dependencies (SC-010)

**Checkpoint**: At this point, User Story 5 should be complete - site can be deployed independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T093 [P] Verify responsive behavior across all breakpoints matching legacy platform (mobile, tablet, desktop per SC-007)
- [ ] T094 [P] Verify browser compatibility matches legacy platform exactly (cross-browser testing per SC-009)
- [ ] T095 [P] Implement third-party integration failure handling (Embedly, Twitter widgets) by hiding failed integrations silently without breaking page layout in `bfna-website-nuxt/src/composables/legacy/useThirdPartyIntegrations.ts` (FR-019)
- [ ] T096 [P] Verify third-party integrations degrade gracefully when they fail to load
- [ ] T097 [P] Verify CSS classes are preserved exactly between legacy and new platform (no class name mismatches)
- [ ] T098 [P] Verify all page templates render with 100% visual parity (automated visual regression testing or manual comparison per SC-001)
- [ ] T099 [P] Run quickstart.md validation checklist to verify all setup steps completed correctly
- [ ] T100 [P] Document any intentional deviations from legacy platform for stakeholder sign-off

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses data composables from Phase 2, may integrate with US1 components but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 pages existing but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 pages existing but independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on all pages existing but independently testable

### Within Each User Story

- Data composables before pages (for US1, US2)
- Base components before page templates (for US1)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T006)
- All Foundational data composable tasks marked [P] can run in parallel (T018-T026)
- Once Foundational phase completes, User Stories 1, 2, 3 can start in parallel (if team capacity allows)
- User Stories 4 and 5 can proceed in parallel after P1 stories complete
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all page migrations in parallel (different files):
Task: "Migrate homepage template to bfna-website-nuxt/src/pages/index.vue"
Task: "Migrate about page template to bfna-website-nuxt/src/pages/about.vue"
Task: "Migrate team page template to bfna-website-nuxt/src/pages/team.vue"
Task: "Create products listing page bfna-website-nuxt/src/pages/products/index.vue"
Task: "Create publications listing page bfna-website-nuxt/src/pages/publications/index.vue"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all data composables in parallel (different files):
Task: "Create useProducts.ts in bfna-website-nuxt/src/composables/data/useProducts.ts"
Task: "Create usePublications.ts in bfna-website-nuxt/src/composables/data/usePublications.ts"
Task: "Create useVideos.ts in bfna-website-nuxt/src/composables/data/useVideos.ts"
Task: "Create useInfographics.ts in bfna-website-nuxt/src/composables/data/useInfographics.ts"
Task: "Create usePeople.ts in bfna-website-nuxt/src/composables/data/usePeople.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - verify visual parity
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (pages)
   - Developer B: User Story 2 (content accuracy)
   - Developer C: User Story 3 (navigation/routing)
3. After P1 stories complete:
   - Developer A: User Story 4 (interactive features)
   - Developer B: User Story 5 (deployment)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks must preserve exact HTML structure and CSS classes (FR-001)
- Use Nuxt built-ins (`useAsyncData`, `useFetch`) for data fetching (Principle III)
- Use VueUse composables (`useDebounce`, `useIntersectionObserver`) for data operations (Principle III)
- Use CSS for all responsive behavior, not JavaScript (Principle II)
- Defer all Contentful optimization and data model refactoring to Phase 2 (Principle I)

