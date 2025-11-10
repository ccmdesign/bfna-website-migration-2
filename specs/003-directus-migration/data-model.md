# Data Model: Directus Migration

**Date**: 2025-01-27  
**Feature**: Contentful → Directus Migration  
**Plan**: [plan.md](./plan.md)

## Overview

This document defines the data model for Directus collections. The model preserves the exact structure currently used by the frontend, ensuring zero breaking changes. All collections are configured to match the current JSON file structure.

## Data Sources

All data will be fetched from Directus API collections:

- `products` - Product content items
- `publications` - Publication content items
- `publication_updates` - Links publications to updates pages
- `publication_homepage_updates` - Links publications to homepage
- `videos` - Video content items
- `video_updates` - Links videos to updates pages
- `video_homepage_updates` - Links videos to homepage
- `infographics` - Infographic content items
- `infographic_homepage_updates` - Links infographics to homepage
- `podcasts` - Podcast episodes
- `podcast_homepage_updates` - Links podcasts to homepage
- `news` - News items
- `people` - Team members
- `people_config` - People page configuration (singleton)
- `workstreams` - Content workstreams/categories
- `announcements` - Announcement content (singleton)

## Entity Definitions

### Product

Represents product content items (reports, websites, videos).

**Directus Collection**: `products`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `title`: string (required)
- `type`: string (required) - Values: "report", "website", "video"
- `subheading`: string (optional)
- `description`: text (optional) - HTML content
- `image`: json (optional) - Object with `url` and `title`
- `hasVideo`: boolean (optional, default: false)
- `buttons`: json (optional) - Array of button objects with `type`, `url`, `label`
- `theme`: string (optional) - Values: "politics-society", "democracy", "digital-world", "future-leadership", "default"
- `permalink`: string (optional)
- `workstream`: string (optional)
- `og_description`: text (optional)
- `breadcrumbs`: json (optional) - Object with `currentPage` and `items` array
- `team_section`: json (optional) - Object with `heading`, `subheading`, `team` array
- `createdAt`: timestamp (optional)
- `updatedAt`: timestamp (optional)

**Relationships**: None

**Validation Rules**: 
- `title` is required
- `type` is required and must be one of: "report", "website", "video"
- `image` must be valid JSON object if provided

**State Transitions**: None (static content)

### Publication

Represents publication content items.

**Directus Collection**: `publications`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `brow`: string (optional)
- `theme`: string (optional)
- `heading`: string (required)
- `subheading`: string (optional)
- `excerpt`: text (optional)
- `excerpt_from_contentful`: boolean (optional, default: false)
- `by_line`: string (optional)
- `content`: text (optional) - HTML content
- `authors`: json (optional) - Object with `all`, `external`, `collab`, `internal` arrays
- `original_publication`: json (optional) - Object with `publish_date` and `url`
- `button`: json (optional) - Object with `url` and `label`
- `download_media`: string (optional)
- `workstream`: string (optional)
- `og_description`: text (optional)
- `breadcrumbs`: json (optional) - Object with `currentPage` and `items` array
- `default_published`: string (optional)
- `order_by`: string (optional)
- `createdAt`: timestamp (optional)
- `updatedAt`: timestamp (optional)

**Relationships**: 
- Many-to-many via `publication_updates` (junction table)
- Many-to-many via `publication_homepage_updates` (junction table)

**Validation Rules**:
- `heading` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects `{ items, updates, homePageUpdates }` - composable will combine collections

### Publication Updates (Junction)

Links publications to updates pages.

**Directus Collection**: `publication_updates`

**Fields**:
- `id`: uuid (primary key)
- `publication_id`: uuid (foreign key to `publications`)

**Relationships**:
- Many-to-one to `publications`

### Publication Homepage Updates (Junction)

Links publications to homepage.

**Directus Collection**: `publication_homepage_updates`

**Fields**:
- `id`: uuid (primary key)
- `publication_id`: uuid (foreign key to `publications`)

**Relationships**:
- Many-to-one to `publications`

### Video

