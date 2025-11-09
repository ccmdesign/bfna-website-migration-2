# Research: Search Functionality

**Feature**: Search Functionality  
**Date**: 2025-01-27  
**Status**: Complete

## Research Summary

This document consolidates research findings and decisions for implementing search functionality that matches legacy behavior exactly. All technical decisions are based on legacy implementation analysis and Nuxt/Vue best practices aligned with the project constitution.

## 1. Search Index Generation

**Decision**: Generate `search.json` at build time from static JSON data files, output to `public/search.json` for static serving.

**Rationale**: 
- Matches legacy approach (build-time generation)
- Best performance (static file serving)
- No runtime overhead
- Aligns with Phase 1 static data strategy

**Alternatives Considered**:
- **Server API endpoint generating on-demand**: Rejected - adds latency, unnecessary for static content
- **Dynamic search index updates**: Rejected - out of scope, requires Phase 2 CMS integration

**Implementation Approach**:
- Create `scripts/generate-search-index.ts` script
- Read from `src/content/data/publications.json`, `videos.json`, `infographics.json`
- Process each item to generate searchable text field (see Search Text Processing below)
- Output JSON matching legacy format: `{ "search": [...] }`
- Add script to `package.json` build process

**Reference**: Legacy implementation in `bfna-website-legacy/src/search_index.njk`

## 2. Search Text Processing

**Decision**: Match legacy `squash` filter behavior exactly: combine fields (brow + heading + subheading + content + by_line), strip HTML tags, convert to lowercase, deduplicate words, remove punctuation.

**Rationale**: 
- Must match legacy behavior for search result parity
- Proven approach from legacy implementation
- Ensures consistent search experience

**Implementation Details**:
1. Combine fields: `brow + " " + heading + " " + subheading + " " + content + " " + by_line`
2. Strip HTML: Remove all HTML tags using regex `/(&lt;.*?&gt;)/gi` (note: legacy uses `&lt;`/`&gt;` entities)
3. Convert to lowercase: `toLowerCase()`
4. Deduplicate words: Split by space, use Set to deduplicate, rejoin
5. Remove punctuation: Remove `.`, `,`, `?`, newlines
6. Normalize whitespace: Replace multiple spaces with single space, trim

**Reference**: Legacy `squash` filter in `bfna-website-legacy/src/_filters/squash.js`

**Note**: The `clean` filter (used for excerpt field) is simpler - just removes newlines and normalizes spaces. This is separate from search text processing.

## 3. Search API Endpoint

**Decision**: Create Nuxt server API route at `server/api/search.get.ts` that loads `search.json` and performs substring matching.

**Rationale**:
- Uses Nuxt built-in server API (constitution Principle III)
- Simple, performant approach
- Matches legacy API behavior (substring matching)
- No external dependencies

**Implementation Approach**:
- Use Nuxt Nitro server API route pattern
- Load `search.json` from `public/` directory (or generate on-demand if file missing)
- Accept `term` query parameter
- Trim whitespace from search term
- Perform case-insensitive substring matching against `text` field
- Filter out items with empty/null/missing URLs
- Return results in legacy format: `[{ item: { url, heading, subheading, excerpt, theme } }]`
- Handle errors gracefully (return empty array, log server-side)

**Reference**: Legacy API behavior from `bfna-website-legacy/src/assets/js/search.js` and external API format

## 4. Search Matching Algorithm

**Decision**: Case-insensitive substring matching - query appears anywhere in searchable text.

**Rationale**:
- Matches legacy behavior exactly
- Most permissive and user-friendly approach
- Simple to implement and maintain

**Implementation**: Use JavaScript `includes()` or `indexOf()` with lowercase comparison.

**Alternatives Considered**:
- **Whole word matching**: Rejected - too restrictive, doesn't match legacy
- **Word prefix matching**: Rejected - doesn't match legacy behavior

## 5. Debouncing

