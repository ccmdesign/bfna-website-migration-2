# Next Steps: Directus Migration Implementation

**Date**: 2025-01-27  
**Status**: Core Implementation Complete - Ready for Configuration & Testing  
**Branch**: `003-directus-migration`

## Overview

The core Directus migration has been completed. All 9 data composables have been migrated to fetch from Directus API instead of static JSON files, with integrated error handling, fallback mechanisms, and runtime caching.

## What's Been Completed ✅

### Phase 1: Setup
- ✅ Installed `@directus/sdk` package
- ✅ Created Directus client utility (`src/utils/directus.ts`)
- ✅ Created TypeScript types (`src/types/directus.ts`) with all collection definitions
- ✅ Added environment variable placeholders to `.env`

### Phase 2: Foundational Infrastructure
- ✅ Error handling utility with fallback to static JSON
- ✅ Runtime cache utilities (`getCachedData`, `setCachedData`) with 5-minute TTL
- ✅ Connection test function

### Phase 3: Composable Migration
All 9 composables migrated to Directus:
- ✅ `useProducts` - Simple array structure
- ✅ `useNews` - Simple array structure
- ✅ `useAnnouncements` - Singleton
- ✅ `usePublications` - Combines 3 collections (items, updates, homePageUpdates)
- ✅ `useVideos` - Combines 3 collections (items, updates, homePageUpdates)
- ✅ `useInfographics` - Combines 2 collections (items, homePageUpdates)
- ✅ `usePodcasts` - Combines 2 collections (items, homePageUpdates)
- ✅ `useWorkstreams` - Array to object transformation (keyed by slug)
- ✅ `useWorkstream` - Single workstream by slug
- ✅ `usePeople` - Combines people + config, separates by board member

### Phase 4: Runtime Caching & Error Handling
- ✅ Runtime caching integrated into all composables (5-minute TTL)
- ✅ Enhanced error logging with collection names
- ✅ Fallback behavior implemented

## What You Need to Do Next

### 1. Configure Directus Environment Variables

Add your Directus credentials to `.env` file in `bfna-website-nuxt/`:

```bash
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-static-token-here
```

**Important**: 
- Never commit `.env` with real tokens to git
- Ensure Directus instance is accessible from your development environment
- Verify the token has read permissions for all collections

### 2. Verify Directus Collections Are Configured

Ensure all Directus collections match the schemas in `specs/003-directus-migration/directus-schemas/`:

**Required Collections**:
- `products`
- `publications`, `publication_updates`, `publication_homepage_updates`
- `videos`, `video_updates`, `video_homepage_updates`
- `infographics`, `infographic_homepage_updates`
- `podcasts`, `podcast_homepage_updates`
- `news`
- `people`, `people_config` (singleton)
- `workstreams`
- `announcements` (singleton)

### 3. Import Sample Data

Import sample data into Directus for testing. You can use the existing JSON files in `src/content/data/` as reference for data structure.

### 4. Test the Migration

#### Test Single Composable First

Start by testing `useProducts`:

1. Start the dev server: `npm run dev`
2. Navigate to a page that uses products
3. Verify data displays correctly
4. Check browser console for any errors

#### Test Error Handling

1. Temporarily break Directus URL in `.env` (e.g., set to invalid URL)
2. Verify pages still load using fallback JSON
3. Check console for fallback error messages
4. Restore correct URL

#### Test All Pages

Verify these pages work correctly:
- Products page (`/products`)
- Updates page (`/updates`) - tests publications, videos, infographics, podcasts
- News sections
- Workstream pages (e.g., `/politics-society`)
- Team page (`/team`) - tests people composable
- Homepage - tests announcements and homepage updates

### 5. Verify Caching Works

1. Load a page that uses Directus data
2. Reload the same page immediately
3. Check Network tab - should see cache hits (no API calls on second load)
4. Wait 5+ minutes, reload - should see new API call

### 6. Monitor Performance

- Check API response times in Network tab
- Verify build times haven't increased significantly
- Monitor cache hit rates

## File Structure Reference

### New Files Created
```
bfna-website-nuxt/
├── src/
│   ├── utils/
│   │   └── directus.ts          # Directus client + utilities
│   └── types/
│       └── directus.ts          # TypeScript type definitions
```

### Modified Files
```
bfna-website-nuxt/src/composables/data/
├── useProducts.ts
├── useNews.ts
├── useAnnouncements.ts
├── usePublications.ts
├── useVideos.ts
├── useInfographics.ts
├── usePodcasts.ts
├── useWorkstreams.ts
├── useWorkstream.ts
└── usePeople.ts
```

## How It Works

### Error Handling & Fallback

All composables use the `fetchWithFallback` utility:
1. Try to fetch from Directus API
2. If API fails, automatically fallback to static JSON file
3. Log errors to console for debugging
4. Never throw errors - always return data (empty array/object if both fail)

### Caching Strategy

**Build-Time**: Nuxt's `useAsyncData` payload cache (automatic)
**Runtime**: In-memory cache with 5-minute TTL (implemented)

Cache keys follow pattern: `directus:{collection-name}`

### Data Structure Compatibility

All composables maintain **exact same interface** as before:
- Same return types
- Same data structure
- Zero breaking changes to components

## Troubleshooting

### Issue: Directus API returns 401 Unauthorized
**Solution**: Check `DIRECTUS_TOKEN` is set correctly and has read permissions

### Issue: Data structure doesn't match
**Solution**: Verify Directus collections match schemas exactly. Check field names and types in `src/types/directus.ts`

### Issue: Build fails with TypeScript errors
**Solution**: Ensure `src/types/directus.ts` has all collection types defined (already done)

### Issue: Pages show empty data
**Solution**: 
1. Check Directus collections have data
2. Verify environment variables are set
3. Check browser console for errors
4. Verify fallback JSON files exist in `src/content/data/`

### Issue: Caching not working
**Solution**: Verify cache key is consistent. Check TTL is set correctly (default: 5 minutes)

## Remaining Optional Tasks

### Phase 5: Scroll-Based Loading (Optional)
If you need infinite scroll for large datasets:
- T035-T039: Implement scroll-based loading for products and updates pages
- See `specs/003-directus-migration/tasks.md` for details

### Phase 6: Polish & Verification
- T040: Update search index generation script to use Directus
- T041-T049: Verification tasks (visual parity, performance testing, etc.)

These can be done after core migration is verified working.

## Documentation References

- **Specification**: `specs/003-directus-migration/spec.md`
- **Implementation Plan**: `specs/003-directus-migration/plan.md`
- **Data Model**: `specs/003-directus-migration/data-model.md`
- **API Contracts**: `specs/003-directus-migration/contracts/directus-api.md`
- **Quickstart Guide**: `specs/003-directus-migration/quickstart.md`
- **Tasks**: `specs/003-directus-migration/tasks.md`
- **Directus Schemas**: `specs/003-directus-migration/directus-schemas/`

## Support

If you encounter issues:
1. Check console errors
2. Verify Directus configuration
3. Test fallback behavior (break URL temporarily)
4. Review error logs for collection-specific issues

## Success Criteria

Migration is successful when:
- ✅ All pages render identically to static JSON version
- ✅ Directus API calls succeed
- ✅ Fallback works when API is unavailable
- ✅ Caching reduces API calls on repeated requests
- ✅ No TypeScript errors
- ✅ No console errors in production

---

**Note**: Static JSON files in `src/content/data/` are kept as fallback during migration. They can be removed later once Directus is fully verified and stable.

