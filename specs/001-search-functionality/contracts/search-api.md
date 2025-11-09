# API Contract: Search Endpoint

**Feature**: Search Functionality  
**Date**: 2025-01-27  
**Status**: Complete

## Endpoint

`GET /api/search`

## Description

Performs a search query against the generated search index and returns matching results. Matches legacy API behavior exactly.

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | Yes | Search query term. Leading/trailing whitespace is trimmed before processing. |

### Example Request

```
GET /api/search?term=democracy
```

## Response

### Success Response

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body**: Array of search result items matching legacy API format.

```json
[
  {
    "item": {
      "url": "/publications/democracy-report",
      "heading": "Democracy Report 2024",
      "subheading": "Annual assessment of democratic institutions",
      "excerpt": "This report examines the state of democracy...",
      "theme": "democracy"
    }
  },
  {
    "item": {
      "url": "/videos/democracy-discussion",
      "heading": "Democracy in the Digital Age",
      "subheading": null,
      "excerpt": null,
      "theme": "democracy"
    }
  }
]
```

### Empty Results Response

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body**: Empty array (no matches found or empty query).

```json
[]
```

### Error Response

**Status Code**: `200 OK` (errors are handled gracefully, not returned as HTTP errors)

**Content-Type**: `application/json`

**Body**: Empty array (errors logged server-side, not exposed to client).

```json
[]
```

**Note**: Errors (data unavailable, corrupted search index, etc.) are logged server-side but return empty results array to maintain consistent API contract.

## Behavior

1. **Query Processing**:
   - Trim leading/trailing whitespace from `term` parameter
   - If trimmed term is empty, return empty array immediately (no search performed)

2. **Search Execution**:
   - Load `search.json` from `public/` directory
   - Perform case-insensitive substring matching on `text` field of each item
   - Filter out items with empty, null, or missing `url` field
   - Transform to result format (select: url, heading, subheading, excerpt, theme)

3. **Error Handling**:
   - If search index file is missing or corrupted, log error and return empty array
   - If search processing fails, log error and return empty array
   - Never expose error details to client (maintains legacy behavior)

## Performance Requirements

- Response time: < 300ms per query (SC-006)
- Search index loading: Cached after first load (Nuxt server-side caching)
- Matching algorithm: O(n) where n = number of items in search index

## Legacy Compatibility

This endpoint matches the legacy external API format exactly:
- Request: `GET /api/search?term={query}`
- Response: `[{ item: { url, heading, subheading, excerpt, theme } }]`
- Behavior: Substring matching, case-insensitive, filters invalid URLs

The only difference is the endpoint location (local `/api/search` instead of external API).

## OpenAPI Schema

```yaml
openapi: 3.0.0
info:
  title: Search API
  version: 1.0.0
paths:
  /api/search:
    get:
      summary: Search content
      description: Performs a search query against the generated search index
      parameters:
        - name: term
          in: query
          required: true
          schema:
            type: string
          description: Search query term
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    item:
                      type: object
                      properties:
                        url:
                          type: string
                          description: Normalized URL for navigation
                        heading:
                          type: string
                          description: Content heading/title
                        subheading:
                          type: string
                          nullable: true
                          description: Content subheading
                        excerpt:
                          type: string
                          nullable: true
                          description: Content excerpt
                        theme:
                          type: string
                          nullable: true
                          description: Workstream theme identifier
                      required:
                        - url
                        - heading
```

