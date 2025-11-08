# Phase 1 Migration Spec (Draft)

## Overview

### Objective

Stand up a Nuxt build that faithfully renders the current 11ty experience with the absolute minimum refactors. The Nuxt codebase should be structurally ready for later phases (component refactors, design token alignment, CMS migration) while still shipping quickly.

**Success Criteria:**
- Nuxt app can be deployed independently of 11ty
- Renders every template/page with legacy styling
- Fetches/builds the same data
- Maintains exact HTML structure and CSS classes

### Naming Conventions

- **Source repo**: `bfna-website-legacy` (11ty)
- **Target repo**: `bfna-website-nuxt` (Nuxt 3 runtime with Nuxt 4 compatibility date)

### Future Phases (Out of Scope)

- Vue SFC refactors that replace the `css-legacy/` dependency
- Align tokens and global styles with `src/public/css/styles.css`
- Re-platform components on top of `src/components/ds`
- Rebuild composables/data streams for Directus
- Full CMS migration (Contentful → Directus)

### Open Questions

- Confirm Nuxt runtime target (Nuxt 3.13 today, but compatibility is aimed at Nuxt 4)
- Decide whether any Eleventy shortcodes/filters can be dropped rather than migrated
- Clarify hosting constraints (Netlify redirects, search index endpoints, etc.)

## Development Principles

### Principle 1: "Good enough to work, ready to replace"

The goal is to get components working in Vue with minimal data layer changes, knowing that the entire data layer will be replaced with Directus soon. Don't polish what will be thrown away.

### Principle 2: CSS-First for Presentation, Composables for Data

**Markup and CSS handle presentation and simple rendering logic. Computed functions, composables, and modules handle data transformation.**

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

**Examples**:
- ✅ Responsive layout → CSS media queries (not JavaScript)
- ✅ Conditional styling → CSS classes + Vue `:class` binding
- ✅ Data filtering/sorting → Computed properties or composables
- ✅ Search debouncing → `useDebounce()` from VueUse (data operation)
- ✅ Lazy loading → `useIntersectionObserver()` from VueUse (data loading, not presentation)

### Principle 3: Leverage Nuxt Built-ins & Ecosystem

**Prefer Nuxt/Vue built-in functionality and established libraries over custom implementations.**

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

**Examples**:
- ❌ Custom debounce utility → ✅ `useDebounce()` from VueUse (for data operations)
- ❌ Custom fetch wrapper → ✅ `useAsyncData()` or `useFetch()` from Nuxt
- ❌ Custom image optimization → ✅ `<NuxtImg>` component
- ❌ Custom modal state → ✅ `useState()` or VueUse `useToggle()` (for state, not styling)
- ❌ JavaScript media queries → ✅ CSS media queries (for presentation)

## Scope: What's In & Out

### ❌ OUT OF SCOPE (Phase 2: Directus Migration)

#### Contentful Integration
- **Don't** optimize Contentful queries
- **Don't** refactor Contentful data loaders
- **Don't** create elaborate Contentful wrappers
- **Don't** improve error handling for Contentful
- **Don't** add caching layers for Contentful
- **Don't** integrate Contentful SDK in Nuxt app

**Strategy**: Extract all Contentful data once as static JSON files. Use those files as data source. Zero Contentful dependency in Nuxt app.

#### Image Optimization
- **Don't** migrate `contentfulImage` filter
- **Don't** migrate `optimizeRichTextImages` filter
- **Don't** create custom image compression logic
- **Don't** implement advanced srcset strategies

**Strategy**: Use `<NuxtImg>` component out of the box, let it handle optimization.

#### Data Layer Improvements
- **Don't** restructure data models
- **Don't** optimize data fetching patterns
- **Don't** implement sophisticated caching
- **Don't** refactor data transformation logic
- **Don't** add data validation or schema enforcement

**Strategy**: Use extracted JSON files as-is. Data structure is verified to match exactly what components expect. Defer all improvements to Phase 2.

### ✅ IN SCOPE (Phase 1: Component Migration)

#### Component Structure
- **Do** migrate all Nunjucks templates to Vue
- **Do** maintain exact HTML structure
- **Do** preserve all CSS classes
- **Do** implement proper TypeScript interfaces
- **Do** follow atomic design organization

#### Template Syntax
- **Do** convert Nunjucks logic to Vue template syntax
- **Do** convert filters to composables (except Contentful ones)
- **Do** implement computed properties for Nunjucks variables
- **Do** migrate includes to component imports

#### CSS & Styling
- **Do** copy all CSS files exactly as-is
- **Do** maintain BEM naming conventions
- **Do** preserve responsive breakpoints
- **Do** keep all design tokens

