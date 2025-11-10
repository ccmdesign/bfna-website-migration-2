# Phase 2 Migration Map: Component Architecture & Optimization

**Created**: 2025-01-27  
**Status**: Draft  
**Purpose**: Strategic map for Phase 2 - migrating barebones implementation to "Nuxt way"

---

## Overview

Phase 1 achieved visual parity with barebones migration. Phase 2 focuses on:
- **Structural Improvements**: Enable future design system matching
- **Duplication Elimination**: Consolidate repeated patterns
- **Data-Driven Configuration**: Move hardcoded configs to data files
- **Nuxt Content Integration**: Migrate from static JSON to Nuxt Content
- **Framework Leverage**: Maximize Nuxt, Nuxt Content, and VueUse capabilities

---

## Priority 1: Workstream Pages → Dynamic Route with Nuxt Content

### Current State
- 4 identical files: `democracy.vue`, `digital-world.vue`, `future-leadership.vue`, `politics-society.vue`
- Only difference: `workstreamsData.value?.['democracy']` vs `workstreamsData.value?.['digital-world']`
- ~70 lines duplicated × 4 = ~280 lines of duplication
- Data source: `content/data/workstreams.json` (static JSON)

### Target State
- Single dynamic route: `pages/workstreams/[workstream].vue`
- Data source: Nuxt Content (`content/workstreams/democracy.json`, etc.)
- Routes: `/workstreams/democracy`, `/workstreams/digital-world`, etc.
- Redirects: `/democracy` → `/workstreams/democracy` (preserve legacy URLs)
- SEO: Handled via Nuxt Content integration
- Archives and podcasts use same template

### Implementation

**Data Migration**:
- Convert `workstreams.json` to individual files: `content/workstreams/democracy.json`, `content/workstreams/digital-world.json`, etc.
- Each file contains workstream data (heading, description, theme, products_list, updates_list)

**Route Structure**:
- Create `pages/workstreams/[workstream].vue`
- Use `queryCollection('workstreams').where({ slug: route.params.workstream }).first()` or similar
- Handle 404 for invalid workstreams

**Redirects**:
- Add redirects in `nuxt.config.ts` or `_redirects` file:
  - `/democracy` → `/workstreams/democracy`
  - `/digital-world` → `/workstreams/digital-world`
  - `/future-leadership` → `/workstreams/future-leadership`
  - `/politics-society` → `/workstreams/politics-society`
  - `/archives` → `/workstreams/archives`
  - `/podcasts` → `/workstreams/podcasts`

**SEO**:
- Use Nuxt Content's built-in SEO handling
- Set meta tags from workstream data in the page component

**Action Items**:
- [ ] Convert `workstreams.json` to individual files in `content/workstreams/`
- [ ] Create `pages/workstreams/[workstream].vue` dynamic route
- [ ] Create `useWorkstream(slug)` composable using Nuxt Content
- [ ] Add redirects for legacy URLs
- [ ] Update Frame navigation to use new routes
- [ ] Remove old workstream page files
- [ ] Test static generation

---

## Priority 2: Updates Page Refactoring

### Current State
- Single `updates.vue` file with 4 tabs (publications, videos, infographics, podcasts)
- Each tab repeats:
  - Filter component (`LegacyMoleculesSimpleFilters`)
  - Card rendering loop
  - `formatAsCard` transformation
  - `shouldShowCard` filtering logic
- ~190 lines with significant duplication
- Podcasts tab exception: no filters

### Target State
- Reusable composable: `useUpdatesTab(contentType)`
- Reusable component: `UpdatesTabContent.vue`
- Filters optional (for podcasts exception)

### Implementation

**Composable**: `composables/useUpdatesTab.ts`
- Accepts: `contentType` ('publications' | 'videos' | 'infographics' | 'podcasts')
- Returns:
  - `cards` - formatted and filtered cards
  - `filters` - filter configuration
  - `hasFilters` - boolean (false for podcasts)
  - `handleFilterChange` - filter change handler
- Handles: data fetching, `formatAsCard` transformation, filtering logic

**Component**: `components/UpdatesTabContent.vue`
- Props: `contentType`, `cards`, `filters`, `hasFilters`
- Renders: filters (if `hasFilters`), card grid
- Handles: filter UI, card rendering

**Action Items**:
- [ ] Extract `formatAsCard` to utility function
- [ ] Create `useUpdatesTab` composable
- [ ] Create `UpdatesTabContent` component
- [ ] Refactor `updates.vue` to use new composable/component
- [ ] Handle podcasts exception (no filters)
- [ ] Test filter state persistence across tabs

---

## Priority 3: Hero Configuration Extraction

### Current State
- Hero backgrounds hardcoded in `legacy-base.vue` layout (70+ lines)
- Hero images also hardcoded in `Hero.vue` component (duplication)
- Two different data structures for same data
- Theme-based lookup: `'democracy'`, `'digital-world'`, etc.

