# Implementation Plan: Verify Infographic & News Detail Pages

**Branch**: `001-verify-infographic-news-pages` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-verify-infographic-news-pages/spec.md`

## Summary

Verify and implement missing route handlers for infographic and news detail pages. The catch-all route `[...slug].vue` currently handles products, publications, videos, and podcasts, but does not handle infographics or news items. This plan covers adding infographic route handling to match the existing pattern, verifying news item link resolution, and ensuring all content fields display correctly.

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3.x, Nuxt 3.x  
**Primary Dependencies**: Nuxt 3, Vue 3, @nuxt/content, @nuxt/image  
**Storage**: Static JSON files in `src/content/data/` (no database)  
**Testing**: Manual verification, route testing  
**Target Platform**: Web (SSR/SSG)  
**Project Type**: Web application (Nuxt 3)  
**Performance Goals**: Route resolution < 100ms, page render < 2s  
**Constraints**: Must match existing route patterns, preserve URL structure, graceful rendering with missing fields  
**Scale/Scope**: ~50-100 infographics, ~20-30 news items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Reference**: `.specify/memory/constitution.md`

**Principles to Verify**:
- **I. "Good enough to work, ready to replace"**: ✅ Compliant - This is verification/implementation work, not optimization. Uses existing data structure, no Contentful dependencies.
- **II. CSS-First for Presentation, Composables for Data**: ✅ Compliant - Uses existing CSS classes, composables for data fetching (`useInfographics`, `useNews`), computed properties for data transformation.
- **III. Leverage Nuxt Built-ins & Ecosystem**: ✅ Compliant - Uses `useAsyncData`, `useRoute`, `computed`, file-based routing. No custom implementations needed.

**Decision Framework**: Applied - This is component/route work (in scope), uses Nuxt built-ins, no Contentful optimization needed.

**Compliance Status**: ✅ Compliant

## Project Structure

### Documentation (this feature)

```text
specs/001-verify-infographic-news-pages/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bfna-website-nuxt/
├── src/
│   ├── pages/
│   │   └── [...slug].vue          # Catch-all route (needs infographic handling)
│   ├── composables/
│   │   └── data/
│   │       ├── useInfographics.ts  # Existing composable
│   │       └── useNews.ts          # Existing composable
│   └── components/
│       └── legacy/
│           ├── molecules/
│           │   └── Breadcrumb.vue  # Existing component
│           └── templates/
│               └── (article template components)
└── src/content/data/
    ├── infographics.json           # Static data source
    └── news.json                    # Static data source
```

**Structure Decision**: Single Nuxt application. Infographic detail pages will be added to the existing catch-all route `[...slug].vue` following the same pattern as publications, videos, and podcasts. News items are primarily external links; verification focuses on link resolution.

## Complexity Tracking

> **No violations - all compliant with constitution**

## Phase 0: Research & Analysis

### Research Tasks

1. **Analyze existing route handler pattern**
   - Review `[...slug].vue` implementation
   - Understand normalization logic for URL matching
   - Document pattern for adding new content types

2. **Review infographic data structure**
   - Examine `infographics.json` structure
   - Identify all fields that need to be displayed
   - Compare with legacy `prose.njk` template structure

3. **Review news item data structure**
   - Examine `news.json` structure
   - Determine if news items have internal detail pages or are external links only
   - Verify URL field format and validation needs

4. **Review legacy infographic template**
   - Analyze `prose.njk` template for infographics
   - Identify required components (breadcrumbs, image display, download link)
   - Map template structure to Vue component structure

5. **Identify missing route handlers**
   - Confirm infographics are not handled in catch-all route
   - Verify news items routing approach
   - Document what needs to be implemented

### Research Output

See `research.md` for consolidated findings.

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for entity definitions and relationships.

**Key Entities**:
- **Infographic**: Fields include `button.url`, `heading`, `subheading`, `by_line`, `content`, `infographic.url`, `image`, `breadcrumbs`
- **News Item**: Fields include `url`, `heading`, `excerpt`, `image`, `type`

### API Contracts

See `contracts/` directory for route contracts.

**Route Contracts**:
- `GET /{infographic-path}` - Infographic detail page (via catch-all route)
- News items: External links (no internal API contract needed)

### Quickstart Guide

See `quickstart.md` for implementation steps and verification procedures.

## Phase 2: Implementation Planning

**Note**: Phase 2 planning (task breakdown) is handled by `/speckit.tasks` command, not `/speckit.plan`.

This plan covers Phase 0 (research) and Phase 1 (design) only.
