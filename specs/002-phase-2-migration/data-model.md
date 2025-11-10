# Data Model: Phase 2 Migration

**Date**: 2025-01-27  
**Status**: Design Phase

## Overview

This document defines the data model for Phase 2 migration, including entities, relationships, validation rules, and state transitions. The model supports workstream content management, hero image configuration, navigation generation, and updates page filtering.

## Entities

### Workstream

Represents a content area (Democracy, Digital World, Future Leadership, Politics & Society) with associated products, updates, and configuration.

**Location**: `src/content/workstreams/{slug}.json` (Nuxt Content format)

**Fields**:
- `heading` (string, required): Display name of the workstream (e.g., "Democracy")
- `description` (string, required): Full description text for the workstream
- `theme` (string, required): Theme identifier used for styling and hero image selection (e.g., "democracy", "politics-society", "default")
- `slug` (string, required): URL-safe identifier derived from filename (e.g., "democracy", "digital-world")
- `button` (object, optional): Call-to-action button configuration
  - `url` (string, required): Button link URL
  - `label` (string, required): Button display text
- `image` (object, optional): Legacy image configuration (deprecated, use `hero` instead)
  - `url` (string, required): Image URL
  - `title` (string, optional): Image alt text/title
- `hero` (object, optional): Hero image configuration (new field)
  - `webp` (string, optional): WebP image path
  - `fallback` (string, optional): Fallback image path (JPEG/PNG)
  - `width` (number, required): Image width in pixels (for CLS prevention)
  - `height` (number, required): Image height in pixels (for CLS prevention)
  - `theme` (string, optional): Theme identifier (defaults to workstream theme)
- `products_list` (array, optional): Array of product objects
  - See Product entity below
- `updates_list` (array, optional): Array of update/content objects
  - See Update Content entity below
- `navigation_order` (number, optional): Order for navigation display (lower numbers appear first). If omitted, workstreams sorted alphabetically by heading.
- `visible` (boolean, optional): Visibility flag for navigation. Defaults to `true` if omitted. Set to `false` to hide from navigation.

**Validation Rules**:
- Slug MUST be URL-safe (alphanumeric, hyphens, underscores only) - VAL-001
- Navigation order MUST be numeric (integer) if provided - VAL-002
- Visibility flag MUST be boolean or undefined (treated as visible if undefined) - VAL-003
- Hero image paths MUST be valid relative or absolute URLs - VAL-004
- Hero image dimensions (width, height) MUST be positive integers - VAL-005

**State Transitions**: None (static content files)

**Example**:
```json
{
  "heading": "Democracy",
  "description": "Democratic decline in the U.S. and Europe...",
  "theme": "democracy",
  "slug": "democracy",
  "button": {
    "url": "/workstreams/democracy",
    "label": "Learn More"
  },
  "hero": {
    "webp": "/images/heroes/democracy.webp",
    "fallback": "/images/heroes/democracy.jpg",
    "width": 1920,
    "height": 800,
    "theme": "democracy"
  },
  "products_list": [...],
  "updates_list": [...],
  "navigation_order": 1,
  "visible": true
}
```

### Hero Configuration

Represents image configuration for page themes. Stored within workstream content files or as default configuration.

**Location**: 
- Within workstream files: `src/content/workstreams/{slug}.json` (nested in `hero` field)
- Default configuration: `src/content/data/hero-default.json`

**Fields**:
- `webp` (string, optional): WebP image path for optimal performance
- `fallback` (string, optional): Fallback image path (JPEG/PNG) for browser compatibility
- `width` (number, required): Image width in pixels
- `height` (number, required): Image height in pixels
- `theme` (string, optional): Theme identifier for this hero configuration

**Validation Rules**:
- Image paths MUST be valid relative or absolute URLs - VAL-004
- Dimensions MUST be positive integers - VAL-005

**Default Hero Configuration** (`content/data/hero-default.json`):
```json
{
  "webp": "/images/heroes/default.webp",
  "fallback": "/images/heroes/default.jpg",
  "width": 1920,
  "height": 800,
  "theme": "default"
}
```

### Product

Represents a product/item displayed on workstream pages.

**Location**: Nested within workstream `products_list` array

**Fields**:
- `theme` (string, required): Theme identifier for styling
- `type` (string, required): Product type (e.g., "report", "website", "tool")
- `heading` (string, required): Product title
- `excerpt` (string, optional): Product description/excerpt
- `image` (object, optional): Product image
  - `url` (string, required): Image URL
  - `title` (string, optional): Image alt text
- `button` (object, optional): Call-to-action button
  - `url` (string, required): Button link URL
  - `label` (string, required): Button display text

### Update Content

Represents content items (publications, videos, infographics, podcasts) displayed on updates page and workstream pages.

**Location**: 
- Nested within workstream `updates_list` array
- Also in `src/content/data/publications.json`, `videos.json`, `infographics.json`, `podcasts.json`

**Fields**:
- `theme` (string, optional): Theme identifier for filtering (e.g., "democracy", "politics-society")
- `heading` (string, required): Content title
- `subheading` (string, optional): Content subtitle
- `excerpt` (string, optional): Content excerpt/description
- `content` (string, optional): Full content text (markdown supported)
- `image` (object, optional): Content image
  - `url` (string, required): Image URL
  - `title` (string, optional): Image alt text
- `video` (object, optional): Video configuration (for video content)
- `button` (object, optional): Call-to-action button
  - `url` (string, required): Button link URL
  - `label` (string, required): Button display text
- `by_line` (string, optional): Author/byline information
- `publish_date` (string, optional): ISO date string (e.g., "2019-06-17")