#### Client-Side Functionality
- **Do** migrate search.js to composable using `useDebounce()` from VueUse (for data operations)
- **Do** migrate cardFilters.js to composable using Vue reactivity (`ref`, `computed`) for data filtering/sorting
- **Do** migrate typeWriterEffect.js to composable (or use VueUse `useInterval` if applicable)
- **Do** migrate other UI utilities, preferring VueUse composables for data-related operations
- **Do** use `useIntersectionObserver()` from VueUse for lazy loading data (not for presentation)
- **Do** keep all responsive behavior in CSS using media queries (not JavaScript)
- **Do** leverage Nuxt's `useAsyncData()`/`useFetch()` for data fetching instead of custom fetch wrappers
- **Do** use composables/computed to transform data and reduce template complexity

#### Layout & Routing
- **Do** set up Nuxt page structure
- **Do** implement proper routing using file-based routing
- **Do** create layout components
- **Do** maintain URL structure

## Migration Strategy: Static Data Extraction

### Overview

Phase 1 uses a **static data extraction approach** that eliminates Contentful dependency entirely from the Nuxt application. All Contentful content is extracted once as JSON files and used as static data sources throughout the migration.

### Why This Approach?

1. **Simplifies Migration**: No Contentful SDK, environment variables, or API calls needed in Nuxt app
2. **Faster Development**: No rate limits, network delays, or API failures during migration
3. **Easier Testing**: Static files are predictable, version-controlled, and always available
4. **Cleaner Separation**: Phase 1 focuses purely on component migration; Phase 2 handles CMS migration to Directus
5. **Lower Risk**: No risk of Contentful API changes, token expiration, or network issues breaking the migration

### How It Works

1. **Extraction** (One-time, in legacy repo):
   - Run `scripts/extract-contentful-data.js` which uses existing Eleventy Contentful loaders
   - All data is fetched, transformed, and normalized exactly as Eleventy does it
   - Output saved as JSON files in `_data/contentful-export/`

2. **Verification** ✅:
   - Extraction tested and verified against live Contentful data
   - Data structure matches exactly what components expect
   - All actual values preserved (undefined values correctly omitted per JSON spec)

3. **Integration** (In Nuxt app):
   - Copy extracted JSON files to `src/content/data/` or appropriate location
   - Create thin composables using `useAsyncData()`/`useFetch()` that read from static JSON files
   - Zero Contentful dependency in Nuxt codebase

### What Gets Extracted

All Contentful content types are extracted:
- Products (117 items)
- Publications (183 items, 216 updates)
- Videos (43 items)
- Infographics (55 items)
- People/Team data
- Workstreams (6 workstreams)
- Podcasts (40 items)
- News (6 items)
- Announcements
- Documentation content
- Super Products (7 items)
- Twitter content

### Data Structure Preservation

The extraction preserves:
- ✅ Normalized field names (`heading`, `theme`, `permalink`, etc.)
- ✅ Transformed data (HTML from markdown, formatted dates, computed fields)
- ✅ Nested structures (`authors`, `team_section`, `breadcrumbs`)
- ✅ Complex returns (e.g., `publications.json` has `items`, `updates`, `homePageUpdates`)

### When to Re-extract

- Before Phase 2 migration (to get latest Contentful content)
- If Contentful content changes significantly during Phase 1
- As needed for testing/debugging

The extraction script can be run anytime to refresh the JSON files.

### Phase 2 Transition

When migrating to Directus in Phase 2:
- Replace static JSON composables with Directus queries
- No changes needed to components (they consume the same data structure)
- Clean separation: Phase 1 = component migration, Phase 2 = CMS migration

## Workstreams

### 1. Baseline Nuxt + DS Setup

- Start from the CCM DS boilerplate already scaffolded in `bfna-website-nuxt` and confirm local dev builds succeed
- Remove the DS boilerplate CSS import from `src/nuxt.config.ts` once legacy CSS is wired (keeps the layer stack predictable)
- Audit existing DS components under `src/components/ds` and document what is safe to use during the legacy port (goal: avoid tight coupling until Phase 2)
- Capture config deltas between 11ty and Nuxt (env vars, build commands, hosting adapters) so we can toggle deployments during the cutover

### 2. Assets & Global CSS

