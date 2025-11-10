# Contracts: Phase 2 Migration

**Date**: 2025-01-27  
**Status**: Design Phase

## Overview

This document defines the contracts (interfaces, APIs, and component props) for Phase 2 migration. Since this is a frontend-focused migration using Nuxt Content, contracts primarily define composable interfaces, component props, and data structures rather than REST/GraphQL APIs.

## Composable Contracts

### useWorkstream(slug?: string)

Fetches workstream data using Nuxt Content query API.

**Location**: `src/composables/data/useWorkstream.ts` (new)

**Signature**:
```typescript
export function useWorkstream(slug?: string): {
  data: Ref<Workstream | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}
```

**Parameters**:
- `slug` (string, optional): Workstream slug. If omitted, returns all workstreams.

**Returns**:
- `data`: Reactive reference to workstream data (single workstream if slug provided, array if not)
- `pending`: Loading state
- `error`: Error state
- `refresh`: Function to refresh data

**Behavior**:
- Uses `queryContent()` from Nuxt Content
- For single workstream: `queryContent('workstreams').where({ slug }).findOne()`
- For all workstreams: `queryContent('workstreams').find()`
- Handles 404 errors (returns null for single workstream, empty array for all)

**Error Handling**:
- Invalid slug → returns `null` (single) or empty array (all)
- Content file missing → returns `null` (single) or excludes from array (all)

### useWorkstreamNavigation()

Generates navigation items from workstream data.

**Location**: `src/composables/data/useWorkstreamNavigation.ts` (new)

**Signature**:
```typescript
export function useWorkstreamNavigation(): {
  items: ComputedRef<NavigationItem[]>
  pending: Ref<boolean>
  error: Ref<Error | null>
}
```

**Returns**:
- `items`: Computed array of navigation items, filtered by visibility and sorted by navigation_order
- `pending`: Loading state
- `error`: Error state

**Behavior**:
- Queries all workstreams via `useWorkstream()`
- Filters where `visible !== false` (treats undefined as visible)
- Sorts by `navigation_order` (ascending), then alphabetically by `heading`
- Generates navigation items with derived fields (name, link, cssClass, order, visible)

**Navigation Item Structure**:
```typescript
interface NavigationItem {
  name: string        // workstream.heading
  link: string       // `/workstreams/${workstream.slug}`
  cssClass: string   // `frame-nav--${workstream.slug}`
  order: number      // workstream.navigation_order
  visible: boolean   // workstream.visible
}
```

### useHeroImage(theme?: string)

Gets hero image configuration for a theme, with fallback to default.

**Location**: `src/composables/data/useHeroImage.ts` (new)

**Signature**:
```typescript
export function useHeroImage(theme?: string): {
  config: ComputedRef<HeroConfig>
  pending: Ref<boolean>
  error: Ref<Error | null>
}
```

**Parameters**:
- `theme` (string, optional): Theme identifier. If omitted, returns default hero config.

**Returns**:
- `config`: Computed hero configuration (theme-specific or default)
- `pending`: Loading state
- `error`: Error state

**Behavior**:
- If theme provided: Queries workstream with matching theme, extracts `hero` field
- If workstream hero not found or theme not provided: Falls back to default hero from `content/data/hero-default.json`
- Returns hero config with webp, fallback, width, height fields

**Hero Config Structure**:
```typescript
interface HeroConfig {
  webp?: string      // WebP image path
  fallback?: string  // Fallback image path
  width: number      // Image width in pixels
  height: number     // Image height in pixels
  theme?: string     // Theme identifier
}
```

### useUpdatesFilters()

Manages filter state for updates page with sessionStorage persistence.

**Location**: `src/composables/legacy/useUpdatesFilters.ts` (new, extends useCardFilters)

**Signature**:
```typescript
export function useUpdatesFilters(): {
  activeFilters: Ref<Record<string, string[]>>
  setFilter: (contentType: string, value: string) => void
  clearFilter: (contentType: string, value: string) => void
  clearAllFilters: () => void
  shouldShowCard: (theme: string | undefined, index: number, contentType: string) => boolean
  initializeFilters: () => void
}
```

**Returns**:
- `activeFilters`: Reactive object mapping content type to array of filter values
- `setFilter`: Function to add a filter value for a content type
- `clearFilter`: Function to remove a filter value for a content type
- `clearAllFilters`: Function to reset all filters
- `shouldShowCard`: Function to determine if a card should be displayed based on filters
- `initializeFilters`: Function to load filters from sessionStorage on mount

**Behavior**:
- Persists filter state to `sessionStorage` with key `updates-filters`
- Loads filters from sessionStorage on initialization
- Resets to defaults (empty object) if sessionStorage corrupted or unavailable
- Preserves filter state when switching between content type tabs
- Filters apply to publications, videos, infographics (not podcasts)

**SessionStorage Format**:
```json
{
  "publications": ["democracy", "politics-society"],
  "videos": ["digital-world"],
  "infographics": []
}
```

## Component Contracts

### WorkstreamPage Component

Dynamic workstream page component.

**Location**: `src/pages/workstreams/[slug].vue` (new)

