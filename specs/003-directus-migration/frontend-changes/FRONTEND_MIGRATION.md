# Frontend Changes for Directus Migration

**Created**: 2025-01-27  
**Purpose**: Document all frontend changes required to migrate from static JSON files to Directus API

## Overview

This document details what needs to change in the Nuxt frontend application to consume data from Directus instead of static JSON files. All changes preserve the existing data structure and component interfaces.

## Current State

### Data Sources

All data is currently loaded from static JSON files in `src/content/data/`:

- `products.json` - Array of product objects
- `publications.json` - Object with `{ items, updates, homePageUpdates }`
- `videos.json` - Object with `{ items, updates, homePageUpdates }`
- `infographics.json` - Object with `{ items, homePageUpdates }`
- `people.json` - Object with `{ heading, subheading, theme, image, team_list, board_list }`
- `workstreams.json` - Object keyed by slug (e.g., `{ "politics-society": {...}, "democracy": {...} }`)
- `podcasts.json` - Object with `{ items, homePageUpdates }`
- `news.json` - Array of news objects
- `announcement.json` - Object with `{ workstream, message, url }`

### Composables

All data composables are in `src/composables/data/`:

- `useProducts.ts` - Returns array of products
- `usePublications.ts` - Returns `{ items, updates, homePageUpdates }`
- `useVideos.ts` - Returns `{ items, updates, homePageUpdates }`
- `useInfographics.ts` - Returns `{ items, homePageUpdates }`
- `usePeople.ts` - Returns people object
- `useWorkstreams.ts` - Returns workstreams object
- `useWorkstream.ts` - Returns single workstream by slug
- `usePodcasts.ts` - Returns `{ items, homePageUpdates }`
- `useNews.ts` - Returns array of news
- `useAnnouncements.ts` - Returns announcement object

## Required Changes

### 1. Install Directus SDK

```bash
npm install @directus/sdk
```

### 2. Create Directus Client Utility

**File**: `src/utils/directus.ts`

Create a shared Directus client instance:

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'

interface Schema {
  // Collections will be typed here based on Directus schema
  products: Product[]
  publications: Publication[]
  // ... etc
}

export const directus = createDirectus<Schema>(process.env.DIRECTUS_URL || '')
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN || ''))
```

### 3. Environment Variables

Add to `.env`:

```
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-static-token
```

### 4. Update Data Composables

Each composable needs to be updated to fetch from Directus instead of importing JSON. The return structure must remain identical.

#### Example: `useProducts.ts`

**Before**:
```typescript
export const useProducts = () => {
  return useAsyncData('products', () => 
    import('~/content/data/products.json').then(m => m.default)
  )
}
```

**After**:
```typescript
import { directus } from '~/utils/directus'

export const useProducts = () => {
  return useAsyncData('products', async () => {
    const products = await directus.items('products').readByQuery({
      limit: -1, // Get all items
      fields: ['*'], // Get all fields
    })
    return products.data || []
  }, {
    getCachedData(key) {
      // Implement caching strategy
      return nuxtApp.payload.data[key]
    }
  })
}
```

#### Special Cases

**Publications, Videos, Infographics, Podcasts**: These have nested structures (`{ items, updates, homePageUpdates }`). Need to fetch multiple collections and combine:

```typescript
export const usePublications = () => {
  return useAsyncData('publications', async () => {
    const [items, updates, homePageUpdates] = await Promise.all([
      directus.items('publications').readByQuery({ limit: -1 }),
      directus.items('publication_updates').readByQuery({ limit: -1 }),
      directus.items('publication_homepage_updates').readByQuery({ limit: -1 }),
    ])
    
    return {
      items: items.data || [],
      updates: updates.data || [],
      homePageUpdates: homePageUpdates.data || [],
    }
  })
}
```

**Workstreams**: Object keyed by slug. Need to transform array response:

```typescript
export const useWorkstreams = () => {
  return useAsyncData('workstreams', async () => {
    const workstreams = await directus.items('workstreams').readByQuery({
      limit: -1,
    })
    
    // Transform array to object keyed by slug
    const result: Record<string, any> = {}
    for (const ws of workstreams.data || []) {
      result[ws.slug] = ws
    }
    return result
  })
}
```

**People**: Has nested structure. May need to fetch related collections:

```typescript
export const usePeople = () => {
  return useAsyncData('people', async () => {
    const people = await directus.items('people').readByQuery({
      limit: -1,
      fields: ['*'],
    })
    
    // Transform to expected structure
    return {
      heading: 'Team',
      subheading: '...',
      theme: 'default',
      image: { ... },
      team_list: people.data || [],
      board_list: [], // Fetch separately if needed
    }
  })
}
```

### 5. Error Handling

All composables should handle errors gracefully:

```typescript
export const useProducts = () => {
  return useAsyncData('products', async () => {
    try {
      const products = await directus.items('products').readByQuery({
        limit: -1,
      })
      return products.data || []
    } catch (error) {
      console.error('Failed to fetch products from Directus:', error)
      // Fallback to empty array or cached data
      return []
    }
  })
}
```

### 6. Caching Strategy

Implement caching to reduce API calls:

**Build-time caching**: Use Nuxt's payload caching:
```typescript
{
  getCachedData(key) {
    return nuxtApp.payload.data[key]
  }
}
```

**Runtime caching**: Use `useFetch` with `server: false` and appropriate TTL, or implement custom cache with `useState`:

```typescript
const cacheKey = `directus:products:${Date.now()}`
const cached = useState(cacheKey)
if (cached.value && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.value
}
```

### 7. Type Definitions

Update TypeScript types to match Directus schema. Types should be generated from Directus or manually maintained to match the API response structure.

**File**: `src/types/directus.ts`

```typescript
export interface Product {
  id: string
  title: string
  type: string
  subheading: string
  // ... all fields matching Directus schema
}
```

### 8. Search Index Generation

The search index generation script (`scripts/generate-search-index.ts`) currently reads from static JSON files. Update to fetch from Directus:

```typescript
import { directus } from '../src/utils/directus'