- Copy the legacy asset folders (`favicon/`, `files/`, `fonts/`, `images/`) from `bfna-website-legacy/src/assets` into `bfna-website-nuxt/src/public` (Nuxt `public/` keeps 1:1 URLs)
- Move the entire legacy CSS tree (`bfna-website-legacy/src/assets/css`) into `bfna-website-nuxt/src/public/css-legacy/**` with zero edits
- Create `src/public/css-legacy/legacy-styles.css` that only contains `@import` statements for the legacy partials to preserve order
- Update `src/nuxt.config.ts` → `css: ['~/public/css/styles.css', '~/public/css-legacy/legacy-styles.css']` ensuring PostCSS still runs for the modern DS stack
- Validate font-face URLs and asset paths still resolve after moving to the `public/` root (adjust relative paths if necessary)
- **Note**: Files in `public/` are static assets and won't be processed by PostCSS/Vite. Consider moving legacy CSS to `src/assets/css-legacy/` if PostCSS processing is needed. Current approach works if CSS is already final/minified.

### 3. Data Extraction & Static Data Setup

- **Extract Contentful data**: Run `scripts/extract-contentful-data.js` in legacy repo to pull all Contentful content and save as JSON files in `_data/contentful-export/`
- **Copy static data**: Copy extracted JSON files from `bfna-website-legacy/_data/contentful-export/` to `bfna-website-nuxt/src/content/data/` (or appropriate Nuxt Content location)
- **Copy YAML/JSON data**: Copy static YAML/JSON files from `bfna-website-legacy/src/_data` (e.g., `about.yml`, `main_nav.yml`) to `src/content/data/` or `src/utils/legacy-data/`
- **Create data composables**: Create thin composables using `useAsyncData()` or `useFetch()` that read from static JSON files. Leverage Nuxt's built-in data fetching rather than custom implementations
- **Translate Eleventy filters**: Convert non-Contentful filters to composables. Prefer VueUse utilities where applicable (e.g., `useDebounce`, `useThrottle`). Skip `contentfulImage` and `optimizeRichTextImages` per scope clarification
- **Convert client JS**: Migrate `src/assets/js` behavior files to composables/plugins. Use VueUse for data-related patterns (debouncing, intersection observer, etc.). Use `defineNuxtPlugin` for DOM globals. Avoid custom implementations when VueUse/Nuxt can handle it
- **Document dependencies**: Document where each composable is consumed so the component migration has a dependency map

### 4. Legacy Include/Component Port

- Recreate the Eleventy include structure (`components/`, `modules/`, `templates/`) under `src/components/legacy/` to keep paths predictable
- For each `.njk` include, build a render-equivalent `.vue` file that inlines the migrated HTML and uses legacy CSS classes untouched
- Where components depended on global Eleventy data (`collections`, `page`, etc.), inject the equivalent props explicitly or fetch via composables (using `useAsyncData`/`useFetch`) to avoid hidden coupling
- Replace Nunjucks macros/shortcodes with Vue slots/props but keep the API surface the same for now (document any differences)
- Use VueUse composables for data-related component needs (e.g., `useIntersectionObserver` for lazy loading data, `useToggle` for modal state). Keep responsive behavior in CSS using media queries
- Rewire the new composables from Workstream 3 into the Vue components and confirm hydration boundaries for client-side JS behaviors

### 5. Pages & Routing

- Map every root-level template in `bfna-website-legacy/src` (e.g., `about.html`, `archives.html`, `search.html`, etc.) to a page in `src/pages` using the Nuxt file-based router
- For Eleventy layouts such as `base.njk` create Nuxt layouts in `src/layouts` and ensure head/meta tags are preserved
- Handle Eleventy collections (e.g., updates, publications, podcasts) by reading from static JSON files via composables (no server routes needed - data is static)
- Recreate special generators such as `search_index.njk` as Nitro endpoints or JSON files under `public/` so consumers keep the same URLs. Use extracted data to generate search index
- Translate `_redirects` rules into Nuxt/Nitro route rules or hosting-specific configs (Netlify-style redirects vs. Vercel rewrites)

### 6. Integrations & Dynamic Content

- **Remove Contentful dependency**: No Contentful env vars needed in Nuxt repo (data is static JSON). Contentful completely bypassed in Phase 1 per static extraction strategy
- Re-implement Embedly, Twitter widgets, and search behaviors as Vue composables or plugins with SSR guards (`process.client`). Use VueUse utilities for data operations (e.g., `useDebounce` for search input, `useIntersectionObserver` for lazy loading data). Keep all responsive behavior in CSS
- Audit analytics, tag managers, and third-party scripts that were injected via Eleventy and recreate them via Nuxt's `app.head` or route middleware (use `useHead()` composable or `definePageMeta()`)
- Note: Contentful webhooks are not needed for Phase 1 (static data). Will be re-implemented in Phase 2 with Directus

### 7. QA, Regression & Handoff

- Create a parity checklist covering all page types, navigation flows, and module states (desktop + mobile screenshots for critical routes)
- Add lightweight smoke tests (Vitest + `@nuxt/test-utils` or Playwright) that ensure key pages render and key composables return data
- Run `npm run build` + `nuxt preview` to verify the production bundle before cutting traffic over
- Document any intentional deviations from the 11ty site so stakeholders can sign off before decommissioning the legacy repo

