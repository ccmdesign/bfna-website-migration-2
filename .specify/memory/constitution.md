# BFNA Website Migration Constitution

<!--
Sync Impact Report:
Version: 1.0.0 → 1.0.1 (CSS unplug strategy clarification)
Ratified: 2025-01-27
Last Amended: 2025-01-27

Changes:
- Added CSS "unplug" strategy to Phase 1 scope (keep CSS in place, disable in nuxt.config for future integration)
- Clarified Phase 2 includes DS component integration

Principles Added:
- I. "Good enough to work, ready to replace"
- II. CSS-First for Presentation, Composables for Data
- III. Leverage Nuxt Built-ins & Ecosystem

Sections Added:
- Scope Constraints
- Migration Strategy
- Decision Framework

Templates Status:
- ✅ .specify/templates/plan-template.md - updated with constitution check section
- ✅ .specify/templates/spec-template.md - updated with constitution reference
- ✅ .specify/templates/tasks-template.md - updated with constitution compliance notes
- ⚠ .specify/templates/commands/*.md - pending creation (no command templates exist yet)

Follow-up TODOs:
- Create dependent template files
- Review and align with existing project documentation
-->

## Core Principles

### I. "Good enough to work, ready to replace"

The goal is to get components working in Vue with minimal data layer changes, knowing that the entire data layer will be replaced with Directus soon. Don't polish what will be thrown away.

**Rationale**: Phase 1 focuses on component migration. The data layer is temporary and will be completely replaced in Phase 2. Investing time in optimizing or refactoring temporary infrastructure wastes effort and delays delivery.

**Enforcement**: Any proposed optimization or refactor to data fetching, Contentful integration, or data models MUST be deferred to Phase 2 unless it blocks component migration.

### II. CSS-First for Presentation, Composables for Data

Markup and CSS handle presentation and simple rendering logic. Computed functions, composables, and modules handle data transformation.

**Presentation Layer** (Markup + CSS):
- Use CSS for all responsive behavior, layout, styling, and visual states
- Keep template markup simple - let CSS handle presentation logic
- Preserve existing CSS classes and media queries from legacy code
- Avoid JavaScript-based responsive solutions when CSS can handle it

**Data Layer** (Composables + Computed):
- Use composables and computed properties for data massaging and transformation
- Alleviate template complexity by preprocessing data in composables
- Use Nuxt built-ins (`useAsyncData`, `useFetch`, `useState`) for data fetching/state
- Use VueUse utilities for data-related operations (debouncing, throttling, etc.)

**Rationale**: Clear separation of concerns improves maintainability and performance. CSS handles presentation efficiently at the browser level, while JavaScript handles data operations that require reactivity or computation.

**Examples**:
- ✅ Responsive layout → CSS media queries (not JavaScript)
- ✅ Conditional styling → CSS classes + Vue `:class` binding
- ✅ Data filtering/sorting → Computed properties or composables
- ✅ Search debouncing → `useDebounce()` from VueUse (data operation)
- ✅ Lazy loading → `useIntersectionObserver()` from VueUse (data loading, not presentation)

### III. Leverage Nuxt Built-ins & Ecosystem

Prefer Nuxt/Vue built-in functionality and established libraries over custom implementations.

**Priority Order**:
1. **Nuxt built-ins**: `useAsyncData`, `useFetch`, `useState`, `useRoute`, `useRouter`, file-based routing, auto-imports
2. **Nuxt modules**: `@nuxt/image`, `@nuxt/content`, official Nuxt modules
3. **VueUse**: `@vueuse/core` for data-related utilities
4. **Established Vue/Nuxt libraries**: Well-maintained, widely-used packages

**Avoid**:
- Custom implementations when Nuxt/VueUse can handle it
- Reinventing functionality that exists in the ecosystem
- Custom state management when `useState` or Pinia suffices
- Custom routing logic when file-based routing works
- Custom image handling when `@nuxt/image` exists
- JavaScript-based responsive solutions when CSS media queries work

**Rationale**: Using established, well-tested libraries reduces bugs, improves maintainability, and leverages community knowledge. Custom implementations add technical debt and maintenance burden.

**Examples**:
- ❌ Custom debounce utility → ✅ `useDebounce()` from VueUse (for data operations)
- ❌ Custom fetch wrapper → ✅ `useAsyncData()` or `useFetch()` from Nuxt
- ❌ Custom image optimization → ✅ `<NuxtImg>` component
- ❌ Custom modal state → ✅ `useState()` or VueUse `useToggle()` (for state, not styling)
- ❌ JavaScript media queries → ✅ CSS media queries (for presentation)

## Scope Constraints

### Phase 1: Component Migration (IN SCOPE)

**Component Structure**:
- Migrate all Nunjucks templates to Vue
- Maintain exact HTML structure
- Preserve all CSS classes
- Implement proper TypeScript interfaces
- Follow atomic design organization

**Template Syntax**:
- Convert Nunjucks logic to Vue template syntax
- Convert filters to composables (except Contentful ones)
- Implement computed properties for Nunjucks variables
- Migrate includes to component imports

**CSS & Styling**:
- Copy all CSS files exactly as-is
- Maintain BEM naming conventions
- Preserve responsive breakpoints
- Keep all design tokens
- **CSS Integration Strategy**: Keep all legacy CSS in place but "unplug" it from `nuxt.config.ts` (comment out or conditionally disable) so it can be easily re-enabled for future integration with `components/ds/` components. This preserves the CSS for Phase 2+ integration work while keeping Phase 1 focused on component migration.

**Client-Side Functionality**:
- Migrate search.js to composable using `useDebounce()` from VueUse
- Migrate cardFilters.js to composable using Vue reactivity
- Migrate other UI utilities, preferring VueUse composables
- Use `useIntersectionObserver()` from VueUse for lazy loading data
- Keep all responsive behavior in CSS using media queries
- Leverage Nuxt's `useAsyncData()`/`useFetch()` for data fetching

**Layout & Routing**:
- Set up Nuxt page structure
- Implement proper routing using file-based routing
- Create layout components
- Maintain URL structure

### Phase 2: Directus Migration & DS Integration (OUT OF SCOPE)

**Note**: Phase 2 will include integration of migrated components with `components/ds/` components. Legacy CSS is preserved but unplugged in Phase 1 to enable this future integration.

**Contentful Integration**:
- Don't optimize Contentful queries
- Don't refactor Contentful data loaders
- Don't create elaborate Contentful wrappers
- Don't improve error handling for Contentful
- Don't add caching layers for Contentful
- Don't integrate Contentful SDK in Nuxt app

**Strategy**: Extract all Contentful data once as static JSON files. Use those files as data source. Zero Contentful dependency in Nuxt app.

**Image Optimization**:
- Don't migrate `contentfulImage` filter
- Don't migrate `optimizeRichTextImages` filter
- Don't create custom image compression logic
- Don't implement advanced srcset strategies

**Strategy**: Use `<NuxtImg>` component out of the box, let it handle optimization.

**Data Layer Improvements**:
- Don't restructure data models
- Don't optimize data fetching patterns
- Don't implement sophisticated caching
- Don't refactor data transformation logic
- Don't add data validation or schema enforcement

**Strategy**: Use extracted JSON files as-is. Data structure is verified to match exactly what components expect. Defer all improvements to Phase 2.

## Migration Strategy

### Static Data Extraction

Phase 1 uses a **static data extraction approach** that eliminates Contentful dependency entirely from the Nuxt application. All Contentful content is extracted once as JSON files and used as static data sources throughout the migration.

**Process**:
1. **Extraction** (One-time, in legacy repo): Run `scripts/extract-contentful-data.js` which uses existing Eleventy Contentful loaders. All data is fetched, transformed, and normalized exactly as Eleventy does it. Output saved as JSON files in `_data/contentful-export/`
2. **Verification**: Extraction tested and verified against live Contentful data. Data structure matches exactly what components expect. All actual values preserved.
3. **Integration** (In Nuxt app): Copy extracted JSON files to `src/content/data/` or appropriate location. Create thin composables using `useAsyncData()`/`useFetch()` that read from static JSON files. Zero Contentful dependency in Nuxt codebase.

**Rationale**: Simplifies migration, eliminates network dependencies, enables easier testing, and provides clean separation between Phase 1 (component migration) and Phase 2 (CMS migration).

## Decision Framework

When uncertain about scope, apply these questions in order:

1. **Is it Contentful-specific?**
   - YES → Out of scope, defer to Phase 2
   - NO → In scope, migrate fully

2. **Is it image optimization?**
   - YES → Out of scope, use `<NuxtImg>` component
   - NO → In scope, migrate

3. **Is it data fetching/transformation?**
   - YES → Out of scope, use static JSON files with `useAsyncData()`/`useFetch()`
   - NO → Likely in scope

4. **Is it component structure/UI?**
   - YES → In scope, migrate fully (CSS for presentation, VueUse/composables for data)
   - NO → Check other criteria

5. **Is it CSS/styling?**
   - YES → In scope, copy exactly
   - NO → Check other criteria

6. **Can it be done with Nuxt built-ins or VueUse?**
   - YES → Use built-in/VueUse for data operations, don't write custom code
   - NO → Check if established library exists before custom implementation

7. **Is it presentation/styling?**
   - YES → Use CSS (media queries, classes, etc.), not JavaScript
   - NO → Use composables/computed for data transformation

## Governance

This constitution supersedes all other development practices and guidelines for the BFNA website migration project. All code changes, architectural decisions, and scope determinations MUST comply with these principles.

**Amendment Procedure**:
- Amendments require documentation of rationale and impact assessment
- Version increments follow semantic versioning:
  - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
  - **MINOR**: New principle/section added or materially expanded guidance
  - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
- All amendments must be reviewed and approved before implementation

**Compliance Review**:
- All PRs/reviews must verify compliance with constitution principles
- Scope decisions must reference the Decision Framework
- Deviations from principles must be explicitly justified and documented
- Use `_process/migration-spec-draft.md` for detailed migration guidance

**Version**: 1.0.1 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
