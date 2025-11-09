# Search Functionality Migration Plan

**Status**: Deferred  
**Created**: 2025-01-27  
**Related Tasks**: T067, T070, T071, T072, T082

## Overview

The search functionality in the legacy site relies on:
1. An external search API (`https://bfna-search-api.netlify.app/search`)
2. A generated `search.json` file from Contentful data
3. Client-side JavaScript that handles search input, debouncing, and result rendering
4. Navigation from header/footer search inputs using localStorage

The current Nuxt implementation has the composable structure but is missing:
- A local search data source (search.json generation)
- A search API endpoint or static file serving
- Integration with header/footer search inputs
- Proper URL mapping for search results

## Current State

### Legacy Implementation

**Files:**
- `bfna-website-legacy/src/assets/js/search.js` - Main search logic
- `bfna-website-legacy/src/search_index.njk` - Generates search.json from Contentful
- `bfna-website-legacy/src/search.html` - Search page template
- `bfna-website-legacy/src/_includes/search.njk` - Search page content

**Key Features:**
1. **Search Data Generation**: `search_index.njk` generates `search.json` with:
   - Publications (brow, theme, excerpt, subheading, by_line, heading, button_url, text)
   - Videos (brow, theme, video thumbnail, heading, subheading, by_line, button_url, text)
   - Infographics (brow, theme, image, heading, by_line, subheading, button_url, text)
   - Searchable text field combines: brow + heading + subheading + content + by_line

2. **Search API**: External API at `https://bfna-search-api.netlify.app/search?term=${term}`
   - Returns array of `{ item: { url, heading, subheading, excerpt, theme } }`
   - Filters results to only include items with valid URLs

3. **Client-Side Behavior**:
   - Debounced search (550ms delay)
   - localStorage for passing search term from header/footer to search page
   - Hides nav search button on search page
   - Renders search cards dynamically

4. **Search Inputs**:
   - Header search (`.frame-search__field`, `.frame-search__submit`)
   - Footer search (`.footer-search__input`, `.footer-search__submit`)
   - Menu/off-canvas search (`.menu-search__input`, `.menu-search__submit`)
   - Search page input (`.search-input`)

### Nuxt Implementation (Current)

**Files:**
- `bfna-website-nuxt/src/composables/legacy/useSearch.ts` - Search composable (exists but incomplete)
- `bfna-website-nuxt/src/pages/search.vue` - Search page (exists but not working)

**Issues:**
1. `useSearch.ts` tries to use external API but it's not working
2. No `search.json` generation from static data
3. No server endpoint to serve search data
4. Header/footer search inputs not connected to search functionality
5. Search result URLs may not map correctly to Nuxt routes

## Migration Requirements

### 1. Generate Search Index from Static Data

**Task**: Create a script to generate `search.json` from static JSON files

**Source Data:**
- `src/content/data/publications.json`
- `src/content/data/videos.json`
- `src/content/data/infographics.json`

**Output Format**:
```json
{
  "search": [
    {
      "brow": "...",
      "theme": "...",
      "excerpt": "...",
      "subheading": "...",
      "by_line": "...",
      "heading": "...",
      "button_url": "...",
      "button_label": "...",
      "text": "combined searchable text",
      "url": "normalized URL"
    }
  ]
}
```

**Implementation Options:**
- **Option A**: Generate static `public/search.json` during build
- **Option B**: Create server API endpoint `/api/search.json` that generates on-demand
- **Option C**: Create server API endpoint `/api/search` that performs search server-side

**Recommendation**: Option A (static file) for performance, with Option C (server endpoint) as fallback for dynamic search

### 2. Create Search API Endpoint

**Task**: Create Nuxt server API route for search

**File**: `bfna-website-nuxt/server/api/search.ts` or `bfna-website-nuxt/server/api/search.get.ts`

**Functionality**:
- Load search.json (or generate from data files)
- Perform text search matching
- Return filtered results matching legacy API format
- Handle URL normalization for Nuxt routes

**Search Algorithm**:
- Case-insensitive text matching
- Search in combined `text` field
- Return results with `{ item: { url, heading, subheading, excerpt, theme } }` format

### 3. Update useSearch Composable

**File**: `bfna-website-nuxt/src/composables/legacy/useSearch.ts`

**Changes Needed**:
- Update `getSearchData()` to use local API endpoint instead of external API
- Ensure debouncing matches legacy (550ms, not 300ms)
- Handle URL normalization for search results
- Map button_url to correct Nuxt routes