async function generateSearchIndex() {
  const [publications, videos, infographics] = await Promise.all([
    directus.items('publications').readByQuery({ limit: -1 }),
    directus.items('videos').readByQuery({ limit: -1 }),
    directus.items('infographics').readByQuery({ limit: -1 }),
  ])
  
  // Process data same as before
  const index = [
    ...processPublications(publications.data || []),
    ...processVideos(videos.data || []),
    ...processInfographics(infographics.data || []),
  ]
  
  // Write to public/search.json
}
```

## Data Structure Preservation

**CRITICAL**: All composables must return data in the exact same structure as the current JSON files. This ensures zero breaking changes to components.

### Structure Mapping

| JSON File | Directus Collection(s) | Transformation Required |
|-----------|----------------------|------------------------|
| `products.json` | `products` | None (array → array) |
| `publications.json` | `publications`, `publication_updates`, `publication_homepage_updates` | Combine into `{ items, updates, homePageUpdates }` |
| `videos.json` | `videos`, `video_updates`, `video_homepage_updates` | Combine into `{ items, updates, homePageUpdates }` |
| `infographics.json` | `infographics`, `infographic_homepage_updates` | Combine into `{ items, homePageUpdates }` |
| `people.json` | `people`, `people_config` | Combine into object with `team_list`, `board_list` |
| `workstreams.json` | `workstreams` | Transform array to object keyed by slug |
| `podcasts.json` | `podcasts`, `podcast_homepage_updates` | Combine into `{ items, homePageUpdates }` |
| `news.json` | `news` | None (array → array) |
| `announcement.json` | `announcements` | None (object → object) |

## Testing Checklist

- [ ] All composables fetch from Directus successfully
- [ ] Data structure matches current JSON exactly
- [ ] All pages render identically to current version
- [ ] Error handling works for API failures
- [ ] Caching reduces API calls appropriately
- [ ] Build-time data fetching works correctly
- [ ] Search index generation works with Directus data
- [ ] TypeScript types match Directus responses
- [ ] No console errors or warnings

## Migration Steps

1. **Setup**: Install Directus SDK, create client utility, add env vars
2. **Test Single Composable**: Migrate `useProducts` first, verify it works
3. **Migrate Simple Composables**: `useNews`, `useAnnouncements` (simple structures)
4. **Migrate Complex Composables**: `usePublications`, `useVideos` (nested structures)
5. **Migrate Special Cases**: `useWorkstreams` (object transformation), `usePeople` (nested)
6. **Update Search Index**: Update generation script to use Directus
7. **Testing**: Verify all pages work, test error handling, verify caching
8. **Cleanup**: Remove static JSON files (or keep as fallback during transition)

## Rollback Plan

If issues arise, can rollback by:
1. Reverting composable changes to import JSON files
2. Restoring static JSON files if removed
3. No component changes needed (composables maintain same interface)

## Notes

- Keep static JSON files during migration for fallback/testing
- Consider feature flag to toggle between Directus and static JSON during transition
- Monitor API usage and rate limits during initial deployment
- Consider implementing request batching for collections that need multiple queries

