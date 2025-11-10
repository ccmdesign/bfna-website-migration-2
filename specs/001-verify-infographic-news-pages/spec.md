# Feature Specification: Verify Infographic & News Detail Pages

**Feature Branch**: `001-verify-infographic-news-pages`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Verify infographic detail page routes work correctly, verify news detail page routes work correctly, ensure all content fields display correctly"

## Clarifications

### Session 2025-01-27

- Q: If multiple infographics have the same URL path, what should the verification process do? → A: Report duplicate URLs as verification errors requiring data fixes
- Q: When an infographic is missing content fields, should verification flag this as an error or verify graceful rendering? → A: Strict validation happens at CMS (Directus) level; application verification focuses on route resolution and rendering with available data

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Infographic Detail Pages (Priority: P1)

Users can navigate to infographic detail pages via links from the updates page, homepage, or workstream pages and view the complete infographic content with all associated metadata.

**Why this priority**: Infographics are a core content type that users expect to access directly. Broken routes prevent users from accessing published content, impacting content discoverability and user experience.

**Independent Test**: Navigate to an infographic detail page URL (e.g., `/politics-society/strength-in-numbers-2bfro5dcbt/`) and verify the page loads correctly with all content fields displayed, including heading, subheading, byline, content, infographic image, and breadcrumbs.

**Acceptance Scenarios**:

1. **Given** an infographic exists in the data with a valid `button.url` field, **When** a user navigates to that URL, **Then** the infographic detail page loads successfully
2. **Given** an infographic detail page is loaded, **When** the page renders, **Then** all content fields (heading, subheading, byline, content, infographic image, breadcrumbs) display correctly
3. **Given** an infographic has an infographic image, **When** the page renders, **Then** the image displays with proper alt text and download link
4. **Given** a user clicks a link to an infographic from the updates page or homepage, **When** they navigate to the detail page, **Then** the route resolves correctly and the page displays

---

### User Story 2 - Access News Detail Pages (Priority: P2)

Users can navigate to news detail pages (if they exist) and view news content with all associated metadata.

**Why this priority**: News items are displayed on the homepage and updates page, but detail page functionality may not be fully implemented. This verification ensures users can access news content when linked.

**Independent Test**: Navigate to a news detail page URL (if applicable) and verify the page loads correctly with all content fields displayed, or verify that news items link correctly to their intended destinations (internal or external).

**Acceptance Scenarios**:

1. **Given** a news item exists in the data with a valid URL field, **When** a user clicks the news item link, **Then** they are directed to the correct destination (internal page or external URL)
2. **Given** news items have internal detail pages, **When** a user navigates to a news detail page URL, **Then** all content fields (heading, excerpt, image, metadata) display correctly
3. **Given** news items link to external URLs, **When** a user clicks the link, **Then** they are directed to the external site in a new tab or window

---

### Edge Cases

- What happens when an infographic URL doesn't match any existing infographic in the data?
- When an infographic is missing content fields, the page MUST render gracefully with available fields (strict field validation is handled at CMS level)
- What happens when a news item has an invalid or missing URL?
- How does the system handle infographic routes that include trailing slashes or query parameters?
- When multiple infographics have the same URL path, this indicates a CMS data quality issue (strict validation enforced at Directus level)
- How does the system handle news items that link to non-existent internal pages?

## Requirements *(mandatory)*

**Constitution Reference**: All requirements MUST comply with `.specify/memory/constitution.md`. Use the Decision Framework to determine scope (Phase 1 vs Phase 2).

**Note**: Data quality validation (duplicate URLs, required fields, format validation) is handled at the CMS (Directus) level. Application verification focuses on route resolution, page rendering, and content field display correctness.

### Functional Requirements

- **FR-001**: System MUST resolve infographic detail page routes correctly based on the `button.url` field from infographic data
- **FR-002**: System MUST display all infographic content fields on detail pages, including heading, subheading, byline, content, infographic image, and breadcrumbs (render gracefully with available fields)
- **FR-003**: System MUST handle infographic image display with proper alt text and download link functionality
- **FR-004**: System MUST return appropriate error responses (404) when an infographic route doesn't match any existing infographic
- **FR-005**: System MUST verify that news item links resolve correctly to their intended destinations (internal pages or external URLs)
- **FR-006**: System MUST display all news content fields on detail pages (if applicable), including heading, excerpt, image, and metadata
- **FR-007**: System MUST normalize route paths consistently (handling trailing slashes, leading slashes, and path variations)
- **FR-008**: System MUST verify route structure matches expected patterns for infographic and news detail pages
- **FR-009**: Application verification focuses on route resolution and rendering correctness; data quality validation (duplicate URLs, required fields) is handled at CMS (Directus) level

### Key Entities

- **Infographic**: Represents a visual content item with heading, subheading, byline, content, infographic image, breadcrumbs, and a URL path for routing
- **News Item**: Represents a news announcement with heading, excerpt, image, URL destination, and optional metadata

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of infographic detail page routes resolve correctly and display content without errors
- **SC-002**: All required content fields (heading, subheading, byline, content, image, breadcrumbs) display correctly on 100% of infographic detail pages
- **SC-003**: 100% of news item links resolve correctly to their intended destinations (internal pages or external URLs)
- **SC-004**: Route structure verification completes with zero broken routes for infographic and news detail pages
- **SC-005**: Users can successfully navigate to infographic detail pages from all entry points (updates page, homepage, workstream pages) without encountering 404 errors