**Decision**: Use VueUse `useDebounceFn` with 550ms delay, matching legacy timing exactly.

**Rationale**:
- Constitution Principle III: Use VueUse instead of custom implementation
- Must match legacy 550ms timing for visual parity
- Current composable uses 300ms - needs update to 550ms

**Implementation**: Update `useSearch.ts` to use `useDebounceFn(performSearch, 550)` instead of 300ms.

**Reference**: Legacy debounce in `bfna-website-legacy/src/assets/js/search.js` (line 97: `debounce(doSearch, 550, event.target.value)`)

## 6. URL Normalization

**Decision**: Use `button_url` from search index items, normalize to Nuxt routes during search index generation.

**Rationale**:
- URL normalization happens at build time (simpler, faster)
- Can leverage existing URL mapping logic from catch-all route
- Matches legacy approach (URLs stored in search index)

**Implementation Approach**:
- During search index generation, normalize `button_url` to correct Nuxt route format
- Handle legacy URLs (e.g., `/politics-society/...`) via catch-all route `[...slug].vue`
- Handle new structure URLs (e.g., `/publications/[slug]`)
- Store normalized URL in search index `url` field

**Reference**: Existing catch-all route in `bfna-website-nuxt/src/pages/[...slug].vue` handles URL mapping

## 7. Component Integration

**Decision**: Update existing Header, Footer, and OffCanvas components to use `useSearch` composable and localStorage for search term passing.

**Rationale**:
- Matches legacy behavior (localStorage for search term passing)
- Uses existing composable pattern (constitution Principle II)
- Minimal changes to existing components

**Implementation Approach**:
- Header: Connect `.frame-search__field` and `.frame-search__submit` to composable
- Footer: Connect `.footer-search__input` and `.footer-search__submit` to composable
- OffCanvas: Connect `.menu-search__input` and `.menu-search__submit` to composable
- All inputs: Store search term in localStorage with key `bfna-search`, navigate to `/search`
- Search page: Read from localStorage on mount, clear after reading

**Reference**: Legacy implementation in `bfna-website-legacy/src/assets/js/search.js`

## 8. Error Handling

**Decision**: Show empty results with zero count to users, log errors server-side for debugging.

**Rationale**:
- Matches legacy behavior (no error messages shown to users)
- Provides debugging capability via server logs
- Graceful degradation maintains UX

**Implementation**: 
- API endpoint: Try/catch around search logic, return empty array on error, log error details
- Composable: Handle API errors, set results to empty array, log to console in dev mode

## 9. Input Normalization

**Decision**: Trim leading and trailing whitespace from search queries before processing.

**Rationale**:
- Common search UX pattern
- Prevents accidental whitespace from affecting results
- Matches user expectations

**Implementation**: Use JavaScript `trim()` on search term before passing to API.

## 10. Search Index Format

**Decision**: Match legacy format exactly: `{ "search": [ { brow, theme, excerpt, subheading, by_line, heading, button_url, button_label, text, url } ] }`

**Rationale**:
- Ensures compatibility with existing search API expectations
- Matches legacy structure for easier migration
- All required fields present for search and display

**Fields**:
- `brow`: Content category/brow text
- `theme`: Workstream theme
- `excerpt`: Cleaned excerpt (using `clean` filter equivalent)
- `subheading`: Content subheading
- `by_line`: Author/byline
- `heading`: Content heading
- `button_url`: Original URL from content
- `button_label`: Button label text
- `text`: Combined searchable text (processed with `squash` equivalent)
- `url`: Normalized URL for Nuxt routing

## Conclusion

All research decisions align with:
- Legacy behavior matching (visual parity requirement)
- Constitution principles (Nuxt built-ins, VueUse, composables)
- Phase 1 scope (static data, no Contentful optimization)
- Performance requirements (300ms query time, static file serving)

No unresolved technical questions remain. Implementation can proceed to Phase 1 design.