## Decision Framework

When uncertain about scope, ask:

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

## Examples

### ❌ OUT OF SCOPE: Contentful Integration

```typescript
// DON'T do this - no Contentful in Nuxt app
export const useProducts = async () => {
  const client = contentful.createClient({...})
  return await client.getEntries({...})
}

// Instead, use static JSON files (extracted once, verified to match):
export const useProducts = () => {
  return useAsyncData('products', () => 
    import('~/content/data/products.json').then(m => m.default)
  )
}
```

### ❌ OUT OF SCOPE: Contentful Image Filter

```javascript
// DON'T migrate this filter to a composable
// src/_filters/contentfulImage.js
module.exports = (url, width) => {
  // Complex Contentful image optimization logic
  return optimizedUrl
}

// Instead, use Nuxt Image directly in components:
<NuxtImg :src="imageUrl" width="600" />
```

### ✅ IN SCOPE: Card Component Migration

```vue
<!-- DO migrate this component completely -->
<!-- From: src/_includes/modules/card.njk -->
<!-- To: components/molecules/Card.vue -->

<template>
  <article :class="cardClasses">
    <div class="card__content">
      <!-- Full Vue component structure -->
    </div>
  </article>
</template>

<script setup lang="ts">
interface CardProps {
  heading: string
  theme?: string
  // ... complete type definitions
}
</script>
```

### ✅ IN SCOPE: Search Utility Migration

```typescript
// DO migrate this utility completely
// From: src/assets/js/search.js
// To: composables/useSearch.ts
// Use VueUse for debouncing and Nuxt for data fetching

import { useDebouncedRef, useDebounceFn } from '@vueuse/core'
import { useAsyncData } from 'nuxt/app'

export const useSearch = () => {
  const query = ref('')
  const debouncedQuery = useDebouncedRef(query, 300) // VueUse debounce
  
  const { data: results } = useAsyncData('search', () => {
    if (!debouncedQuery.value) return []
    // Use Nuxt's useAsyncData for data fetching
    return performSearch(debouncedQuery.value)
  }, {
    watch: [debouncedQuery] // Auto-refetch on query change
  })
  
  return {
    query,
    results,
    performSearch: useDebounceFn(performSearch, 300)
  }
}
```

## Risks & Mitigations

### Resolved Risks

- ~~Contentful dependency drift~~ → **RESOLVED**: Static JSON extraction eliminates Contentful dependency entirely in Phase 1. No API calls, env vars, or SDK needed.
- ~~Contentful API failures during migration~~ → **RESOLVED**: Static files eliminate network dependency. Data is always available.

### Active Risks & Mitigations

- **CSS cascade conflicts** between DS and legacy layers → Mitigate via explicit `@layer` ordering and scoping legacy CSS inside its own layer wrapper if needed.
- **Hidden Eleventy data magic** (implicit globals) → Mitigate by listing every place `collections`/`page` is referenced and designing explicit Vue props/composables.
- **Build/runtime differences** (Netlify vs. Nuxt hosting) → Mitigate by replicating redirect rules and serverless functions early, not at launch week.
- **Static data staleness** → Mitigate by documenting extraction process clearly. Data can be re-extracted from Contentful anytime before Phase 2. Extraction verified ✅ - structure matches exactly. Consider adding a timestamp/metadata to exported JSON files for tracking. Note: This is acceptable risk since Phase 1 is temporary and Phase 2 will replace entire data layer with Directus.

## Summary

| Area | Scope | Strategy |
|------|-------|----------|
| Vue Components | ✅ IN | Full migration with TypeScript, use VueUse where applicable |
| CSS/Design | ✅ IN | Copy exactly, preserve all classes |
| Client JS Utils | ✅ IN | Migrate to composables using VueUse/Nuxt built-ins (avoid custom code) |
| Routing/Pages | ✅ IN | Use Nuxt file-based routing (built-in) |
| Contentful | ❌ OUT | Extract once as JSON, use static files (verified ✅) |
| Image Optimization | ❌ OUT | Use `<NuxtImg>` component (built-in) |
| Data Fetching | ❌ OUT | Use `useAsyncData()`/`useFetch()` with static JSON files |
| Data Models | ❌ OUT | Use extracted structure as-is, defer refactor to Phase 2 |
| State Management | ✅ IN | Use `useState()` or Pinia (avoid custom state management) |
| Common Utilities | ✅ IN | Use VueUse for data operations (`useDebounce`, `useIntersectionObserver`, etc.). Use CSS for presentation (media queries, etc.) |

