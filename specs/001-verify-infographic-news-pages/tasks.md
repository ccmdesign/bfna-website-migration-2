# Tasks: Verify Infographic & News Detail Pages

**Input**: Design documents from `/specs/001-verify-infographic-news-pages/`
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

Paths follow Nuxt 3 web application structure:
- `bfna-website-nuxt/src/` - Application source code
- `bfna-website-nuxt/src/content/` - Content files
- `bfna-website-nuxt/src/composables/` - Vue composables
- `bfna-website-nuxt/src/pages/` - Page components
- `bfna-website-nuxt/src/components/` - Vue components

## Phase 1: Setup (Prerequisites Verification)

**Purpose**: Verify existing infrastructure is in place

- [X] T001 Verify `useInfographics()` composable exists in `bfna-website-nuxt/src/composables/data/useInfographics.ts`
- [X] T002 Verify `useNews()` composable exists in `bfna-website-nuxt/src/composables/data/useNews.ts`
- [X] T003 Verify infographics data file exists in `bfna-website-nuxt/src/content/data/infographics.json`
- [X] T004 Verify news data file exists in `bfna-website-nuxt/src/content/data/news.json`
- [X] T005 Verify catch-all route exists in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T006 Verify `LegacyMoleculesBreadcrumb` component exists in `bfna-website-nuxt/src/components/legacy/molecules/Breadcrumb.vue`

**Checkpoint**: All prerequisites verified - proceed to implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks needed - all infrastructure already exists

**⚠️ CRITICAL**: This phase is empty because all required infrastructure (composables, data files, route file, components) already exists. User story implementation can begin immediately.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Access Infographic Detail Pages (Priority: P1) 🎯 MVP

**Goal**: Users can navigate to infographic detail pages via links from the updates page, homepage, or workstream pages and view the complete infographic content with all associated metadata.

**Independent Test**: Navigate to an infographic detail page URL (e.g., `/politics-society/strength-in-numbers-2bfro5dcbt/`) and verify the page loads correctly with all content fields displayed, including heading, subheading, byline, content, infographic image, and breadcrumbs.

### Implementation for User Story 1

- [X] T007 [US1] Import `useInfographics` composable in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T008 [US1] Add infographics data fetching using `useInfographics()` composable in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T009 [US1] Add `infographic` computed property to match infographic by `button.url` in `bfna-website-nuxt/src/pages/[...slug].vue` using existing normalization pattern
- [X] T010 [US1] Add infographic template section in `bfna-website-nuxt/src/pages/[...slug].vue` with breadcrumb, header (heading, subheading, byline), content, and infographic image with download link
- [X] T011 [US1] Update 404 check condition to include `infographic` in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T012 [US1] Add infographic title to `useHead()` title computed property in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T013 [US1] Add infographic image to `useHead()` og:image meta tag in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T014 [US1] Add infographic og_description to `useHead()` description meta tag in `bfna-website-nuxt/src/pages/[...slug].vue`
- [X] T015 [US1] Verify infographic routes resolve correctly by testing known infographic URLs from updates page
- [X] T016 [US1] Verify all content fields display correctly (breadcrumbs, heading, subheading, byline, content, image, download link)
- [X] T017 [US1] Verify route normalization handles trailing slashes correctly (test with and without trailing slash)
- [X] T018 [US1] Verify page renders gracefully when optional fields are missing

**Checkpoint**: At this point, User Story 1 should be fully functional - users can access infographic detail pages via routes and all content fields display correctly.

---

## Phase 4: User Story 2 - Access News Detail Pages (Priority: P2)

**Goal**: Users can navigate to news detail pages (if they exist) and view news content with all associated metadata, or verify that news items link correctly to their intended destinations (internal or external).

**Independent Test**: Navigate to a news detail page URL (if applicable) and verify the page loads correctly with all content fields displayed, or verify that news items link correctly to their intended destinations (internal or external).

### Implementation for User Story 2

- [X] T019 [US2] Verify news items are displayed on homepage in `bfna-website-nuxt/src/pages/index.vue`
- [X] T020 [US2] Test all news item links on homepage to verify they resolve correctly
- [X] T021 [US2] Verify internal news links navigate to correct pages (no 404 errors)
- [X] T022 [US2] Verify external news links open in new tab/window (target="_blank")
- [X] T023 [US2] Document any news items that link to non-existent internal pages
- [X] T024 [US2] Verify news item link destinations match `url` field values in `bfna-website-nuxt/src/content/data/news.json`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - infographic detail pages are functional and news item links resolve correctly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [X] T025 [P] Verify all infographic routes from updates page work correctly
- [X] T026 [P] Verify all infographic routes from homepage work correctly
- [X] T027 [P] Verify all infographic routes from workstream pages work correctly
- [X] T028 [P] Run quickstart.md validation checklist for infographic detail pages
- [X] T029 [P] Run quickstart.md validation checklist for news item links
- [X] T030 [P] Document any route normalization edge cases discovered during testing
- [X] T031 [P] Verify meta tags are correct for all infographic pages (title, og:image, description)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Empty - all infrastructure exists
- **User Story 1 (Phase 3)**: Can start immediately after Setup verification
- **User Story 2 (Phase 4)**: Can start immediately after Setup verification (independent of US1)
- **Polish (Phase 5)**: Depends on User Stories 1 and 2 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can start immediately
- **User Story 2 (P2)**: No dependencies on other stories - can start immediately and run in parallel with US1

### Within Each User Story

- Data fetching before route matching
- Route matching before template rendering
- Template rendering before meta tags
- Implementation before verification

### Parallel Opportunities

- Setup tasks T001-T006 can run in parallel (different files)
- User Stories 1 and 2 can be worked on in parallel (different concerns)
- Polish tasks T025-T031 can run in parallel (different verification areas)

---

## Parallel Example: User Story 1

```bash
# All implementation tasks can be done sequentially in the same file:
# T007-T014 are all modifications to [...slug].vue
# T015-T018 are verification tasks that can run after implementation
```

---

## Parallel Example: User Story 2

```bash
# All verification tasks can run in parallel:
Task: "Verify news items are displayed on homepage"
Task: "Test all news item links on homepage"
Task: "Verify internal news links navigate correctly"
Task: "Verify external news links open in new tab"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 3: User Story 1 (Infographic detail pages)
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → Foundation verified
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add Polish → Final verification → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup verification together
2. Once Setup is done:
   - Developer A: User Story 1 (Infographic routes)
   - Developer B: User Story 2 (News link verification)
3. Stories complete and verify independently
4. Team completes Polish phase together

---

## Notes

- [P] tasks = different files or independent verification areas, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- This is a verification/implementation task - most infrastructure already exists
- Focus on adding infographic handling to existing route and verifying news links

