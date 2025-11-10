# Directus Collection Schemas

**Created**: 2025-01-27  
**Purpose**: JSON schemas for configuring Directus collections to match current frontend data structure

## Overview

These schemas define the Directus collections needed to replace static JSON files. Each schema file represents a collection that should be created in Directus.

## Collection List

### Main Content Collections

- **products.json** - Product content items (reports, websites, videos)
- **publications.json** - Publication content items
- **videos.json** - Video content items
- **infographics.json** - Infographic content items
- **podcasts.json** - Podcast episodes
- **news.json** - News items
- **people.json** - Team members
- **workstreams.json** - Content workstreams/categories
- **announcements.json** - Announcement content (singleton)

### Supporting Collections

These collections manage relationships and special groupings:

- **publication_updates.json** - Links publications to updates pages
- **publication_homepage_updates.json** - Links publications to homepage
- **video_updates.json** - Links videos to updates pages
- **video_homepage_updates.json** - Links videos to homepage
- **infographic_homepage_updates.json** - Links infographics to homepage
- **podcast_homepage_updates.json** - Links podcasts to homepage
- **people_config.json** - Configuration for people page (singleton)

## How to Use

### Option 1: Direct Import (if Directus supports)

Some Directus instances support importing collection schemas directly. Check your Directus version documentation.

### Option 2: Manual Creation

1. Open Directus admin panel
2. Navigate to Settings > Data Model
3. For each schema file:
   - Click "Create Collection"
   - Use the `collection` name from the schema
   - Add fields according to the `fields` array
   - Configure field types, interfaces, and validation as specified
   - Set up relationships as defined in `relations` array

### Option 3: API Import

Use Directus API to create collections programmatically:

```bash
# Example using curl
curl -X POST https://your-directus-instance.com/collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @products.json
```

## Important Notes

### Data Structure Preservation

**CRITICAL**: These schemas are designed to preserve the exact data structure currently used by the frontend. Fields are named and typed to match the current JSON files exactly.

### JSON Fields

Many fields use `type: "json"` to store complex nested objects (e.g., `image`, `button`, `authors`, `breadcrumbs`). This preserves the current structure without requiring normalization.

### Relationships

Some collections use junction tables (e.g., `publication_updates`) to manage many-to-many relationships. The frontend expects these to be combined into nested structures:

- `publications.json` → `{ items: [...], updates: [...], homePageUpdates: [...] }`
- `videos.json` → `{ items: [...], updates: [...], homePageUpdates: [...] }`
- `infographics.json` → `{ items: [...], homePageUpdates: [...] }`
- `podcasts.json` → `{ items: [...], homePageUpdates: [...] }`

The frontend composables will handle combining these collections.

### Singleton Collections

- **announcements** - Single record (not a collection of announcements)
- **people_config** - Single configuration record

### Workstreams Structure

The `workstreams` collection stores individual workstream records. The frontend expects an object keyed by slug:

```json
{
  "politics-society": { ... },
  "democracy": { ... }
}
```

The frontend composable will transform the array response into this structure.

### People Structure

The `people` collection stores individual people records. The frontend expects:

```json
{
  "heading": "Team",
  "subheading": "...",
  "theme": "default",
  "image": { ... },
  "team_list": [ ... ],
  "board_list": [ ... ]
}
```

The frontend composable will:
1. Fetch all people records
2. Separate into `team_list` and `board_list` based on `is_board_member` field
3. Fetch `people_config` for heading, subheading, image
4. Combine into expected structure

## Field Types Reference

- **uuid** - Primary key (auto-generated)
- **string** - Text field
- **text** - Long text field (multiline)
- **integer** - Number
- **boolean** - True/false
- **timestamp** - Date/time
- **json** - JSON object/array (stores complex nested data)

## Validation

After creating collections:

1. Import sample data from current JSON files
2. Verify API responses match expected structure
3. Test frontend composables with Directus data
4. Verify all fields are accessible and correctly typed

## Migration Checklist

- [ ] All collections created in Directus
- [ ] All fields configured correctly
- [ ] Relationships set up properly
- [ ] Sample data imported
- [ ] API responses tested
- [ ] Frontend composables updated to use Directus
- [ ] Data structure verified to match current JSON
- [ ] Error handling tested
- [ ] Caching implemented

## Questions?

Refer to:
- Frontend migration guide: `../frontend-changes/FRONTEND_MIGRATION.md`
- Main spec: `../spec.md`

