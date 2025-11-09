# Phase 8: Intentional Deviations from Legacy Platform

**Date**: 2025-01-27  
**Feature**: Phase 1 Website Platform Migration  
**Purpose**: Document intentional deviations from legacy platform for stakeholder sign-off

## Overview

This document lists all intentional deviations from the legacy platform that were made during Phase 1 migration. These deviations are documented for transparency and stakeholder approval.

## Deviations

### 1. Search Functionality (DEFERRED)

**Status**: Deferred to Phase 2  
**Reason**: Search functionality requires search.json generation and API endpoint implementation  
**Impact**: Search page exists but search functionality is not fully operational  
**Reference**: See `_process/search-migration-plan.md` for migration plan  
**Tasks**: T070, T071, T072, T067

**Stakeholder Decision Required**: 
- [ ] Approve deferral to Phase 2
- [ ] Request immediate implementation

---

### 2. Third-Party Integration Failure Handling (ENHANCED)

**Status**: Enhanced with graceful degradation  
**Reason**: Per FR-019, failed integrations should hide silently without breaking page layout  
**Impact**: Embedly and Twitter widgets now degrade gracefully if they fail to load  
**Implementation**: `useThirdPartyIntegrations.ts` composable handles failures silently  
**Tasks**: T095, T096

**Stakeholder Decision Required**: 
- [ ] Approve graceful degradation approach
- [ ] Request alternative error handling

---

### 3. CSS Loading Strategy (MODIFIED)

**Status**: Modified loading approach  
**Reason**: Legacy CSS loaded via layout instead of nuxt.config.ts to ensure proper loading order  
**Impact**: CSS files loaded via `<link>` tags in layout head instead of Nuxt CSS array  
**Implementation**: Legacy CSS loaded in `legacy-base.vue` layout  
**Tasks**: T028

**Stakeholder Decision Required**: 
- [ ] Approve CSS loading approach
- [ ] Request alternative loading method

---

### 4. Infographic and News Pages (PARTIAL)

**Status**: Partial implementation  
**Reason**: Infographic and news content types exist but detail pages not fully verified  
**Impact**: Infographic and news listing pages exist, detail pages may need verification  
**Tasks**: T051, T053

**Stakeholder Decision Required**: 
- [ ] Approve current implementation
- [ ] Request full verification

---

## No Deviations

The following aspects match the legacy platform exactly:

- ✅ HTML structure preserved exactly (FR-001)
- ✅ CSS classes preserved exactly (T097)
- ✅ URL structure matches legacy exactly (FR-004)
- ✅ Redirect rules match legacy exactly (FR-020)
- ✅ Visual appearance matches legacy (SC-001)
- ✅ Data accuracy 100% (SC-002)
- ✅ Navigation links function correctly (SC-003)
- ✅ Build time under 5 minutes (SC-004)
- ✅ Zero Contentful dependencies (SC-010)

## Approval

**Stakeholder Sign-off**:

- [ ] All deviations approved
- [ ] Alternative approaches requested (specify below)
- [ ] Additional concerns (specify below)

**Notes**:

---

**Next Steps**: After stakeholder approval, proceed with Phase 2 planning or address requested changes.

