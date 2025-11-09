# Quickstart: Search Functionality

**Feature**: Search Functionality  
**Date**: 2025-01-27

## Overview

Search functionality allows users to search across publications, videos, and infographics from header, footer, and mobile menu inputs. Search results are generated from a build-time index and served via a local API endpoint.

## Architecture

```
Build Time:
  Static JSON Files → Generate Search Index → public/search.json

Runtime:
  User Input → useSearch Composable → Debounce → API Call → Search Results
```

## Key Components

### 1. Search Index Generation (`scripts/generate-search-index.ts`)

Generates `public/search.json` from static data files at build time.

**Run**: Automatically during `npm run build`, or manually:
```bash
tsx scripts/generate-search-index.ts
```

**Input**: `src/content/data/{publications,videos,infographics}.json`  
**Output**: `public/search.json`

### 2. Search API Endpoint (`src/server/api/search.get.ts`)

Server API route that handles search queries.

**Endpoint**: `GET /api/search?term={query}`  
**Returns**: `[{ item: { url, heading, subheading, excerpt, theme } }]`

### 3. Search Composable (`src/composables/legacy/useSearch.ts`)

Client-side composable managing search state and debouncing.

**Usage**:
```typescript
const search = useSearch()

// Search term (reactive)
search.query.value = "democracy"

// Results (reactive)
search.results.value // SearchResult[]

// Result count (reactive)
search.resultCount.value // number

// Perform search manually
search.performSearch("query")

// Initialize from localStorage (on search page)
search.initializeFromStorage()
```

**Debounce**: 550ms delay (matches legacy)

### 4. Search Page (`src/pages/search.vue`)

Displays search results as cards.

**Features**:
- Live search updates as user types
- Pre-fills search term from localStorage
- Hides nav search button

### 5. Search Input Integration

**Header** (`src/components/legacy/organisms/Header.vue`):
- `.frame-search__field` - search input
- `.frame-search__submit` - search button
- Stores term in localStorage, navigates to `/search`

**Footer** (`src/components/legacy/organisms/Footer.vue`):
- `.footer-search__input` - search input
- `.footer-search__submit` - search button
- Stores term in localStorage, navigates to `/search`

**OffCanvas** (`src/components/legacy/organisms/OffCanvas.vue`):
- `.menu-search__input` - search input
- `.menu-search__submit` - search button
- Stores term in localStorage, navigates to `/search`, closes menu

## Development Workflow

### 1. Generate Search Index

```bash
# Generate search index from static data
tsx scripts/generate-search-index.ts

# Verify output
cat public/search.json | jq '.search | length'
```

### 2. Test Search API

```bash
# Start dev server
npm run dev

# Test search endpoint
curl "http://localhost:3000/api/search?term=democracy"
```

### 3. Test Search UI

1. Navigate to any page
2. Type search term in header/footer/menu search input
3. Submit search (Enter or click button)
4. Verify navigation to `/search` page
5. Verify results display correctly
6. Verify debouncing works (type quickly, see delay)

### 4. Update Search Index

When static data files change:
1. Update `src/content/data/{publications,videos,infographics}.json`
2. Regenerate search index: `tsx scripts/generate-search-index.ts`
3. Restart dev server (if running)
4. Test search with updated content

## Key Files

| File | Purpose |
|------|---------|
| `scripts/generate-search-index.ts` | Build-time search index generation |
| `public/search.json` | Generated search index (build output) |
| `src/server/api/search.get.ts` | Search API endpoint |
| `src/composables/legacy/useSearch.ts` | Search composable (client-side) |
| `src/pages/search.vue` | Search results page |
| `src/components/legacy/organisms/Header.vue` | Header search input |
| `src/components/legacy/organisms/Footer.vue` | Footer search input |
| `src/components/legacy/organisms/OffCanvas.vue` | Menu search input |

## Search Behavior

### Matching Algorithm

- **Type**: Case-insensitive substring matching
- **Field**: Searches in combined `text` field (brow + heading + subheading + content + by_line)
- **Example**: Query "demo" matches "demonstration", "democracy", etc.

### Query Processing

- Trims leading/trailing whitespace
- Empty queries return zero results (no API call)
- Special characters handled as-is (no escaping)

### Result Filtering

- Filters out items with empty/null/missing URLs
- Returns results in legacy format: `[{ item: { url, heading, subheading, excerpt, theme } }]`

## Performance

- **Search Index Generation**: Runs at build time (no runtime cost)
- **API Response Time**: < 300ms per query (SC-006)
- **Debounce Delay**: 550ms (matches legacy)
- **Search Index Size**: Assumes all results fit on single page (no pagination)

## Error Handling

- **Search Index Missing**: Returns empty results, logs error server-side
- **API Errors**: Returns empty results, logs error server-side
- **Invalid URLs**: Filtered out before returning results
- **User-Facing**: No error messages shown (empty results only)

## Testing Checklist

- [ ] Search index generates correctly from static data
- [ ] Search API returns results for valid queries
- [ ] Search API returns empty array for empty queries
- [ ] Search API handles errors gracefully
- [ ] Header search input navigates to search page
- [ ] Footer search input navigates to search page
- [ ] Menu search input navigates to search page and closes menu
- [ ] Search term pre-fills on search page
- [ ] Live search updates as user types (with debounce)
- [ ] Debounce timing is 550ms (not 300ms)
- [ ] Search results display correctly (heading, subheading, excerpt, theme)
- [ ] Search result links navigate correctly (no 404s)
- [ ] Empty search queries show zero results
- [ ] Whitespace-only queries treated as empty
- [ ] Nav search button hidden on search page

## Troubleshooting

### Search Index Not Generated

**Symptom**: `public/search.json` missing or empty

**Solution**: 
1. Check static data files exist: `src/content/data/{publications,videos,infographics}.json`
2. Run generation script: `tsx scripts/generate-search-index.ts`
3. Verify script is in `package.json` build process

### Search Returns No Results

**Symptom**: Valid queries return empty array

**Solution**:
1. Verify search index exists: `cat public/search.json`
2. Check search index format (should have `search` array)
3. Verify search term processing (trimming, case-insensitive)
4. Check API endpoint logs for errors

### Debounce Not Working

**Symptom**: Search fires immediately on every keystroke

**Solution**:
1. Verify `useDebounceFn` import from `@vueuse/core`
2. Check debounce delay is 550ms (not 300ms)
3. Verify `watch` on `query` uses debounced function

### Search Results Don't Navigate

**Symptom**: Clicking search result links shows 404

**Solution**:
1. Verify URL normalization in search index generation
2. Check catch-all route handles legacy URLs: `src/pages/[...slug].vue`
3. Verify URL format matches Nuxt route structure

## Next Steps

After implementing search functionality:

1. **Verify Visual Parity**: Compare search results with legacy site
2. **Performance Testing**: Verify < 300ms API response time
3. **Link Validation**: Run link checker to verify all search result URLs work
4. **Cross-Browser Testing**: Test search in Chrome, Firefox, Safari, Edge
5. **Mobile Testing**: Verify mobile menu search works correctly

## References

- **Specification**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/search-api.md](./contracts/search-api.md)
- **Legacy Implementation**: `bfna-website-legacy/src/assets/js/search.js`
- **Legacy Search Index**: `bfna-website-legacy/src/search_index.njk`

