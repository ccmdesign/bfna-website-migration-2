# API Contracts: Phase 1 Website Platform Migration

**Date**: 2025-01-27  
**Feature**: Phase 1 Website Platform Migration  
**Plan**: [plan.md](./plan.md)

## Overview

This document defines the contracts for data access composables and component interfaces. Since Phase 1 uses static data files (no API), contracts focus on composable return types and component prop interfaces.

## Data Access Composables

### useProducts()

Returns all product content items.

**Return Type**:
```typescript
{
  data: Ref<Product[]>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}
```

**Product Interface**:
```typescript
interface Product {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  type: string
  subheading: string
  description: string
  url?: string
  embed_code?: string
  team_section?: {
    heading?: string
    subheading?: string
    team?: Array<{
      name: string
      role: string
      linkedin?: string
      twitter?: string
    }>
  }
  createdAt: string
  updatedAt: string
}
```

### usePublications()

Returns publications with items, updates, and homepage updates.

**Return Type**:
```typescript
{
  data: Ref<{
    items: Publication[]
    updates: Publication[]
    homePageUpdates: Publication[]
  }>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}
```

**Publication Interface**:
```typescript
interface Publication {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  authors: Array<{
    name: string
    role?: string
    bio?: string
  }>
  original_publication?: {
    name?: string
    url?: string
  }
  content: string
  excerpt?: string
  publication_date: string
  createdAt: string
  updatedAt: string
}
```

### useVideos()

Returns all video content items.

**Return Type**: Same structure as `useProducts()`

**Video Interface**:
```typescript
interface Video {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  video_url: string
  thumbnail_url?: string
  description: string
  duration?: string
  speakers?: Array<{
    name: string
    role?: string
  }>
  createdAt: string
  updatedAt: string
}
```

### useInfographics()

Returns all infographic content items.

**Return Type**: Same structure as `useProducts()`

**Infographic Interface**:
```typescript
interface Infographic {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  image_url: string
  description?: string
  alt_text?: string
  createdAt: string
  updatedAt: string
}
```

### usePeople()

Returns all people/team members.

**Return Type**: Same structure as `useProducts()`

**Person Interface**:
```typescript
interface Person {
  id: string
  name: string
  role: string
  bio?: string
  image_url?: string
  linkedin?: string
  twitter?: string
  email?: string
}
```

### usePodcasts()

Returns all podcast content items.

**Return Type**: Same structure as `useProducts()`

**Podcast Interface**:
```typescript
interface Podcast {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  audio_url: string
  description: string
  duration?: string
  episode_number?: number
  hosts?: Array<{
    name: string
    role?: string
  }>
  createdAt: string
  updatedAt: string
}
```

### useNews()

Returns all news content items.

**Return Type**: Same structure as `useProducts()`

**News Interface**:
```typescript
interface News {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  content: string
  excerpt?: string
  published_date: string
  source?: string
  createdAt: string
  updatedAt: string
}
```

### useAnnouncements()

Returns all announcement content items.

**Return Type**: Same structure as `useProducts()`

**Announcement Interface**:
```typescript
interface Announcement {
  id: string
  title: string
  heading: string
  theme: string
  permalink: string
  content: string
  expires_at?: string
  priority?: string
  createdAt: string
  updatedAt: string
}
```

### useWorkstreams()

Returns all workstreams.

**Return Type**: Same structure as `useProducts()`

**Workstream Interface**:
```typescript
interface Workstream {
  id: string
  name: string
  description?: string
  slug: string
}
```

## Interactive Feature Composables

### useSearch()

Provides search functionality with debouncing.

**Return Type**:
```typescript
{
  query: Ref<string>
  results: Ref<SearchResult[]>
  isSearching: Ref<boolean>
  performSearch: (query: string) => void
}
```

**SearchResult Interface**:
```typescript
interface SearchResult {
  id: string
  title: string
  type: 'product' | 'publication' | 'video' | 'infographic' | 'podcast' | 'news'
  permalink: string
  excerpt?: string
}
```

**Implementation**: Uses `useDebounce` from VueUse for debouncing (300ms per SC-006).

### useCardFilters()

Provides filtering functionality for card-based content displays.

**Return Type**:
```typescript
{
  filters: Ref<FilterState>
  filteredItems: ComputedRef<ContentItem[]>
  setFilter: (key: string, value: any) => void
  clearFilters: () => void
}
```

**FilterState Interface**:
```typescript
interface FilterState {
  theme?: string
  type?: string
  dateRange?: {
    start?: string
    end?: string
  }
  [key: string]: any
}
```

**Implementation**: Uses Vue `ref` and `computed` for reactive filtering.

### useTypeWriter()

Provides typewriter effect functionality.

**Return Type**:
```typescript
{
  displayText: Ref<string>
  isTyping: Ref<boolean>
  start: (text: string) => void
  stop: () => void
}
```

**Implementation**: Uses VueUse `useInterval` or custom implementation.

## Component Props Interfaces

### Card Component

```typescript
interface CardProps {
  heading: string
  theme?: string
  permalink: string
  excerpt?: string
  imageUrl?: string
  type?: string
  [key: string]: any // Allow additional props for flexibility
}
```

### ContentItem Component

```typescript
interface ContentItemProps {
  item: Product | Publication | Video | Infographic | Podcast | News | Announcement
  showExcerpt?: boolean
  showImage?: boolean
  [key: string]: any
}
```

### Navigation Components

```typescript
interface NavigationItem {
  label: string
  href: string
  children?: NavigationItem[]
}

interface BreadcrumbProps {
  items: Array<{
    label: string
    href: string
  }>
}
```

## Notes

- All composables use Nuxt's `useAsyncData` or `useFetch` for data fetching
- Return types follow Nuxt composable conventions
- Interfaces match extracted JSON structure exactly (no transformation)
- Props interfaces allow flexibility for component variations
- No API endpoints in Phase 1 - all data from static JSON files

