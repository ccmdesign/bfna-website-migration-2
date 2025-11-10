# Directus Migration Summary

**Created**: 2025-01-27  
**Feature**: Contentful → Directus Migration  
**Status**: Specification Complete

## Overview

This migration replaces static JSON files with Directus API calls, enabling content management through Directus while preserving the exact data structure expected by the frontend.

## Deliverables

### 1. Specification Document
**Location**: `specs/003-directus-migration/spec.md`

Complete feature specification with:
- User scenarios and acceptance criteria
- Functional requirements
- Success criteria
- Assumptions and dependencies

### 2. Frontend Migration Guide
**Location**: `specs/003-directus-migration/frontend-changes/FRONTEND_MIGRATION.md`

Detailed documentation of:
- Current state (JSON files and composables)
- Required changes (SDK installation, composable updates)
- Data structure preservation requirements
- Migration steps and testing checklist

### 3. Directus Collection Schemas
**Location**: `specs/003-directus-migration/directus-schemas/`

JSON schemas for all collections:
- **Main collections**: products, publications, videos, infographics, podcasts, news, people, workstreams, announcements
- **Supporting collections**: junction tables for updates and homepage features
- **Configuration**: people_config (singleton)

Each schema includes:
- Collection metadata (name, icon, display template)
- Field definitions (type, interface, validation)
- Relationships (where applicable)

## Key Points for Backend Developer

### Data Structure Preservation

**CRITICAL**: The frontend expects data in the exact same structure as current JSON files. Directus collections are designed to preserve this structure, using JSON fields for complex nested objects.

### Special Structures

1. **Publications/Videos/Infographics/Podcasts**: Use junction tables (`*_updates`, `*_homepage_updates`) to manage relationships. Frontend composables will combine these into nested structures.

2. **Workstreams**: Stored as array in Directus, but frontend expects object keyed by slug. Frontend will transform.

3. **People**: Stored as individual records with `is_board_member` flag. Frontend will separate into `team_list` and `board_list` and combine with config.

### Collections Summary

| Collection | Type | Notes |
|------------|------|-------|
| products | Standard | Array of products |
| publications | Standard | Main collection |
| publication_updates | Junction | Links to publications |
| publication_homepage_updates | Junction | Links to publications |
| videos | Standard | Main collection |
| video_updates | Junction | Links to videos |
| video_homepage_updates | Junction | Links to videos |
| infographics | Standard | Main collection |
| infographic_homepage_updates | Junction | Links to infographics |
| podcasts | Standard | Main collection |
| podcast_homepage_updates | Junction | Links to podcasts |
| news | Standard | Array of news items |
| people | Standard | Individual people records |
| people_config | Singleton | Single config record |
| workstreams | Standard | Array of workstreams |
| announcements | Singleton | Single announcement record |

### Next Steps

1. **Backend Developer**:
   - Review all schema files in `directus-schemas/`
   - Create collections in Directus using schemas
   - Import sample data from current JSON files
   - Verify API responses match expected structure
   - Test API endpoints

2. **Frontend Developer**:
   - Review `FRONTEND_MIGRATION.md`
   - Install Directus SDK
   - Create Directus client utility
   - Update composables one by one
   - Test each composable independently
   - Implement error handling and caching

3. **Testing**:
   - Verify all pages render identically
   - Test error handling
   - Verify caching behavior
   - Test build-time data fetching
   - Update search index generation

## Files Structure

```
specs/003-directus-migration/
├── spec.md                                    # Main specification
├── frontend-changes/
│   └── FRONTEND_MIGRATION.md                  # Frontend migration guide
└── directus-schemas/
    ├── README.md                              # Schema documentation
    ├── products.json
    ├── publications.json
    ├── publication_updates.json
    ├── publication_homepage_updates.json
    ├── videos.json
    ├── video_updates.json
    ├── video_homepage_updates.json
    ├── infographics.json
    ├── infographic_homepage_updates.json
    ├── podcasts.json
    ├── podcast_homepage_updates.json
    ├── news.json
    ├── people.json
    ├── people_config.json
    ├── workstreams.json
    └── announcements.json
```

## Questions?

- Specification: See `spec.md`
- Frontend changes: See `frontend-changes/FRONTEND_MIGRATION.md`
- Schema details: See `directus-schemas/README.md`

