# Research: Verify Infographic & News Detail Pages

**Feature**: Verify Infographic & News Detail Pages  
**Date**: 2025-01-27  
**Phase**: 0 - Research & Analysis

## Research Findings

### 1. Existing Route Handler Pattern Analysis

**Decision**: Use catch-all route `[...slug].vue` with computed property pattern matching

**Rationale**: 
- Current implementation uses a catch-all route that matches products, publications, videos, and podcasts
- Pattern uses `normalizePath()` and `normalizeUrl()` functions for consistent URL matching
- Each content type has a computed property that searches the data array
- Route returns 404 if no match found after all data loads

**Implementation Pattern**:
```typescript
// Normalize route path
const normalizePath = (path: string) => {
  let normalized = path.startsWith('/') ? path : '/' + path
  normalized = normalized.replace(/\/$/, '') || normalized
  return normalized
}

// Find content by matching button.url
const content = computed(() => {
  if (!data.value?.items) return null
  const routePath = normalizedRoutePath.value
  const found = data.value.items.find(
    (item: any) => {
      const url = normalizeUrl(item.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  return found || null
})
```

**Alternatives Considered**:
- Dedicated route files (e.g., `infographics/[slug].vue`) - Rejected: Would require route changes and doesn't match existing pattern
- Separate catch-all route - Rejected: Unnecessary complexity, current route can handle all content types

### 2. Infographic Data Structure Analysis

**Decision**: Infographics use `button.url` for routing, similar to publications/videos/podcasts

**Rationale**:
- Infographics JSON structure matches pattern: `items[]` array with `button.url` field
- Fields available: `heading`, `subheading`, `by_line`, `content`, `infographic.url`, `image`, `breadcrumbs`
- Structure is consistent with other content types in the catch-all route

**Key Fields**:
- `button.url`: Route path (e.g., `/politics-society/strength-in-numbers-2bfro5dcbt/`)
- `heading`: Main title
- `subheading`: Secondary title
- `by_line`: Author/publication info
- `content`: HTML content
- `infographic.url`: Download link for original image
- `image`: Image object with `url` and `title`
- `breadcrumbs`: Navigation breadcrumb structure

**Alternatives Considered**: None - data structure is fixed from extraction

### 3. News Item Data Structure Analysis

**Decision**: News items are primarily external links, no internal detail pages needed

**Rationale**:
- News items have `url` field pointing to external sites or internal pages
- No `button.url` pattern - direct `url` field
- News items displayed on homepage/updates page as cards with links
- Verification focuses on ensuring links resolve correctly (internal or external)

**Key Fields**:
- `url`: Destination URL (can be internal or external)
- `heading`: Title
- `excerpt`: Description
- `image`: Image object
- `type`: Content type identifier

**Alternatives Considered**:
- Creating internal detail pages for news - Rejected: Not in scope, news items are link-only content

### 4. Legacy Infographic Template Analysis

**Decision**: Use existing article template pattern with infographic-specific image display

**Rationale**:
- Legacy `prose.njk` template shows infographics use article layout with special infographic image section
- Template includes: breadcrumbs, heading/subheading, byline, content, infographic image with download link
- Matches pattern used for publications/videos in current implementation

**Template Structure**:
- Breadcrumb navigation
- Header section (brow, heading, subheading, byline)
- Content body (HTML)
- Infographic image section (image with download button)

**Components Needed**:
- `LegacyMoleculesBreadcrumb` (already exists)
- Article header structure (already exists in publications/videos)
- Infographic image display (needs implementation or reuse from legacy)

**Alternatives Considered**: None - must match legacy structure for visual parity

### 5. Missing Route Handlers Identification

**Decision**: Add infographic handling to catch-all route, verify news links work

**Rationale**:
- Infographics are NOT currently handled in `[...slug].vue`
- Need to add computed property for infographic matching
- Need to add infographic template rendering
- News items don't need route handlers (external links only)

**What Needs Implementation**:
1. Add `useInfographics()` composable call to catch-all route
2. Add `infographic` computed property matching `button.url`
3. Add infographic template section to route (similar to publication/video sections)
4. Verify news item links resolve correctly (manual testing)

**What Doesn't Need Implementation**:
- News detail pages (not in scope)
- New route files (use existing catch-all)
- Data structure changes (use existing JSON)

## Consolidated Decisions

| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Use catch-all route pattern | Matches existing implementation | Dedicated routes - rejected (inconsistent) |
| Infographics use `button.url` matching | Consistent with publications/videos | Custom routing - rejected (unnecessary) |
| News items are external links only | Matches current data structure | Internal pages - rejected (out of scope) |
| Reuse article template pattern | Maintains visual parity | New template - rejected (breaks parity) |
| Add infographic to catch-all route | Simplest implementation | Separate route - rejected (inconsistent) |

## Open Questions Resolved

- ✅ How should infographics be routed? → Catch-all route with `button.url` matching
- ✅ Do news items need detail pages? → No, external links only
- ✅ What template structure to use? → Article template with infographic image section
- ✅ Where to add infographic handling? → Existing `[...slug].vue` catch-all route

## Next Steps

Proceed to Phase 1: Design & Contracts
- Create data-model.md with entity definitions
- Create contracts/ with route specifications
- Create quickstart.md with implementation guide