Represents video content items.

**Directus Collection**: `videos`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `brow`: string (optional)
- `theme`: string (optional)
- `video`: json (optional) - Object with `url` and `thumbnail`
- `heading`: string (required)
- `content`: text (optional) - HTML content
- `button`: json (optional) - Object with `url` and `label`
- `by_line`: string (optional)
- `authors`: json (optional)
- `workstream`: string (optional)
- `og_description`: text (optional)
- `breadcrumbs`: json (optional)
- `default_published`: string (optional)
- `order_by`: string (optional)

**Relationships**:
- Many-to-many via `video_updates` (junction table)
- Many-to-many via `video_homepage_updates` (junction table)

**Validation Rules**:
- `heading` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects `{ items, updates, homePageUpdates }` - composable will combine collections

### Video Updates (Junction)

Links videos to updates pages.

**Directus Collection**: `video_updates`

**Fields**:
- `id`: uuid (primary key)
- `video_id`: uuid (foreign key to `videos`)

**Relationships**:
- Many-to-one to `videos`

### Video Homepage Updates (Junction)

Links videos to homepage.

**Directus Collection**: `video_homepage_updates`

**Fields**:
- `id`: uuid (primary key)
- `video_id`: uuid (foreign key to `videos`)

**Relationships**:
- Many-to-one to `videos`

### Infographic

Represents infographic content items.

**Directus Collection**: `infographics`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `brow`: string (optional)
- `theme`: string (optional)
- `image`: json (optional) - Object with `url`, `title`, `width`, `height`
- `infographic`: json (optional) - Object with `url` and `title`
- `content`: text (optional) - HTML content
- `original_publication`: json (optional)
- `by_line`: string (optional)
- `authors`: json (optional)
- `heading`: string (required)
- `subheading`: string (optional)
- `button`: json (optional)
- `workstream`: string (optional)
- `og_description`: text (optional)
- `breadcrumbs`: json (optional)

**Relationships**:
- Many-to-many via `infographic_homepage_updates` (junction table)

**Validation Rules**:
- `heading` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects `{ items, homePageUpdates }` - composable will combine collections

### Infographic Homepage Updates (Junction)

Links infographics to homepage.

**Directus Collection**: `infographic_homepage_updates`

**Fields**:
- `id`: uuid (primary key)
- `infographic_id`: uuid (foreign key to `infographics`)

**Relationships**:
- Many-to-one to `infographics`

### Podcast

Represents podcast episodes.

**Directus Collection**: `podcasts`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `brow`: string (optional)
- `theme`: string (optional)
- `type`: string (optional)
- `heading`: string (required)
- `excerpt`: text (optional)
- `image`: json (optional)
- `button`: json (optional)

**Relationships**:
- Many-to-many via `podcast_homepage_updates` (junction table)

**Validation Rules**:
- `heading` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects `{ items, homePageUpdates }` - composable will combine collections

### Podcast Homepage Updates (Junction)

Links podcasts to homepage.

**Directus Collection**: `podcast_homepage_updates`

**Fields**:
- `id`: uuid (primary key)
- `podcast_id`: uuid (foreign key to `podcasts`)

**Relationships**:
- Many-to-one to `podcasts`

### News

Represents news items.

**Directus Collection**: `news`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `heading`: string (required)
- `excerpt`: text (optional)
- `image`: json (optional) - Object with `url` and `title`
- `url`: string (optional)
- `buttonLabel`: string (optional)
- `type`: string (optional)

**Relationships**: None

**Validation Rules**:
- `heading` is required

**State Transitions**: None (static content)

### Person

Represents team members.

**Directus Collection**: `people`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `name`: string (required)
- `job_title`: string (optional)
- `job`: string (optional) - Alternative job field (legacy)
- `email`: string (optional)
- `bio`: text (optional)
- `image`: string (optional) - Image URL
- `linkedin`: string (optional)
- `twitter`: string (optional)
- `is_board_member`: boolean (optional, default: false)

**Relationships**: None

