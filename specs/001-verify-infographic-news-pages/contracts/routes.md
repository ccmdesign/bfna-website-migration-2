# Route Contracts: Verify Infographic & News Detail Pages

**Feature**: Verify Infographic & News Detail Pages  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Route: Infographic Detail Page

**Path**: `/{infographic-path}` (via catch-all route `[...slug].vue`)

**Method**: GET

**Description**: Displays infographic detail page with all content fields

**Route Matching**:
- Uses catch-all route `[...slug].vue`
- Matches infographic `button.url` against normalized route path
- Returns 404 if no match found

**Request**:
- Path parameter: `slug` (array of path segments)
- Example: `/politics-society/strength-in-numbers-2bfro5dcbt/`

**Response**:
- **200 OK**: Infographic detail page rendered
- **404 Not Found**: No infographic matches route path

**Response Body** (rendered HTML):
- Breadcrumb navigation
- Infographic heading, subheading, byline
- Content HTML
- Infographic image with download link
- Proper meta tags (title, description, og:image)

**Content Fields Displayed**:
- `breadcrumbs` → Breadcrumb component
- `heading` → H1 element
- `subheading` → H2 element
- `by_line` → Paragraph element
- `content` → HTML content (v-html)
- `image` → Image with alt text
- `infographic.url` → Download link button

**Error Handling**:
- Missing infographic: 404 error page
- Missing fields: Graceful rendering (show available fields, hide missing ones)

## Route: News Item Links

**Path**: Various (external URLs or internal routes)

**Method**: GET (navigation)

**Description**: News items link to destinations (internal pages or external URLs)

**Link Resolution**:
- Internal URLs: Navigate via Nuxt router
- External URLs: Open in new tab/window (target="_blank")

**Request**:
- Click on news item card
- Navigate to `url` field value

**Response**:
- **Internal**: Rendered page (if route exists) or 404
- **External**: External website

**Validation**:
- Verify internal URLs resolve correctly
- Verify external URLs are accessible
- Verify links open in appropriate context (same tab vs new tab)

## Route Normalization

**Rules**:
1. Remove leading slash from data URLs: `url.replace(/^\//, '')`
2. Remove trailing slash from data URLs: `url.replace(/\/$/, '')`
3. Normalize route path: Ensure starts with `/`, remove trailing slash
4. Compare normalized values for matching

**Example Matching**:
```
Data URL: "/politics-society/strength-in-numbers-2bfro5dcbt/"
Normalized: "politics-society/strength-in-numbers-2bfro5dcbt"

Route Path: "/politics-society/strength-in-numbers-2bfro5dcbt"
Normalized: "politics-society/strength-in-numbers-2bfro5dcbt"

Match: normalizedDataUrl === normalizedRoutePath
```

## Implementation Notes

- Infographic routes handled in existing catch-all route `[...slug].vue`
- News items don't have detail pages - verification focuses on link resolution
- Route matching uses same pattern as publications/videos/podcasts
- Normalization ensures consistent matching regardless of trailing slashes

