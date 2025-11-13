---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Add Vitest tasks when the specification requires automated coverage or when touching stores/composables; note whether they are unit or component tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Pages live in `src/pages/` (routing) and MUST stay orchestration-only.
- Reusable UI belongs in `src/components/ccm*/`.
- Shared logic/composables belong in `src/composables/` and Pinia stores in `src/plugins/` when required.
- Content is stored under `src/content/` and CSS layers under `src/public/css/`.
- Vitest specs mirror source structure inside `src/tests/` (e.g., `src/tests/components/`, `src/tests/composables/`).

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Scaffold feature directories (e.g., `src/components/ccmFeature/`, `src/content/feature/`)
- [ ] T002 Ensure dependencies installed (`npm install`)
- [ ] T003 [P] Configure linting (`npx eslint . --ext .ts,.vue`) and formatting checkpoints

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Create/extend base layout or shared `ccm` components required across stories
- [ ] T005 [P] Add composables/Pinia stores for shared data or configuration
- [ ] T006 [P] Define required Markdown/content entries with front matter in `src/content/`
- [ ] T007 Register necessary plugins in `src/plugins/` and expose runtime config defaults
- [ ] T008 Configure error handling/logging for affected server routes (if any)
- [ ] T009 Update `src/public/css` layers with required tokens/utilities

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Component test for `ccmFeaturePrimary.vue` in `src/tests/components/ccmFeaturePrimary.spec.ts`
- [ ] T011 [P] [US1] Composable test for `useFeatureData` in `src/tests/composables/useFeatureData.spec.ts`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Build `src/components/ccmFeaturePrimary.vue` with `<script setup lang="ts">`
- [ ] T013 [P] [US1] Add supporting elements (e.g., call-to-action) in `src/components/ccmFeature/`
- [ ] T014 [US1] Implement `useFeatureData.ts` composable under `src/composables/`
- [ ] T015 [US1] Wire route in `src/pages/feature.vue` to use the new components/composables
- [ ] T016 [US1] Load copy from `src/content/feature/index.md` and handle empty state
- [ ] T017 [US1] Ensure logging/analytics hooks fire where required

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Component test for secondary view in `src/tests/components/ccmFeatureSecondary.spec.ts`
- [ ] T019 [P] [US2] Store/composable regression test in `src/tests/composables/useFeatureData.spec.ts`

### Implementation for User Story 2

- [ ] T020 [P] [US2] Extend `src/content/` collection with P2-specific entries
- [ ] T021 [US2] Add interactive behavior within `src/components/ccmFeatureSecondary.vue`
- [ ] T022 [US2] Update composables or Pinia store to expose additional state
- [ ] T023 [US2] Integrate new component into layout while preserving US1 independence

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Accessibility regression test (e.g., `@testing-library/vue`) for tertiary component
- [ ] T025 [P] [US3] Snapshot or visual diff for layout updates (if enabled)

### Implementation for User Story 3

- [ ] T026 [P] [US3] Add tertiary content variants under `src/content/feature/`
- [ ] T027 [US3] Enhance `src/components/ccmFeatureTertiary.vue` with progressive enhancement
- [ ] T028 [US3] Update route/page level composition while keeping composables reusable

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates (`src/content/`, README extracts, or design notes)
- [ ] TXXX Code cleanup and refactoring (split oversized components, remove dead composables)
- [ ] TXXX Performance optimization (analyze bundle via `npm run build --analyze`)
- [ ] TXXX [P] Additional Vitest coverage (component/composable)
- [ ] TXXX Accessibility and SEO hardening (ARIA, meta tags)
- [ ] TXXX Validate quickstart instructions still reflect new UX

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Components before page wiring
- Composables/stores before consumption
- Copy/content before runtime wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Supporting components/composables within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Component test for `ccmFeaturePrimary` in src/tests/components/ccmFeaturePrimary.spec.ts"
Task: "Composable test for `useFeatureData` in src/tests/composables/useFeatureData.spec.ts"

# Launch UI building tasks for User Story 1 together:
Task: "Build `src/components/ccmFeaturePrimary.vue`"
Task: "Add supporting `src/components/ccmFeature/CallToAction.vue`"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
