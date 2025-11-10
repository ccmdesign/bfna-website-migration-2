# Directus API Integration Contracts

**Feature**: Contentful → Directus Migration  
**Date**: 2025-01-27  
**Status**: Draft

## Overview

This document defines the API contracts for Directus integration. All contracts preserve existing composable interfaces to ensure zero breaking changes.

## Directus Client Contract

### Initialization

**File**: `src/utils/directus.ts`

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export const directus = createDirectus<Schema>(
  process.env.DIRECTUS_URL || ''
)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN || ''))
```

**Environment Variables**:
- `DIRECTUS_URL` (required): Directus API endpoint (e.g., `https://api.example.com`)
- `DIRECTUS_TOKEN` (required): Static authentication token

**Error Handling**: Client initialization failures should throw errors that can be caught by composables.

## Collection Query Contract

### Standard Query Pattern

**Interface**:
```typescript
async function queryCollection<T>(
  collection: string,
  options?: {
    limit?: number
    offset?: number
    fields?: string[]
    filter?: Record<string, any>
    sort?: string[]
  }
): Promise<T[]>
```

**Implementation**:
```typescript
const items = await directus.items(collection).readByQuery({
  limit: options?.limit ?? -1, // -1 = all items
  offset: options?.offset ?? 0,
  fields: options?.fields ?? ['*'],
  filter: options?.filter,
  sort: options?.sort,
})
return items.data || []
```

**Error Handling**: Throws error on API failure - composables catch and fallback to static JSON.

### Pagination Contract

**Interface**:
```typescript
async function queryCollectionPaginated<T>(
  collection: string,
  page: number,
  pageSize: number = 100,
  options?: {
    fields?: string[]
    filter?: Record<string, any>
    sort?: string[]
  }
): Promise<{
  data: T[]
  hasMore: boolean
  total?: number
}>
```

**Implementation**:
```typescript
const offset = (page - 1) * pageSize
const items = await directus.items(collection).readByQuery({
  limit: pageSize,
  offset,
  fields: options?.fields ?? ['*'],
  filter: options?.filter,
  sort: options?.sort,
})
return {
  data: items.data || [],
  hasMore: (items.data?.length || 0) === pageSize,
  total: items.meta?.total_count,
}
```

## Singleton Query Contract

### Read Singleton

**Interface**:
```typescript
async function readSingleton<T>(
  collection: string
): Promise<T | null>
```

**Implementation**:
```typescript
const singleton = await directus.singleton(collection).read()
return singleton || null
```

**Used For**: `people_config`, `announcements`

## Error Handling Contract

### Error Types

```typescript
interface DirectusError {
  message: string
  errors?: Array<{
    message: string
    extensions?: {
      code?: string
    }
  }>
}
```

### Fallback Contract

**Interface**:
```typescript
async function fetchWithFallback<T>(
  directusQuery: () => Promise<T>,
  fallbackPath: string
): Promise<T>
```

**Implementation**:
```typescript
try {
  return await directusQuery()
} catch (error) {
  console.error(`Directus API failed for ${fallbackPath}, using fallback:`, error)
  const fallback = await import(fallbackPath).then(m => m.default)
  return fallback || ([] as T)
}
```

**Behavior**:
- Logs error to console
- Returns fallback data from static JSON
- Never throws - always returns data (empty array/object if fallback fails)

## Caching Contract

### Build-Time Cache

**Interface**: Nuxt `useAsyncData` with payload cache

```typescript
const { data } = useAsyncData(key, async () => {
  // Fetch from Directus
}, {
  getCachedData(key) {
    return nuxtApp.payload.data[key]
  }
})
```

**Behavior**:
- Cache persists in Nuxt payload between builds
- Automatically invalidated on code changes
- No TTL - uses Nuxt's built-in invalidation

### Runtime Cache

**Interface**:
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

function getCachedData<T>(
  key: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes
): T | null

function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 5 * 60 * 1000
): void
```

**Implementation**:
```typescript
const cache = useState<Record<string, CacheEntry<any>>>('directus-cache', () => ({}))

function getCachedData<T>(key: string, ttl: number): T | null {
  const entry = cache.value[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    delete cache.value[key]
    return null
  }
  return entry.data as T
}

