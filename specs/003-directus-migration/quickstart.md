# Quickstart: Directus Migration

**Feature**: Contentful → Directus Migration  
**Date**: 2025-01-27  
**Status**: Implementation Guide

## Prerequisites

### Backend Setup (Required First)

1. **Directus Instance**: Must be provisioned and accessible
2. **Collections Created**: All collections must be created using schemas in `directus-schemas/`
3. **Sample Data**: Import sample data into Directus for testing
4. **API Access**: Obtain Directus URL and static token

### Frontend Setup

- Nuxt 4.2.0+ installed
- Node.js 18+ installed
- Access to repository

## Installation Steps

### 1. Install Directus SDK

```bash
cd bfna-website-nuxt
npm install @directus/sdk
```

### 2. Configure Environment Variables

Add to `.env` file (or `.env.local`):

```bash
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-static-token-here
```

**Note**: Never commit `.env` file with real tokens to git.

### 3. Create Directus Client Utility

Create `src/utils/directus.ts`:

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export const directus = createDirectus<Schema>(
  process.env.DIRECTUS_URL || ''
)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN || ''))
```

### 4. Create TypeScript Types

Create `src/types/directus.ts` with Schema interface (see `data-model.md` for field definitions).

## Migration Steps

### Step 1: Test Single Composable (Recommended)

Start with `useProducts` to verify the approach:

1. Update `src/composables/data/useProducts.ts`:

```typescript
import { directus } from '~/utils/directus'

export const useProducts = () => {
  return useAsyncData('products', async () => {
    try {
      const products = await directus.items('products').readByQuery({
        limit: -1,
      })
      return products.data || []
    } catch (error) {
      console.error('Directus API failed, falling back to static JSON:', error)
      const fallback = await import('~/content/data/products.json')
        .then(m => m.default)
      return fallback || []
    }
  })
}
```

2. Test the page that uses products
3. Verify data displays correctly
4. Test error handling (temporarily break Directus URL)

### Step 2: Migrate Simple Composables

Migrate composables with simple array structures:

- `useNews.ts` - Array of news items
- `useAnnouncements.ts` - Singleton object

**Pattern**:
```typescript
export const useNews = () => {
  return useAsyncData('news', async () => {
    try {
      const news = await directus.items('news').readByQuery({ limit: -1 })
      return news.data || []
    } catch (error) {
      console.error('Directus API failed, using fallback:', error)
      const fallback = await import('~/content/data/news.json')
        .then(m => m.default)
      return fallback || []
    }
  })
}
```

### Step 3: Migrate Complex Composables

Migrate composables with nested structures:

- `usePublications.ts` - Combines 3 collections
- `useVideos.ts` - Combines 3 collections
- `useInfographics.ts` - Combines 2 collections
- `usePodcasts.ts` - Combines 2 collections

**Pattern**:
```typescript
export const usePublications = () => {
  return useAsyncData('publications', async () => {
    try {
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
    } catch (error) {
      console.error('Directus API failed, using fallback:', error)
      const fallback = await import('~/content/data/publications.json')
        .then(m => m.default)
      return fallback || { items: [], updates: [], homePageUpdates: [] }
    }
  })
}
```

### Step 4: Migrate Special Cases

**Workstreams** (array to object transformation):

```typescript
export const useWorkstreams = () => {
  return useAsyncData('workstreams', async () => {
    try {
      const workstreams = await directus.items('workstreams').readByQuery({
        limit: -1,
      })
      
      // Transform array to object keyed by slug
      const result: Record<string, any> = {}
      for (const ws of workstreams.data || []) {
        result[ws.slug] = ws
      }
      return result
    } catch (error) {
      console.error('Directus API failed, using fallback:', error)
      const fallback = await import('~/content/data/workstreams.json')
        .then(m => m.default)
      return fallback || {}
    }
  })
}
```

**People** (combine with config, separate by board member):

```typescript
export const usePeople = () => {
  return useAsyncData('people', async () => {
    try {
      const [people, config] = await Promise.all([
        directus.items('people').readByQuery({ limit: -1 }),
        directus.singleton('people_config').read(),
      ])
      
      const team_list = people.data?.filter(p => !p.is_board_member) || []
      const board_list = people.data?.filter(p => p.is_board_member) || []
      
      return {
        ...config,
        team_list,
        board_list,
      }
    } catch (error) {
      console.error('Directus API failed, using fallback:', error)
      const fallback = await import('~/content/data/people.json')
        .then(m => m.default)
      return fallback || { team_list: [], board_list: [] }
    }
  })
}
```

### Step 5: Implement Caching

Add caching to composables (see `contracts/directus-api.md` for implementation):

- Build-time: Use Nuxt payload cache (already handled by `useAsyncData`)
- Runtime: Add custom cache with 5-minute TTL

### Step 6: Implement Scroll-Based Loading

For pages displaying large lists, implement infinite scroll (see `contracts/directus-api.md`).

### Step 7: Update Search Index Generation

Update `scripts/generate-search-index.ts` to fetch from Directus instead of static JSON.

## Testing Checklist

After each step, verify:

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Data structure matches current JSON exactly
- [ ] Error handling works (test with broken Directus URL)
- [ ] Fallback to static JSON works
- [ ] No console errors
- [ ] Build completes successfully
- [ ] TypeScript types are correct

## Rollback Procedure

If issues arise:

1. Revert composable changes to import static JSON
2. Restore static JSON files if removed
3. No component changes needed (composables maintain same interface)

**Example Rollback**:
```typescript
// Revert to static JSON import
export const useProducts = () => {
  return useAsyncData('products', () => 
    import('~/content/data/products.json').then(m => m.default)
  )
}
```

## Common Issues & Solutions

### Issue: Directus API returns 401 Unauthorized

**Solution**: Check `DIRECTUS_TOKEN` environment variable is set correctly.

### Issue: Data structure doesn't match

**Solution**: Verify Directus collections match schemas exactly. Check field names and types.

### Issue: Build fails with TypeScript errors

**Solution**: Ensure `src/types/directus.ts` has all collection types defined.

### Issue: Caching not working

**Solution**: Verify cache key is consistent. Check TTL is set correctly.

### Issue: Scroll loading not triggering

**Solution**: Verify intersection observer target element exists. Check threshold is correct.

## Next Steps

After migration is complete:

1. Monitor API response times
2. Monitor cache hit rates
3. Test content updates in Directus
4. Verify all pages work correctly
5. Remove static JSON files (optional, keep as backup initially)

## Resources

- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
- [Nuxt Data Fetching](https://nuxt.com/docs/api/composables/use-async-data)
- [VueUse Intersection Observer](https://vueuse.org/core/useIntersectionObserver/)
- [Frontend Migration Guide](./frontend-changes/FRONTEND_MIGRATION.md)
- [Directus Schemas](./directus-schemas/README.md)

