# Research: Directus Migration

**Feature**: Contentful → Directus Migration  
**Date**: 2025-01-27  
**Status**: Complete

## Research Areas

### 1. Directus SDK Integration with Nuxt 3

**Decision**: Use `@directus/sdk` with TypeScript support

**Rationale**:
- Official Directus SDK provides type-safe API access
- Supports REST API (required for our use case)
- Compatible with Node.js (build-time) and browser (runtime)
- Well-maintained with active community support
- Supports static token authentication (simpler than OAuth for our use case)

**Implementation Pattern**:
```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'

interface Schema {
  products: Product[]
  publications: Publication[]
  // ... other collections
}

const client = createDirectus<Schema>(process.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN))
```

**Key Features**:
- Type-safe queries with TypeScript schema interface
- `readItems()` for collection queries with pagination support
- `readItem()` for single item queries
- Query options: `fields`, `filter`, `sort`, `limit`, `offset`
- Error handling via try/catch with error objects

**Alternatives Considered**:
- Direct REST API calls with `fetch()` - More verbose, no type safety
- GraphQL API - Overkill for our needs, adds complexity
- Nuxt Directus module (`nuxt-directus`) - Less control, may not support all features

**References**:
- Directus SDK Documentation: https://docs.directus.io/reference/sdk.html
- TypeScript SDK Examples: Context7 documentation

### 2. Caching Strategies for Build-Time vs Runtime

**Decision**: Separate caching strategies - Nuxt payload cache for build-time, in-memory cache for runtime

**Rationale**:
- Build-time: Nuxt payload cache persists across builds, reducing API calls during development
- Runtime: In-memory cache with TTL provides fast access without persistence overhead
- Different use cases require different strategies

**Build-Time Caching**:
- Use Nuxt's `useAsyncData` with `getCachedData` option
- Leverages Nuxt's built-in payload caching mechanism
- Cache persists in `.nuxt` directory between builds
- Automatically invalidated on code changes

**Runtime Caching**:
- Use `useState` or `useFetch` with `server: false` and custom TTL
- Store cache in reactive state with timestamp
- Check TTL before returning cached data
- 5-minute TTL balances freshness and performance

**Implementation Pattern**:
```typescript
// Build-time: Use Nuxt payload cache
const { data } = useAsyncData(key, async () => {
  // Fetch from Directus
}, {
  getCachedData(key) {
    return nuxtApp.payload.data[key]
  }
})

// Runtime: Custom in-memory cache
const cacheKey = `directus:${collection}:${timestamp}`
const cached = useState(cacheKey)
if (cached.value && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.value
}
```

**Alternatives Considered**:
- Single caching strategy for both - Doesn't optimize for different use cases
- External cache (Redis) - Overkill, adds infrastructure complexity
- Browser localStorage - Limited storage, not suitable for large datasets

**References**:
- Nuxt Data Fetching: https://nuxt.com/docs/api/composables/use-async-data
- Nuxt Payload: https://nuxt.com/docs/guide/concepts/rendering#payload

### 3. Error Handling with Fallback Mechanisms

**Decision**: Try-catch with fallback to static JSON imports

**Rationale**:
- Provides safety net during migration period
- Maintains application availability if Directus is down
- Simple to implement and test
- Aligns with migration strategy (keep static JSON as backup)

**Implementation Pattern**:
```typescript
export const useProducts = () => {
  return useAsyncData('products', async () => {
    try {
      const products = await directus.items('products').readByQuery({
        limit: -1,
      })
      return products.data || []
    } catch (error) {
      console.error('Directus API failed, falling back to static JSON:', error)
      // Fallback to static JSON
      const fallback = await import('~/content/data/products.json')
        .then(m => m.default)
      return fallback || []
    }
  })
}
```

**Error Types to Handle**:
- Network errors (timeout, connection refused)
- Authentication errors (invalid token)
- API errors (rate limiting, server errors)
- Data structure mismatches

**Logging Strategy**:
- Log errors to console in development
- Consider error tracking service in production (optional)
- Don't expose error details to users

**Alternatives Considered**:
- Show error UI - Poor UX, users can't access content
- Retry with exponential backoff - Adds complexity, may delay fallback
- Cache-only fallback - Requires cache to be populated first

**References**:
- Directus SDK Error Handling: SDK throws standard JavaScript errors
- Nuxt Error Handling: https://nuxt.com/docs/getting-started/error-handling

### 4. Scroll-Based Loading (Infinite Scroll)

**Decision**: Use VueUse `useIntersectionObserver` for scroll detection, load 100 items per batch

**Rationale**:
- VueUse is already in project dependencies
- `useIntersectionObserver` is standard pattern for infinite scroll
- 100 items per batch balances API calls and UX
- 80% scroll threshold provides smooth loading experience

**Implementation Pattern**:
```typescript
import { useIntersectionObserver } from '@vueuse/core'

const target = ref<HTMLElement>()
const items = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !loading.value && hasMore.value) {
      loadMore()
    }
  },
  { threshold: 0.8 }
)

async function loadMore() {
  loading.value = true
  const response = await directus.items('products').readByQuery({
    limit: 100,
    offset: (page.value - 1) * 100,
  })
  items.value.push(...response.data)
  hasMore.value = response.data.length === 100
  page.value++
  loading.value = false
}
```

**UX Considerations**:
- Show loading indicator while fetching
- Handle end of data gracefully
- Maintain scroll position during load
- Debounce intersection observer if needed

**Alternatives Considered**:
- Traditional pagination - Less smooth UX
- Load all data upfront - Poor performance for large datasets
- Virtual scrolling - Adds complexity, may not be needed

**References**:
- VueUse Intersection Observer: https://vueuse.org/core/useIntersectionObserver/
- Directus Pagination: https://docs.directus.io/reference/query.html#pagination

### 5. TypeScript Type Generation

**Decision**: Manual type definitions matching Directus schema (initially), consider auto-generation later

**Rationale**:
- Directus SDK requires TypeScript schema interface for type safety
- Manual types provide immediate type safety
- Can be generated from Directus schema later if needed
- Matches current JSON structure exactly

**Implementation Pattern**:
```typescript
// src/types/directus.ts
export interface Product {
  id: string
  title: string
  type: string
  subheading?: string
  description?: string
  image?: {
    url: string
    title?: string
  }
  // ... all fields matching Directus schema
}

export interface Schema {
  products: Product[]
  publications: Publication[]
  // ... other collections
}
```

**Future Consideration**:
- Directus schema introspection API could generate types automatically
- Tools like `directus-types` may be available
- For now, manual types ensure exact match with current JSON structure

**Alternatives Considered**:
- No types - Loses type safety benefits
- Auto-generation from start - May not match current structure exactly
- Generic types - Less type safety

**References**:
- Directus Schema Interface: SDK documentation
- TypeScript Best Practices: Type definitions for external APIs

## Summary

All research areas resolved. Key decisions:
1. ✅ Use `@directus/sdk` with TypeScript
2. ✅ Separate caching: Nuxt payload (build-time), in-memory (runtime)
3. ✅ Error handling with fallback to static JSON
4. ✅ Scroll-based loading with VueUse `useIntersectionObserver`
5. ✅ Manual TypeScript types (matching current JSON structure)

**Next Steps**: Proceed to Phase 1 design (data model, contracts, quickstart)