### Target State
- Data file: `content/data/hero-config.json`
- Composable: `useHeroConfig(theme)`
- Single source of truth for hero images
- Used by both layout (preload) and component (rendering)

### Implementation

**Data File**: `content/data/hero-config.json`
```json
{
  "default": {
    "webp": "/images/hero/homepage.webp",
    "fallback": "/images/hero/homepage.jpg",
    "width": 1600,
    "height": 1067
  },
  "democracy": {
    "webp": "/images/hero/democracy@2x.webp",
    "fallback": "/images/hero/democracy@2x.jpg",
    "width": 1600,
    "height": 1600
  }
}
```

**Composable**: `composables/useHeroConfig.ts`
- Accepts: `theme` string
- Returns: hero image config object
- Handles: default fallback, invalid themes

**Usage**:
- Layout: Import composable, use for preload links
- Component: Import composable, use for image rendering

**Action Items**:
- [ ] Create `content/data/hero-config.json` with all hero configs
- [ ] Create `useHeroConfig(theme)` composable
- [ ] Update `Hero.vue` to use composable
- [ ] Update `legacy-base.vue` to use composable for preloads
- [ ] Remove duplicate hero image mappings
- [ ] Handle default/fallback themes

---

## Priority 4: Frame Navigation Data-Driven

### Current State
- `Frame.vue` has hardcoded workstream navigation links
- Links: Democracy, Politics & Society, Future Leadership, Digital World
- CSS classes generated from workstream keys

### Target State
- Navigation links generated from workstreams data
- Order and visibility controlled by data
- CSS classes generated from workstream keys

### Implementation

**Composable**: `composables/useNavigation.ts`
- Uses: `useWorkstreams()` (or Nuxt Content query)
- Filters: Only workstreams that should appear in nav
- Returns: Array of navigation items with label, route, CSS class

**Usage**:
- `Frame.vue` uses composable to generate navigation links
- Preserves CSS class generation (`frame-nav--democracy`, etc.)

**Action Items**:
- [ ] Create `useNavigation()` composable
- [ ] Extract workstream nav items from data
- [ ] Update `Frame.vue` to use composable
- [ ] Generate navigation links dynamically
- [ ] Preserve CSS class generation
- [ ] Handle navigation order/priority

---

## Priority 5: Base Layout Creation

### Current State
- `legacy-base.vue` layout used for all legacy pages
- Will eventually be replaced

### Target State
- New `base.vue` layout (eventually replaces `legacy-base`)
- All new layouts extend `base.vue`
- Workstream pages use `[workstream].vue` directly (no separate layout)

### Implementation

**New Layout**: `layouts/base.vue`
- Contains: Frame, Footer, main content slot
- Handles: Common head/meta, third-party integrations
- Extends: Can be extended by other layouts

**Migration Strategy**:
- Create `base.vue` alongside `legacy-base.vue`
- New pages use `base.vue`
- Legacy pages continue using `legacy-base.vue`
- Eventually migrate all pages to `base.vue` and remove `legacy-base.vue`

**Action Items**:
- [ ] Create `layouts/base.vue`
- [ ] Extract common logic from `legacy-base.vue`
- [ ] Update new pages to use `base.vue`
- [ ] Plan migration strategy for legacy pages

---

## Additional Opportunities

### 1. Card Logic Extraction
- Extract `truncate` function to utility (low priority - only 3 lines each)

### 2. VueUse Integration
- Replace `sessionStorage` in `useCardFilters` with `useSessionStorage`
- Keep `useTypeWriter` as-is (custom implementation is fine)

### 3. Data Composables
- Wait for Directus migration - will change data access pattern anyway

---

## Implementation Phases

### Phase 2A: Foundation (Week 1)
1. Hero configuration extraction
2. Base layout creation
3. Workstream pages → dynamic route with Nuxt Content

### Phase 2B: Duplication Elimination (Week 2)
4. Updates page refactoring
5. Frame navigation data-driven
6. Card logic extraction (utilities)

### Phase 2C: Polish (Week 3)
7. VueUse integration (where beneficial)
8. Documentation
9. Testing & validation

---

## Key Decisions

- **Workstream Routes**: Dynamic routes with redirects (preserve legacy URLs)
- **Updates Architecture**: Composable + component (filters optional)
- **Hero Config**: JSON + composable (single source of truth)
- **Navigation**: Data-driven from workstreams
- **Layout Strategy**: New base layout, eventually replaces legacy-base

---

## Success Metrics

- [ ] Reduce workstream page duplication by 75% (4 files → 1)
- [ ] Reduce updates page duplication by 60%+
- [ ] Extract all hero config to data files
- [ ] Zero hardcoded navigation links
- [ ] All new pages use Nuxt Content
- [ ] Base layout ready for future DS integration

---

## Notes

- **Design System Matching**: Deferred to future phase - current work enables that
- **External Script**: Ignoring for now - will handle in DS matching phase
- **Theme CSS System**: Waiting - may change with DS integration
- **Card Consolidation**: Deferred - too risky without script audit
- **Static Generation**: All decisions optimized for static site generation