**Validation Rules**:
- Content type filters MUST match valid content types (publications, videos, infographics, podcasts) - VAL-006

### Navigation Item

Represents a workstream entry in site navigation. Derived from Workstream entity data.

**Location**: Generated dynamically from workstream data (not stored as separate entity)

**Fields** (derived):
- `name` (string): Workstream heading
- `link` (string): Route path (`/workstreams/{slug}`)
- `cssClass` (string): CSS class identifier (pattern: `frame-nav--{slug}`)
- `order` (number): Navigation order (from workstream `navigation_order` field)
- `visible` (boolean): Visibility flag (from workstream `visible` field)

**Generation Logic**:
1. Query all workstreams via Nuxt Content
2. Filter where `visible !== false` (treat undefined as visible)
3. Sort by `navigation_order` (ascending), then alphabetically by `heading` if order not specified
4. Generate navigation items with derived fields

### Filter State

Represents user filter selections on updates page. Stored in browser sessionStorage.

**Location**: Browser sessionStorage (key: `updates-filters`)

**Fields**:
- `activeFilters` (object): Map of content type to filter values
  - `publications` (array, optional): Array of selected filter values (e.g., ["democracy", "politics-society"])
  - `videos` (array, optional): Array of selected filter values
  - `infographics` (array, optional): Array of selected filter values
  - `podcasts` (array, optional): Not used (podcasts don't have filters)

**State Transitions**:
- **Initial State**: Empty object `{}` (no filters applied, show all content)
- **Filter Applied**: Add filter value to appropriate content type array
- **Filter Removed**: Remove filter value from array
- **Tab Switch**: Preserve filter state in sessionStorage
- **Corruption/Invalid**: Reset to initial state (empty object)

**Persistence**: Stored in `sessionStorage` with key `updates-filters`. Gracefully degrades if sessionStorage unavailable or corrupted.

## Entity Relationships

### Workstream → Hero Configuration
- **Type**: One-to-one
- **Description**: Each workstream contains one hero configuration (nested in `hero` field)
- **Fallback**: If workstream hero not specified, use default hero from `content/data/hero-default.json`

### Workstream → Navigation Item
- **Type**: One-to-one (derived)
- **Description**: Navigation items are derived from workstream entities (filtered and sorted for display)
- **Filtering**: Only visible workstreams (`visible !== false`) appear in navigation

### Workstream → Products
- **Type**: One-to-many
- **Description**: Each workstream contains zero or more products in `products_list` array

### Workstream → Updates
- **Type**: One-to-many
- **Description**: Each workstream contains zero or more updates in `updates_list` array

### Update Content → Theme
- **Type**: Many-to-one
- **Description**: Multiple update content items can share the same theme for filtering purposes

## Data Migration

### Migration Strategy

**Source**: `src/content/data/workstreams.json` (single JSON file with all workstreams)

**Target**: Individual Nuxt Content format files in `src/content/workstreams/{slug}.json`

**Process**:
1. Extract each workstream object from `workstreams.json`
2. Add `slug` field (derived from key name)
3. Add `navigation_order` field (if not present, assign based on current navigation order)
4. Add `visible` field (default to `true` for existing workstreams)
5. Transform `image` field to `hero` field structure (if `image` exists)
6. Save as individual JSON file: `src/content/workstreams/{slug}.json`

**Migration Script Requirements**:
- Preserve all existing workstream data fields (MIG-002)
- Generate slug from workstream key
- Assign navigation_order based on current hardcoded navigation order
- Transform image to hero structure with dimensions (requires image analysis or manual input)
- Validate all fields per validation rules

**Post-Migration**:
- Remove or deprecate `src/content/data/workstreams.json`
- Update composables to use Nuxt Content query API instead of JSON import
- Update all references to use new file structure

## Content File Format

### Nuxt Content Format

Workstream files use Nuxt Content JSON format:

```json
{
  "heading": "Democracy",
  "description": "...",
  "theme": "democracy",
  "slug": "democracy",
  "hero": {
    "webp": "/images/heroes/democracy.webp",
    "fallback": "/images/heroes/democracy.jpg",
    "width": 1920,
    "height": 800
  },
  "products_list": [...],
  "updates_list": [...],
  "navigation_order": 1,
  "visible": true
}
```

**File Naming**: `{slug}.json` where slug matches workstream slug (e.g., `democracy.json`, `digital-world.json`)

**Location**: `src/content/workstreams/` directory

## Query Patterns

### Get Single Workstream
```typescript
const workstream = await queryContent('workstreams')
  .where({ slug: 'democracy' })
  .findOne()
```

### Get All Visible Workstreams for Navigation
```typescript
const workstreams = await queryContent('workstreams')
  .where({ visible: { $ne: false } }) // visible !== false
  .sort({ navigation_order: 1, heading: 1 }) // Sort by order, then alphabetically
  .find()
```

### Get Default Hero Configuration
```typescript
const defaultHero = await import('~/content/data/hero-default.json')
```

## Validation Summary

| Rule ID | Entity | Field | Validation |
|---------|--------|-------|------------|
| VAL-001 | Workstream | slug | URL-safe (alphanumeric, hyphens, underscores only) |
| VAL-002 | Workstream | navigation_order | Numeric (integer) |
| VAL-003 | Workstream | visible | Boolean or undefined (treated as visible) |
| VAL-004 | Hero Configuration | webp, fallback | Valid relative or absolute URLs |
| VAL-005 | Hero Configuration | width, height | Positive integers |
| VAL-006 | Update Content | theme (for filters) | Valid content types (publications, videos, infographics, podcasts) |