**Validation Rules**:
- `name` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects object with `team_list` and `board_list` arrays - composable will separate by `is_board_member` flag

### People Config (Singleton)

Configuration for people page.

**Directus Collection**: `people_config` (singleton)

**Fields**:
- `id`: integer (primary key, auto-increment)
- `heading`: string (optional)
- `subheading`: text (optional)
- `theme`: string (optional)
- `image`: json (optional) - Object with `url` and `title`

**Relationships**: None

**Validation Rules**: None

**State Transitions**: None (static config)

### Workstream

Represents content workstreams/categories.

**Directus Collection**: `workstreams`

**Fields**:
- `id`: uuid (primary key, auto-generated)
- `slug`: string (required, unique) - URL-safe identifier (e.g., "politics-society", "democracy")
- `heading`: string (required)
- `description`: text (optional)
- `theme`: string (optional)
- `button`: json (optional) - Object with `url` and `label`
- `image`: json (optional) - Object with `url` and `title`
- `products_list`: json (optional) - Array of product objects
- `updates_list`: json (optional) - Array of update/content objects
- `navigation_order`: integer (optional) - Order for navigation display

**Relationships**: None

**Validation Rules**:
- `slug` is required and must be unique
- `heading` is required

**State Transitions**: None (static content)

**Special Structure**: Frontend expects object keyed by slug (e.g., `{ "politics-society": {...}, "democracy": {...} }`) - composable will transform array to object

### Announcement (Singleton)

Announcement content.

**Directus Collection**: `announcements` (singleton)

**Fields**:
- `id`: integer (primary key, auto-increment)
- `workstream`: string (optional)
- `message`: json (optional) - Array of strings
- `url`: string (optional)

**Relationships**: None

**Validation Rules**: None

**State Transitions**: None (static content)

## Data Access Patterns

### Composables

Data access is provided through composables in `composables/data/`:

- `useProducts()` - Returns array of products
- `usePublications()` - Returns `{ items, updates, homePageUpdates }`
- `useVideos()` - Returns `{ items, updates, homePageUpdates }`
- `useInfographics()` - Returns `{ items, homePageUpdates }`
- `usePodcasts()` - Returns `{ items, homePageUpdates }`
- `useNews()` - Returns array of news
- `usePeople()` - Returns object with `team_list`, `board_list`, config
- `useWorkstreams()` - Returns object keyed by slug
- `useWorkstream(slug)` - Returns single workstream by slug
- `useAnnouncements()` - Returns announcement object

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
      // Fallback to static JSON
      const fallback = await import('~/content/data/products.json')
        .then(m => m.default)
      return fallback || []
    }
  })
}
```

### Data Transformation

**Publications/Videos/Infographics/Podcasts**: Composables combine main collection with junction tables:
```typescript
const [items, updates, homePageUpdates] = await Promise.all([
  directus.items('publications').readByQuery({ limit: -1 }),
  directus.items('publication_updates').readByQuery({ limit: -1 }),
  directus.items('publication_homepage_updates').readByQuery({ limit: -1 }),
])
// Transform to { items, updates, homePageUpdates }
```

**Workstreams**: Transform array to object keyed by slug:
```typescript
const workstreams = await directus.items('workstreams').readByQuery({ limit: -1 })
const result: Record<string, any> = {}
for (const ws of workstreams.data || []) {
  result[ws.slug] = ws
}
```

**People**: Separate by `is_board_member` flag and combine with config:
```typescript
const [people, config] = await Promise.all([
  directus.items('people').readByQuery({ limit: -1 }),
  directus.singleton('people_config').read(),
])
const team_list = people.data?.filter(p => !p.is_board_member) || []
const board_list = people.data?.filter(p => p.is_board_member) || []
return { ...config, team_list, board_list }
```

## Notes

- All data structure matches current JSON files exactly
- JSON fields store complex nested objects (preserves current structure)
- Required fields enforced in Directus schema
- Default values configured in Directus schema
- Frontend composables handle data transformation to match expected structure
- Static JSON files remain as fallback during migration

