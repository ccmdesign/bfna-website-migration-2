# Data Model: Search Functionality

**Feature**: Search Functionality  
**Date**: 2025-01-27  
**Status**: Complete

## Entities

### SearchIndexItem

Represents a single searchable content item in the generated search index.

**Fields**:
- `brow` (string): Content category/brow text
- `theme` (string | null): Workstream theme identifier
- `excerpt` (string): Cleaned excerpt text (HTML stripped, whitespace normalized)
- `subheading` (string | null): Content subheading
- `by_line` (string | null): Author/byline text
- `heading` (string): Content heading/title
- `button_url` (string): Original URL from content item
- `button_label` (string | null): Button label text
- `text` (string): Combined searchable text (brow + heading + subheading + content + by_line, HTML stripped, lowercase, deduplicated)
- `url` (string): Normalized URL for Nuxt routing

**Validation Rules**:
- `heading` is required (non-empty string)
- `button_url` is required (non-empty string)
- `url` is required (non-empty string) - normalized from `button_url`
- `text` is required (non-empty string after processing)
- `theme` can be null/empty
- `subheading`, `by_line`, `button_label` can be null/empty

**Source**: Generated from `publications.json`, `videos.json`, `infographics.json` static data files

**Storage**: `public/search.json` (generated at build time)

### SearchResult

Represents a matching search result returned to the client.

**Fields**:
- `url` (string): Normalized URL for navigation
- `heading` (string): Content heading/title
- `subheading` (string | null): Content subheading
- `excerpt` (string | null): Content excerpt
- `theme` (string | null): Workstream theme identifier

**Validation Rules**:
- `url` is required (non-empty string)
- `heading` is required (non-empty string)
- `subheading`, `excerpt`, `theme` can be null/empty

**Source**: Filtered and transformed from `SearchIndexItem` array

**API Format**: Returned as `[{ item: SearchResult }]` to match legacy API format

### SearchQuery

Represents a user's search input.

**Fields**:
- `term` (string): Raw search query from user input

**Validation Rules**:
- Trimmed `term` must be non-empty to perform search
- Empty/whitespace-only queries return zero results without API call

**Processing**:
- Trim leading/trailing whitespace before search
- Case-insensitive matching (query converted to lowercase for comparison)

## Relationships

- **SearchIndexItem** → **SearchResult**: One-to-one transformation (filtering and field selection)
- **SearchQuery** → **SearchIndexItem[]**: One-to-many matching (substring search across `text` field)

## State Transitions

### SearchIndexItem Generation (Build Time)

```
Static JSON Files → Process Fields → Generate Searchable Text → Normalize URL → SearchIndexItem
```

**Processing Steps**:
1. Read from `publications.json`, `videos.json`, `infographics.json`
2. Extract fields: brow, theme, excerpt, subheading, by_line, heading, button_url, button_label
3. Clean excerpt (remove newlines, normalize spaces)
4. Generate searchable text: combine fields, strip HTML, lowercase, deduplicate words
5. Normalize button_url to Nuxt route format → url
6. Output to `public/search.json`

### Search Query Processing (Runtime)

```
SearchQuery → Trim Whitespace → API Call → Load SearchIndex → Filter & Match → Transform → SearchResult[]
```

**Processing Steps**:
1. User enters search term
2. Trim leading/trailing whitespace
3. If empty after trim, return empty results (no API call)
4. API loads `search.json`
5. Perform case-insensitive substring matching on `text` field
6. Filter out items with empty/null/missing `url`
7. Transform to `SearchResult` format (select fields: url, heading, subheading, excerpt, theme)
8. Return as `[{ item: SearchResult }]`

## Data Flow

### Search Index Generation (Build Time)

```
scripts/generate-search-index.ts
  ↓
Read: src/content/data/{publications,videos,infographics}.json
  ↓
Process each item:
  - Extract fields
  - Clean excerpt (clean filter)
  - Generate searchable text (squash filter equivalent)
  - Normalize URL
  ↓
Output: public/search.json
```

### Search Query Flow (Runtime)

```
User Input (Header/Footer/Menu)
  ↓
useSearch composable
  ↓
Debounce (550ms)
  ↓
API Call: GET /api/search?term={query}
  ↓
server/api/search.get.ts
  ↓
Load: public/search.json
  ↓
Match: Substring search on text field
  ↓
Filter: Remove items with empty/null URLs
  ↓
Transform: Select result fields
  ↓
Return: [{ item: { url, heading, subheading, excerpt, theme } }]
  ↓
useSearch composable
  ↓
Update: results, resultCount
  ↓
Search Page Component
  ↓
Display: Result cards
```

## Constraints

- **Search Index Size**: Assumes all results fit on single page (no pagination)
- **URL Validation**: Only filters empty/null/missing URLs; route existence validated separately
- **Performance**: Search index loaded once per API call; substring matching is O(n) where n = number of items
- **Debouncing**: 550ms delay prevents excessive API calls during typing
- **Error Handling**: Errors return empty results array; no error messages shown to users

## Notes

- Search index is generated at build time for performance
- Search index format matches legacy exactly for compatibility
- URL normalization happens during index generation (build time)
- Search matching is simple substring search (no ranking, no fuzzy matching)
- All search operations use local data sources (no external APIs)

