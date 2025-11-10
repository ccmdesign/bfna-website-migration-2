# Next Steps: Phase 1 → Phase 2 Migration

**Created**: 2025-01-27  
**Status**: Phase 1 Complete (Pending Final Testing)  
**Purpose**: Key items to be aware of before starting Phase 2

## Phase 1 Completion Status

### ✅ Completed
- All core pages migrated and rendering
- Data composables created and working
- Navigation and routing functional
- Interactive features (filtering, lazy loading, typewriter) working
- Build and deployment verified
- Visual parity verified (14/14 pages pass checks)
- Third-party integration failure handling implemented
- CSS class preservation verified
- Deviations documented
- **Search functionality fully implemented** (search index generation, API endpoint, input integration, 550ms debounce)

### ⚠️ Pending Manual Testing
- **T093**: Responsive behavior verification (mobile, tablet, desktop breakpoints)
- **T094**: Browser compatibility testing (cross-browser verification)
- **T047**: Final visual parity check (manual comparison recommended)

### 📋 Pending Stakeholder Sign-off
See `specs/001-nuxt-migration/DEVIATIONS.md` for:
- Third-party integration handling approach
- CSS loading strategy approval
- Infographic/news page partial implementation approval

## Critical Items for Phase 2

### 1. Search Functionality ✅ COMPLETE

**Status**: ✅ Completed  
**Reference**: `specs/001-search-functionality/spec.md`

**What Was Implemented**:
- ✅ Search index generation from static JSON files (`scripts/generate-search-index.ts`)
- ✅ Server API endpoint for search (`/api/search`) at `src/server/api/search.get.ts`
- ✅ Integration with header/footer/off-canvas search inputs
- ✅ Search index auto-generated during build process
- ✅ Debounce timing fixed to 550ms
- ✅ `useSearch.ts` composable updated to use local API

**Implementation Details**:
- Search index (`public/search.json`) generated from publications, videos, and infographics
- API endpoint performs case-insensitive substring matching
- Search inputs in Header, Footer, and OffCanvas components connected
- Search page displays results as cards with proper navigation
- Filter state persists via localStorage

**Next Steps**: Manual testing recommended to verify end-to-end functionality

---

### 2. Infographic & News Pages (MEDIUM PRIORITY)

**Status**: Partial implementation  
**Tasks**: T051, T053

**What's Missing**:
- Infographic detail pages not fully verified
- News detail pages not fully verified
- May need route structure verification

**Action Required**:
- Verify infographic detail page routes work correctly
- Verify news detail page routes work correctly
- Ensure all content fields display correctly

---

### 3. Content Update Process

**Current Process** (Manual):
1. Update content in Contentful (if needed)
2. Run extraction script: `cd bfna-website-legacy && node scripts/extract-contentful-data.js`
3. Copy JSON files: `cp _data/contentful-export/*.json ../bfna-website-nuxt/src/content/data/`
4. Rebuild Nuxt: `cd ../bfna-website-nuxt && npm run build`

**Considerations for Phase 2**:
- This process will change when migrating to Directus
- Consider automating content sync or CI/CD integration
- Document process for content editors

---

### 4. Phase 2 Scope (Directus Migration)

**Key Areas** (Per Constitution):

**Contentful → Directus Migration**:
- Replace static JSON files with Directus API calls
- Migrate data composables to use Directus SDK
- Update data models if needed
- Implement proper error handling and caching

**Data Layer Improvements**:
- Optimize data fetching patterns
- Implement caching strategies
- Add data validation/schema enforcement
- Refactor data transformation logic

**Design System Integration**:
- Integrate migrated components with `components/ds/` components
- Replace legacy CSS gradually with DS tokens
- CSS is currently "unplugged" - will be re-enabled/integrated in Phase 2

**Image Optimization**:
- Migrate `contentfulImage` filter if needed
- Implement advanced srcset strategies
- Custom image compression if required

---

### 5. Technical Debt & Cleanup

**Legacy CSS**:
- Currently loaded via layout (`legacy-base.vue`)
- Unplugged from `nuxt.config.ts` for Phase 2 integration
- Will be gradually replaced with DS tokens in Phase 2

**Component Organization**:
- Legacy components in `components/legacy/` follow atomic design
- Phase 2 will integrate with `components/ds/` components
- Consider component consolidation strategy

**TypeScript Types**:
- Current types match legacy data structure exactly
- May need refinement for Directus data models
- Consider generating types from Directus schema

---

### 6. Testing & Quality Assurance

**Before Phase 2**:
- Complete responsive behavior testing (T093)
- Complete browser compatibility testing (T094)
- Manual visual parity verification (T047)
- Stakeholder sign-off on deviations

**During Phase 2**:
- Test Directus integration thoroughly
- Verify data accuracy after migration
- Performance testing (build time, page load)

---

### 7. Documentation Updates Needed

**Before Phase 2**:
- Update README with content update process
- Document search functionality implementation
- Document any Phase 1 learnings/decisions

**During Phase 2**:
- Document Directus integration approach
- Update data model documentation
- Document DS component integration strategy

---

### 8. Deployment Considerations

**Current State**:
- Build completes successfully (< 5 minutes)
- Zero Contentful dependencies verified
- Can deploy independently of legacy platform

**Phase 2 Considerations**:
- Directus API endpoint configuration
- Environment variables for Directus
- Caching strategy for production
- Search index generation in build process

---

## Quick Reference

### Key Files
- **Deviations**: `specs/001-nuxt-migration/DEVIATIONS.md`
- **Search Plan**: `_process/search-migration-plan.md`
- **Tasks**: `specs/001-nuxt-migration/tasks.md`
- **Constitution**: `.specify/memory/constitution.md`

### Key Scripts
- **Visual Parity**: `bfna-website-nuxt/scripts/verify-visual-parity.ts`
- **CSS Classes**: `bfna-website-nuxt/scripts/verify-css-classes.ts`
- **Link Checker**: `bfna-website-nuxt/scripts/check-links.ts`

### Important Composables
- **Third-party Integrations**: `src/composables/legacy/useThirdPartyIntegrations.ts`
- **Search**: `src/composables/legacy/useSearch.ts` ✅ Complete
- **Data Composables**: `src/composables/data/*.ts`

---

## Immediate Next Actions

1. **Complete Manual Testing**:
   - [ ] Responsive behavior verification (T093)
   - [ ] Browser compatibility testing (T094)
   - [ ] Final visual parity check (T047)

2. **Get Stakeholder Sign-off**:
   - [ ] Review `DEVIATIONS.md` with stakeholders
   - [ ] Approve deferrals and approach changes

3. **Phase 2 Planning**:
   - [ ] Define Directus migration strategy
   - [ ] Plan DS component integration approach
   - [ ] Set up Phase 2 project structure

---

## Notes

- **Constitution Compliance**: All Phase 1 work follows constitution principles. Phase 2 will involve optimizations and improvements that were intentionally deferred.
- **Data Structure**: Current data structure matches legacy exactly. Phase 2 may require data model changes for Directus.
- **CSS Strategy**: Legacy CSS preserved but unplugged. Phase 2 will integrate/replace with DS tokens gradually.
- **Search Functionality**: ✅ Complete - Search index generation, API endpoint, and input integration all implemented. Ready for manual testing.

