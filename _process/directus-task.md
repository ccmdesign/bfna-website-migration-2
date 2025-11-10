# Directus Task Notes

**Created**: 2025-01-27  
**Purpose**: Track items that will be handled via strict validation at the CMS (Directus) level rather than in application verification

## Data Quality Validation (CMS Level)

### Infographic Data Quality

- **Duplicate URL Paths**: Directus MUST enforce unique constraints on infographic `button.url` fields to prevent duplicate URL paths
- **Required Fields**: Directus MUST enforce required field validation for critical infographic fields (heading, content, image) at the CMS level
- **Field Completeness**: Directus schema MUST define which fields are required vs optional for infographics

### News Item Data Quality

- **URL Validation**: Directus MUST validate that news item URLs are properly formatted (internal or external)
- **Required Fields**: Directus MUST enforce required field validation for critical news fields (heading, excerpt, URL)

## Application Verification Scope

The application verification process focuses on:
- Route resolution correctness
- Page rendering with available data
- Content field display verification
- Link functionality

Data quality validation (duplicates, required fields, format validation) is handled at the CMS level, not in application verification.

