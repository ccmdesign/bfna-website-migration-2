# Data Model: Phase 1 Website Platform Migration

**Date**: 2025-01-27  
**Feature**: Phase 1 Website Platform Migration  
**Plan**: [plan.md](./plan.md)

## Overview

This document defines the data model for Phase 1 migration. All data is sourced from static JSON files extracted from Contentful. The data structure matches exactly what components expect, preserving the legacy data model without optimization or refactoring (deferred to Phase 2).

## Data Sources

All data is stored as static JSON files in `src/content/data/`:

- `products.json` - Product content items
- `publications.json` - Publication content items and updates
- `videos.json` - Video content items
- `infographics.json` - Infographic content items
- `people.json` - Team/people data
- `workstreams.json` - Workstream data
- `podcasts.json` - Podcast content items
- `news.json` - News content items
- `announcements.json` - Announcement content items
- `twitter.json` - Twitter content
- `docs.json` - Documentation content

## Entity Definitions

### Content Item (Base)

Base entity representing any content type. All content items share common fields.

**Fields**:
- `id`: string - Unique identifier
- `title`: string - Content title
- `heading`: string - Display heading (normalized from Contentful)
- `theme`: string - Theme/category identifier
- `permalink`: string - URL path for content
- `createdAt`: string - ISO date string
- `updatedAt`: string - ISO date string

**Relationships**: None (base entity)

**Validation Rules**: None (Phase 1 - use data as-is)

**State Transitions**: None (static data, no state changes)

### Product

Extends Content Item. Represents product content.

**Fields** (inherits Content Item fields):
- `type`: string - Product type
- `subheading`: string - Product subheading
- `description`: string - Product description (may contain HTML)
- `url`: string | undefined - External product URL
- `embed_code`: string | undefined - Embed code for product
- `team_section`: object | undefined - Team section data
  - `heading`: string | undefined
  - `subheading`: string | undefined
  - `team`: array | undefined - Array of team member objects
    - `name`: string
    - `role`: string
    - `linkedin`: string | undefined
    - `twitter`: string | undefined

**Relationships**: 
- May reference People entities via team section

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Publication

Extends Content Item. Represents publication content.

**Fields** (inherits Content Item fields):
- `authors`: array - Array of author objects
  - `name`: string
  - `role`: string | undefined
  - `bio`: string | undefined
- `original_publication`: object | undefined
  - `name`: string | undefined
  - `url`: string | undefined
- `content`: string - Publication content (HTML from markdown)
- `excerpt`: string | undefined - Publication excerpt
- `publication_date`: string - ISO date string

**Relationships**:
- References People entities via authors array

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

**Special Structure**: `publications.json` contains:
- `items`: array - All publication items
- `updates`: array - Publication updates
- `homePageUpdates`: array - Homepage-specific updates

### Video

Extends Content Item. Represents video content.

**Fields** (inherits Content Item fields):
- `video_url`: string - Video URL (Vimeo/YouTube)
- `thumbnail_url`: string | undefined - Thumbnail image URL
- `description`: string - Video description (may contain HTML)
- `duration`: string | undefined - Video duration
- `speakers`: array | undefined - Array of speaker objects
  - `name`: string
  - `role`: string | undefined

**Relationships**: None

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Infographic

Extends Content Item. Represents infographic content.

**Fields** (inherits Content Item fields):
- `image_url`: string - Infographic image URL
- `description`: string | undefined - Infographic description
- `alt_text`: string | undefined - Alt text for image

**Relationships**: None

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Person

Represents team member/person entity.

**Fields**:
- `id`: string - Unique identifier
- `name`: string - Person's name
- `role`: string - Person's role/title
- `bio`: string | undefined - Biography text
- `image_url`: string | undefined - Profile image URL
- `linkedin`: string | undefined - LinkedIn profile URL
- `twitter`: string | undefined - Twitter handle/URL
- `email`: string | undefined - Email address

**Relationships**: 
- Referenced by Products (team_section.team)
- Referenced by Publications (authors)

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Podcast

Extends Content Item. Represents podcast content.

**Fields** (inherits Content Item fields):
- `audio_url`: string - Podcast audio file URL
- `description`: string - Podcast description (may contain HTML)
- `duration`: string | undefined - Podcast duration
- `episode_number`: number | undefined - Episode number
- `hosts`: array | undefined - Array of host objects
  - `name`: string
  - `role`: string | undefined

**Relationships**: None

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### News

Extends Content Item. Represents news content.

**Fields** (inherits Content Item fields):
- `content`: string - News content (HTML from markdown)
- `excerpt`: string | undefined - News excerpt
- `published_date`: string - ISO date string
- `source`: string | undefined - News source

**Relationships**: None

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Announcement

Extends Content Item. Represents announcement content.

**Fields** (inherits Content Item fields):
- `content`: string - Announcement content (HTML from markdown)
- `expires_at`: string | undefined - ISO date string for expiration
- `priority`: string | undefined - Announcement priority level

**Relationships**: None

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

### Workstream

Represents workstream/category entity.

**Fields**:
- `id`: string - Unique identifier
- `name`: string - Workstream name
- `description`: string | undefined - Workstream description
- `slug`: string - URL slug for workstream

**Relationships**: 
- Used to categorize/filter content items

**Validation Rules**: None (Phase 1)

**State Transitions**: None (static data)

## Data Access Patterns

### Composables

Data access is provided through composables in `composables/data/`:

- `useProducts()` - Returns all products
- `usePublications()` - Returns publications with items/updates/homePageUpdates structure
- `useVideos()` - Returns all videos
- `useInfographics()` - Returns all infographics
- `usePeople()` - Returns all people/team members
- `usePodcasts()` - Returns all podcasts
- `useNews()` - Returns all news items
- `useAnnouncements()` - Returns all announcements
- `useWorkstreams()` - Returns all workstreams

**Implementation Pattern**:
```typescript
export const useProducts = () => {
  return useAsyncData('products', () => 
    import('~/content/data/products.json').then(m => m.default)
  )
}
```

### Data Transformation

No data transformation in Phase 1 - use data exactly as extracted. All transformation deferred to Phase 2.

## Notes

- All data is static - no mutations, no state changes
- Data structure matches legacy exactly - no optimization or refactoring
- Undefined values are omitted from JSON (standard JSON behavior)
- Data extraction verified ✅ - structure matches exactly what components expect
- No validation or schema enforcement in Phase 1

