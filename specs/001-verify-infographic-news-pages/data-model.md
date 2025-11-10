# Data Model: Verify Infographic & News Detail Pages

**Feature**: Verify Infographic & News Detail Pages  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Entities

### Infographic

**Purpose**: Represents a visual content item displayed on a detail page

**Source**: `src/content/data/infographics.json`

**Structure**:
```typescript
interface Infographic {
  // Routing
  button: {
    url: string        // Route path (e.g., "/politics-society/strength-in-numbers-2bfro5dcbt/")
    label: string      // Button label (e.g., "Learn More")
  }
  
  // Content
  heading: string                    // Main title
  subheading: string                // Secondary title
  by_line: string                   // Author/publication info
  content: string                   // HTML content
  og_description: string            // Meta description
  
  // Media
  image: {
    url: string                     // Image URL
    title: string                   // Image alt text
    width: number                   // Image width
    height: number                  // Image height
  }
  infographic: {
    url: string                     // Download link for original image
    title: string                   // Image title
  }
  
  // Metadata
  brow: string                      // Category/brow text
  theme: string                     // Theme identifier
  workstream: string                // Workstream name
  breadcrumbs: {
    currentPage: string
    items: Array<{
      link: string
      title: string
    }>
  }
  
  // Authors
  authors: {
    all: string                     // Combined author string
    external: string[]
    collab: Array<{
      name: string
      role: string
      email: string
    }>
    internal: Array<{
      name: string
      email: string
      job_title: string
    }>
  }
  
  // Original publication
  original_publication: {
    publish_date: string
    url: string
  }
}
```

**Data Source**: Static JSON file at `src/content/data/infographics.json` with structure:
```json
{
  "items": [Infographic, ...]
}
```

**Validation Rules** (CMS level - Directus):
- `button.url` must be unique across all infographics
- `heading` is required
- `content` is required
- `image.url` is required

**Route Matching**: Uses `button.url` field, normalized to match route path

### News Item

**Purpose**: Represents a news announcement displayed as a card with link

**Source**: `src/content/data/news.json`

**Structure**:
```typescript
interface NewsItem {
  heading: string                   // Title
  excerpt: string                  // Description
  image: {
    url: string                    // Image URL
    title: string                  // Image alt text
  }
  url: string                      // Destination URL (internal or external)
  buttonLabel: string              // Link button text
  type: string                     // Content type identifier ("news")
}
```

**Data Source**: Static JSON file at `src/content/data/news.json` with structure:
```json
[NewsItem, ...]
```

**Validation Rules** (CMS level - Directus):
- `url` must be valid URL format
- `heading` is required
- `excerpt` is required

**Route Matching**: News items do not have detail pages - they link directly to `url` (internal or external)

## Relationships

- **Infographic → Workstream**: Many-to-one (via `workstream` field)
- **Infographic → Authors**: One-to-many (via `authors.internal`, `authors.external`, `authors.collab`)
- **News Item**: Standalone (no relationships)

## State Transitions

**Infographic**:
- Data loaded → Route matched → Page rendered
- Route not matched → 404 error

**News Item**:
- Data loaded → Link clicked → Navigate to URL (internal or external)

## Data Access Patterns

**Infographics**:
- Fetch all: `useInfographics()` composable
- Find by URL: Filter `items` array matching `button.url` against route path

**News Items**:
- Fetch all: `useNews()` composable
- Link resolution: Direct navigation to `url` field

## Normalization Rules

**URL Normalization** (for route matching):
- Remove leading slash: `url.replace(/^\//, '')`
- Remove trailing slash: `url.replace(/\/$/, '')`
- Route path normalization: Ensure starts with `/`, remove trailing slash

**Example**:
- Data: `button.url = "/politics-society/strength-in-numbers-2bfro5dcbt/"`
- Normalized: `"politics-society/strength-in-numbers-2bfro5dcbt"`
- Route: `/politics-society/strength-in-numbers-2bfro5dcbt`
- Match: `routePath.replace(/^\//, '') === normalizedUrl`