**URL Mapping**:
- Publications: `/publications/[slug]` or catch-all route
- Videos: `/videos/[slug]` or catch-all route
- Infographics: Need to determine route structure
- Products: Catch-all route handles these

### 4. Integrate Search Inputs

**Files to Update**:
- `bfna-website-nuxt/src/components/legacy/organisms/Header.vue`
- `bfna-website-nuxt/src/components/legacy/organisms/Footer.vue`
- `bfna-website-nuxt/src/components/legacy/organisms/OffCanvas.vue`

**Functionality**:
- Connect search inputs to useSearch composable or localStorage
- Navigate to `/search` page with search term
- Handle Enter key submission
- Hide nav search button on search page

### 5. Update Search Page

**File**: `bfna-website-nuxt/src/pages/search.vue`

**Changes Needed**:
- Ensure search input is properly bound
- Hide nav search button when on search page
- Handle localStorage initialization correctly
- Ensure search cards render with correct URLs

### 6. Verify Search Result Links

**Task**: Ensure search result URLs navigate correctly

**Requirements**:
- Publications URLs map to `/publications/[slug]` or catch-all
- Videos URLs map to `/videos/[slug]` or catch-all
- Infographics URLs map correctly
- All URLs resolve without 404 errors

## Implementation Steps

### Phase 1: Data Generation
1. Create script `scripts/generate-search-index.ts`
2. Generate `public/search.json` from static data files
3. Add script to `package.json` build process

### Phase 2: Search API
1. Create server API endpoint `/api/search.get.ts`
2. Implement search logic matching legacy behavior
3. Test with sample queries

### Phase 3: Composable Updates
1. Update `useSearch.ts` to use local API
2. Fix debounce timing (550ms)
3. Add URL normalization logic

### Phase 4: Integration
1. Connect header search input
2. Connect footer search input
3. Connect menu/off-canvas search input
4. Update search page to hide nav button

### Phase 5: Testing
1. Test search from all input locations
2. Verify search results display correctly
3. Verify search result links navigate correctly
4. Verify debouncing behavior matches legacy
5. Test with various search terms

## Technical Considerations

### URL Normalization

Search results may have URLs like:
- `/politics-society/conscription-direction-transformation-6ykxrteofo/`
- `/publications/some-publication/`
- `/videos/some-video/`

These need to map to:
- Catch-all route `[...slug].vue` for legacy URLs
- Specific routes like `/publications/[slug]` for new structure

### Search Text Generation

Legacy combines: `brow + heading + subheading + content + by_line`

Need to:
- Extract content from HTML (strip tags)
- Combine fields into searchable text
- Normalize (lowercase, trim)

### Performance

- Static `search.json` is fastest but requires rebuild on data changes
- Server endpoint allows dynamic search but adds latency
- Consider caching search results

### Debounce Timing

- Legacy uses 550ms debounce
- Current composable uses 300ms
- Need to match legacy exactly for visual parity

## Dependencies

- Static JSON data files (publications.json, videos.json, infographics.json)
- Search page component (exists)
- useSearch composable (exists but needs updates)
- Header/Footer/OffCanvas components (need search integration)

## Blockers

1. **External API Dependency**: Currently relies on external API that may not be available
2. **URL Mapping**: Need to ensure all search result URLs map correctly to Nuxt routes
3. **Infographics Route**: Need to determine if infographics have detail pages or just listings

## Success Criteria

- [ ] Search.json generated from static data
- [ ] Search API endpoint returns results matching legacy format
- [ ] Search works from header input
- [ ] Search works from footer input
- [ ] Search works from menu/off-canvas input
- [ ] Search page displays results correctly
- [ ] Search result links navigate correctly
- [ ] Debouncing matches legacy (550ms)
- [ ] Search performance < 300ms per SC-006
- [ ] No external API dependencies

## Related Tasks

- T067 [US3] Verify search result links navigate to correct pages
- T070 [US4] Migrate search functionality from legacy JS to useSearch composable
- T071 [US4] Integrate useSearch composable into search page
- T072 [US4] Verify search results update appropriately with debouncing
- T082 [US4] Verify all interactive features function correctly with performance

## Notes

- Search functionality is marked as deferred because it requires:
  1. Search index generation from static data
  2. Server API endpoint creation
  3. Integration with multiple components
  4. URL mapping verification

- This is a complex feature that touches multiple parts of the application
- Consider implementing incrementally: data generation → API → composable → integration