function setCachedData<T>(key: string, data: T, ttl: number): void {
  cache.value[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  }
}
```

**Behavior**:
- Stores data in reactive state
- Checks TTL before returning cached data
- Automatically expires after TTL
- TTL: 5 minutes (configurable)

## Scroll-Based Loading Contract

### Infinite Scroll Interface

**Interface**:
```typescript
interface InfiniteScrollOptions {
  collection: string
  pageSize?: number
  threshold?: number // scroll threshold (0-1)
  fields?: string[]
  filter?: Record<string, any>
  sort?: string[]
}

interface InfiniteScrollResult<T> {
  items: Ref<T[]>
  loading: Ref<boolean>
  hasMore: Ref<boolean>
  loadMore: () => Promise<void>
  reset: () => void
}
```

**Implementation Pattern**:
```typescript
import { useIntersectionObserver } from '@vueuse/core'

export function useInfiniteScroll<T>(
  options: InfiniteScrollOptions
): InfiniteScrollResult<T> {
  const items = ref<T[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  const target = ref<HTMLElement>()

  useIntersectionObserver(
    target,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !loading.value && hasMore.value) {
        loadMore()
      }
    },
    { threshold: options.threshold ?? 0.8 }
  )

  async function loadMore() {
    if (loading.value) return
    loading.value = true
    try {
      const result = await queryCollectionPaginated<T>(
        options.collection,
        page.value,
        options.pageSize ?? 100,
        {
          fields: options.fields,
          filter: options.filter,
          sort: options.sort,
        }
      )
      items.value.push(...result.data)
      hasMore.value = result.hasMore
      page.value++
    } catch (error) {
      console.error('Failed to load more items:', error)
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  function reset() {
    items.value = []
    page.value = 1
    hasMore.value = true
    loading.value = false
  }

  // Load initial page
  loadMore()

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset,
  }
}
```

**Behavior**:
- Loads first page automatically
- Loads next page when scroll reaches threshold (80% by default)
- Prevents duplicate loads
- Handles errors gracefully
- Provides reset function

## Composable Interface Contract

### Standard Composable Pattern

**Interface**: All composables maintain existing interface

```typescript
export function useCollection<T>(): {
  data: Ref<T | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}
```

**Implementation**:
```typescript
export const useProducts = () => {
  return useAsyncData('products', async () => {
    return await fetchWithFallback(
      () => directus.items('products').readByQuery({ limit: -1 }).then(r => r.data || []),
      '~/content/data/products.json'
    )
  })
}
```

**Contract Requirements**:
- ✅ Returns same interface as current composables
- ✅ `data` is reactive ref
- ✅ `pending` indicates loading state
- ✅ `error` contains error if any
- ✅ `refresh` function available
- ✅ Data structure matches current JSON exactly

## Type Safety Contract

### Schema Interface

**File**: `src/types/directus.ts`

```typescript
export interface Schema {
  products: Product[]
  publications: Publication[]
  publication_updates: PublicationUpdate[]
  publication_homepage_updates: PublicationHomepageUpdate[]
  videos: Video[]
  video_updates: VideoUpdate[]
  video_homepage_updates: VideoHomepageUpdate[]
  infographics: Infographic[]
  infographic_homepage_updates: InfographicHomepageUpdate[]
  podcasts: Podcast[]
  podcast_homepage_updates: PodcastHomepageUpdate[]
  news: News[]
  people: Person[]
  people_config: PeopleConfig
  workstreams: Workstream[]
  announcements: Announcement
}
```

**Contract Requirements**:
- ✅ All collections defined in Schema interface
- ✅ Type definitions match Directus schema exactly
- ✅ TypeScript provides type safety for all queries
- ✅ Auto-completion works for collection names and fields

## Testing Contract

### Mock Directus Client

**Interface**: Mock client for testing

```typescript
export function createMockDirectusClient(mockData: Record<string, any[]>) {
  return {
    items: (collection: string) => ({
      readByQuery: async (options?: any) => ({
        data: mockData[collection] || [],
        meta: { total_count: mockData[collection]?.length || 0 },
      }),
    }),
    singleton: (collection: string) => ({
      read: async () => mockData[collection] || null,
    }),
  }
}
```

**Usage**: Test composables with mock data without Directus dependency.

## Summary

All contracts preserve existing composable interfaces while adding Directus integration:
- ✅ Error handling with fallback
- ✅ Caching (build-time and runtime)
- ✅ Scroll-based loading
- ✅ Type safety
- ✅ Zero breaking changes