**Props**: None (uses route params)

**Route Params**:
- `slug` (string): Workstream slug from URL

**Behavior**:
- Fetches workstream data using `useWorkstream(slug)`
- Displays 404 page if workstream not found (`notFound()`)
- Renders hero, products list, and updates list
- Preloads hero image in `<head>` using `useHead()` with `<link rel="preload">`
- Sets page title using `useHead()`

**404 Handling**:
- Calls `notFound()` if workstream data is null
- 404 page includes site navigation and link to homepage (FR-004)

### UpdatesPageTab Component

Reusable component for updates page tab content.

**Location**: `src/components/templates/UpdatesPageTab.vue` (new)

**Props**:
```typescript
interface UpdatesPageTabProps {
  contentType: 'publications' | 'videos' | 'infographics' | 'podcasts'
  items: UpdateContent[]
  showFilters?: boolean  // Default: true for publications/videos/infographics, false for podcasts
}
```

**Behavior**:
- Renders filter component if `showFilters` is true
- Renders cards for content items
- Applies filter logic using `useUpdatesFilters()`
- Handles filter state persistence via composable

**Slots**: None

### BaseLayout Component

Reusable base layout for new pages.

**Location**: `src/layouts/base.vue` (new)

**Props**: None

**Slots**:
- `default`: Page content

**Behavior**:
- Includes Frame component (navigation)
- Includes Footer component
- Sets common head/meta elements
- Prepares for future design system integration

**Usage**:
```vue
<script setup>
definePageMeta({
  layout: 'base'
})
</script>
```

## Data Structure Contracts

### Workstream Interface

```typescript
interface Workstream {
  heading: string
  description: string
  theme: string
  slug: string
  button?: {
    url: string
    label: string
  }
  hero?: {
    webp?: string
    fallback?: string
    width: number
    height: number
    theme?: string
  }
  products_list?: Product[]
  updates_list?: UpdateContent[]
  navigation_order?: number
  visible?: boolean
}
```

### NavigationItem Interface

```typescript
interface NavigationItem {
  name: string      // workstream.heading
  link: string      // `/workstreams/${workstream.slug}`
  cssClass: string  // `frame-nav--${workstream.slug}`
  order: number     // workstream.navigation_order
  visible: boolean   // workstream.visible
}
```

### HeroConfig Interface

```typescript
interface HeroConfig {
  webp?: string
  fallback?: string
  width: number
  height: number
  theme?: string
}
```

### UpdateContent Interface

```typescript
interface UpdateContent {
  theme?: string
  heading: string
  subheading?: string
  excerpt?: string
  content?: string
  image?: {
    url: string
    title?: string
  }
  video?: object
  button?: {
    url: string
    label: string
  }
  by_line?: string
  publish_date?: string
}
```

## Route Contracts

### Workstream Route

**Pattern**: `/workstreams/[slug]`

**Dynamic Segment**: `slug` (string)

**Behavior**:
- Matches workstream slugs (e.g., `/workstreams/democracy`)
- Returns 404 if slug doesn't match any workstream content file
- Uses Nuxt Content auto-discovery for route generation

**Legacy Redirects**:
- `/{slug}` → `/workstreams/{slug}` (for existing workstream slugs)
- Implemented via server middleware or `server/routes`

### Updates Route

**Pattern**: `/updates`

**Behavior**:
- No changes to route pattern
- Internal implementation refactored to eliminate duplication

## Error Handling Contracts

### 404 Error Handling

**Contract**: Invalid workstream slugs MUST display custom 404 error page.

**Implementation**:
- Use `notFound()` helper from Nuxt
- 404 page includes site navigation and link to homepage
- 404 page displays within 1 second of page load (SC-009)

### Filter State Error Handling

**Contract**: Corrupted or inaccessible sessionStorage MUST reset filter state to defaults.

**Implementation**:
- Try-catch around sessionStorage operations
- Reset to empty object `{}` (no filters applied) on error
- Log error to console in development mode

### Hero Image Fallback

**Contract**: Missing or invalid hero images MUST fall back to default hero configuration.

**Implementation**:
- Check if workstream hero exists and is valid
- If not, use default hero from `content/data/hero-default.json`
- If default hero also missing, use placeholder or empty state

## Performance Contracts

### Hero Image Preloading

**Contract**: Critical hero images MUST be preloaded in page `<head>`.

**Implementation**:
- Use `useHead()` composable
- Add `<link rel="preload" as="image" fetchpriority="high">` for hero image
- Include both webp and fallback image paths if available

### Static Site Generation

**Contract**: All workstream routes MUST be generated statically at build time for production.

**Implementation**:
- Use Nuxt Content auto-discovery
- Nuxt generates routes from `content/workstreams/*.json` files
- Development may use hybrid approach (on-demand generation)

## Validation Contracts

All data structures MUST comply with validation rules defined in `data-model.md`:

- VAL-001: Slug URL-safe
- VAL-002: Navigation order numeric
- VAL-003: Visibility flag boolean or undefined
- VAL-004: Hero image paths valid URLs
- VAL-005: Hero image dimensions positive integers
- VAL-006: Content type filters match valid types

