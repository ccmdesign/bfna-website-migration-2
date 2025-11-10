# Quickstart: Phase 2 Migration Implementation

**Date**: 2025-01-27  
**Status**: Design Phase

## Overview

This quickstart guide provides step-by-step instructions for implementing Phase 2 migration features. Follow these steps in order to ensure proper dependencies and avoid breaking changes.

## Prerequisites

- Nuxt 4.2.0+ installed and configured
- `@nuxt/content` module installed and configured
- `@nuxt/image` module installed and configured
- `@vueuse/core` and `@vueuse/nuxt` installed
- Existing workstream data in `src/content/data/workstreams.json`

## Implementation Steps

### Step 1: Data Migration (One-Time)

**Objective**: Migrate workstream data from single JSON file to individual Nuxt Content format files.

**Tasks**:
1. Create `src/content/workstreams/` directory
2. Extract each workstream from `workstreams.json`
3. For each workstream:
   - Add `slug` field (derived from key name)
   - Add `navigation_order` field (assign based on current navigation order: democracy=1, politics-society=2, future-leadership=3, digital-world=4)
   - Add `visible` field (default to `true` for existing workstreams)
   - Transform `image` field to `hero` field structure:
     ```json
     {
       "hero": {
         "webp": "{image.url}",
         "fallback": "{image.url}",
         "width": 1920,  // Requires image analysis or manual input
         "height": 800,   // Requires image analysis or manual input
         "theme": "{workstream.theme}"
       }
     }
     ```
   - Save as `{slug}.json` in `src/content/workstreams/`
4. Create default hero configuration file:
   - Create `src/content/data/hero-default.json`
   - Add default hero image configuration with webp, fallback, width, height

**Validation**:
- Verify all workstream files created
- Verify hero configurations have width/height
- Verify navigation_order assigned correctly
- Verify slug matches filename

**Script Option**: Create migration script `scripts/migrate-workstreams.ts` to automate this process.

### Step 2: Configure Nuxt Content Collection

**Objective**: Register workstreams collection in Nuxt Content config.

**Tasks**:
1. Open `src/content.config.ts` (or `content.config.ts` at root)
2. Add workstreams collection:
   ```typescript
   workstreams: defineCollection({
     type: 'data',
     source: {
       include: 'workstreams/*.json',
       cwd: contentDir
     },
     schema: z.object({
       heading: z.string(),
       description: z.string(),
       theme: z.string(),
       slug: z.string(),
       button: z.object({
         url: z.string(),
         label: z.string()
       }).optional(),
       hero: z.object({
         webp: z.string().optional(),
         fallback: z.string().optional(),
         width: z.number(),
         height: z.number(),
         theme: z.string().optional()
       }).optional(),
       products_list: z.array(z.any()).optional(),
       updates_list: z.array(z.any()).optional(),
       navigation_order: z.number().optional(),
       visible: z.boolean().optional()
     })
   })
   ```

**Validation**:
- Run `npm run postinstall` to regenerate types
- Verify no TypeScript errors
- Verify workstreams collection appears in Nuxt Content

### Step 3: Create Workstream Composable

**Objective**: Create composable for fetching workstream data via Nuxt Content.

**Tasks**:
1. Create `src/composables/data/useWorkstream.ts`
2. Implement composable:
   ```typescript
   import { queryContent } from '#imports'
   
   export function useWorkstream(slug?: string) {
     return useAsyncData(`workstream-${slug || 'all'}`, async () => {
       if (slug) {
         const workstream = await queryContent('workstreams')
           .where({ slug })
           .findOne()
         return workstream || null
       } else {
         return await queryContent('workstreams').find()
       }
     })
   }
   ```

**Validation**:
- Test composable in component
- Verify data loads correctly
- Verify null handling for invalid slugs

### Step 4: Create Navigation Composable

**Objective**: Create composable for generating navigation items from workstream data.

**Tasks**:
1. Create `src/composables/data/useWorkstreamNavigation.ts`
2. Implement composable:
   ```typescript
   export function useWorkstreamNavigation() {
     const { data: workstreams, pending, error } = useWorkstream()
     
     const items = computed(() => {
       if (!workstreams.value) return []
       
       return workstreams.value
         .filter(ws => ws.visible !== false)
         .sort((a, b) => {
           const orderA = a.navigation_order ?? 999
           const orderB = b.navigation_order ?? 999
           if (orderA !== orderB) return orderA - orderB
           return a.heading.localeCompare(b.heading)
         })
         .map(ws => ({
           name: ws.heading,
           link: `/workstreams/${ws.slug}`,
           cssClass: `frame-nav--${ws.slug}`,
           order: ws.navigation_order ?? 999,
           visible: ws.visible !== false
         }))
     })
     
     return { items, pending, error }
   }
   ```

**Validation**:
- Test composable in navigation component
- Verify filtering works (hidden workstreams excluded)
- Verify sorting works (order, then alphabetical)

### Step 5: Create Hero Image Composable

**Objective**: Create composable for getting hero image configuration with fallback.

**Tasks**:
1. Create `src/composables/data/useHeroImage.ts`
2. Implement composable:
   ```typescript
   export function useHeroImage(theme?: string) {
     const { data: workstreams } = useWorkstream()
     const defaultHero = ref(null)
     
     // Load default hero
     useAsyncData('hero-default', async () => {
       const module = await import('~/content/data/hero-default.json')
       defaultHero.value = module.default
     })
     
     const config = computed(() => {
       if (!theme) return defaultHero.value
       
       const workstream = workstreams.value?.find(ws => ws.theme === theme)
       return workstream?.hero || defaultHero.value
     })
     
     return { config }
   }
   ```

**Validation**:
- Test with valid theme
- Test with invalid theme (should fallback to default)
- Test without theme (should return default)

### Step 6: Create Dynamic Workstream Route

**Objective**: Create dynamic route template for workstream pages.

**Tasks**:
1. Create `src/pages/workstreams/[slug].vue`
2. Implement page component:
   ```vue
   <template>
     <div v-if="workstream">
       <LegacyMoleculesHero
         :hero="{
           heading: workstream.heading,
           description: workstream.description,
         }"
         :theme="workstream.theme"
       />
       
       <div class="wrapper">
         <!-- Products list -->
         <div class="product-list">
           <LegacyMoleculesProductCardWebsite
             v-for="product in workstream.products_list"
             :key="product.heading"
             v-if="product.type === 'website'"
             :product="product"
           />
           <LegacyMoleculesProductCard
             v-for="product in workstream.products_list"
             :key="product.heading"
             v-else
             :product="product"
           />
         </div>
         
         <!-- Updates list -->
         <div v-if="updatesList.length > 0" class="cards-section">
           <LegacyMoleculesCard
             v-for="card in updatesList"
             :key="card.heading"
             :card="card"
           />
         </div>
       </div>
     </div>
   </template>
   
   <script setup lang="ts">
   const route = useRoute()
   const { data: workstream } = useWorkstream(route.params.slug as string)
   const { config: heroConfig } = useHeroImage(workstream.value?.theme)
   
   if (!workstream.value) {
     notFound()
   }
   
   const updatesList = computed(() => {
     if (!workstream.value || workstream.value.theme === 'podcasts') {
       return []
     }
     return workstream.value.updates_list || []
   })
   
   // Preload hero image
   useHead({
     link: [
       {
         rel: 'preload',
         as: 'image',
         fetchpriority: 'high',
         href: heroConfig.value?.webp || heroConfig.value?.fallback
       }
     ],
     title: computed(() => 
       `${workstream.value?.heading} | Bertelsmann Foundation`
     )
   })
   </script>
   ```

**Validation**:
- Test with valid slug (e.g., `/workstreams/democracy`)
- Test with invalid slug (should show 404)
- Verify hero image preloads
- Verify page title updates

### Step 7: Set Up Legacy URL Redirects

**Objective**: Redirect legacy workstream URLs to new routes.

**Tasks**:
1. Create `src/server/routes/[...slug].ts` or use Nuxt middleware
2. Implement redirect logic:
   ```typescript
   export default defineEventHandler((event) => {
     const slug = getRouterParam(event, 'slug')
     const workstreamSlugs = ['democracy', 'politics-society', 'future-leadership', 'digital-world']
     
     if (workstreamSlugs.includes(slug)) {
       return sendRedirect(event, `/workstreams/${slug}`, 301)
     }
   })
   ```
   
   OR use `nuxt.config.ts`:
   ```typescript
   routeRules: {
     '/democracy': { redirect: '/workstreams/democracy' },
     '/politics-society': { redirect: '/workstreams/politics-society' },
     '/future-leadership': { redirect: '/workstreams/future-leadership' },
     '/digital-world': { redirect: '/workstreams/digital-world' }
   }
   ```

**Validation**:
- Test redirects for all legacy URLs
- Verify 301 status code
- Verify redirects work in production build

### Step 8: Update Navigation Component

**Objective**: Replace hardcoded navigation links with dynamic generation.

**Tasks**:
1. Open `src/components/legacy/organisms/MainNav.vue`
2. Replace hardcoded workstream links with dynamic generation:
   ```vue
   <script setup>
   const { items: workstreamNavItems } = useWorkstreamNavigation()
   
   const mainNav = {
     // ... other nav items ...
     columns: [
       {
         name: 'Topics',
         links: computed(() => workstreamNavItems.value.map(item => ({
           name: item.name,
           link: item.link
         })))
       },
       // ... other columns ...
     ]
   }
   </script>
   ```

**Validation**:
- Verify navigation displays correctly
- Verify CSS classes applied (`frame-nav--{slug}`)
- Verify navigation order matches data
- Test hiding workstream (set `visible: false`)

### Step 9: Refactor Updates Page

**Objective**: Eliminate duplicate tab code in updates page.

**Tasks**:
1. Create `src/components/templates/UpdatesPageTab.vue` component
2. Extract common tab logic to composable `useUpdatesFilters.ts`
3. Refactor `src/pages/updates.vue` to use reusable component
4. Implement filter state persistence with sessionStorage

**Validation**:
- Verify all tabs display correctly
- Verify filters work for publications/videos/infographics
- Verify podcasts tab has no filters
- Verify filter state persists when switching tabs
- Test sessionStorage corruption handling

### Step 10: Create Base Layout

**Objective**: Create reusable base layout for new pages.

**Tasks**:
1. Create `src/layouts/base.vue`
2. Include Frame and Footer components
3. Set common head/meta elements
4. Prepare for design system integration

**Validation**:
- Test layout on new page
- Verify Frame and Footer render
- Verify common meta tags included

### Step 11: Clean Up Legacy Files

**Objective**: Remove duplicate workstream page files after redirects confirmed working.

**Tasks**:
1. Verify redirects working in production build
2. Remove legacy workstream page files:
   - `src/pages/democracy.vue`
   - `src/pages/digital-world.vue`
   - `src/pages/future-leadership.vue`
   - `src/pages/politics-society.vue`
3. Deprecate or remove `src/content/data/workstreams.json` (after migration complete)

**Validation**:
- Verify redirects still work after file removal
- Verify no broken imports
- Run full build to verify no errors

## Testing Checklist

- [ ] All workstream pages load correctly via `/workstreams/{slug}`
- [ ] Legacy URLs redirect correctly to new routes
- [ ] 404 pages display for invalid workstream slugs
- [ ] Navigation displays workstreams in correct order
- [ ] Hidden workstreams don't appear in navigation
- [ ] Hero images preload correctly
- [ ] Hero images fallback to default when missing
- [ ] Updates page filters work correctly
- [ ] Filter state persists when switching tabs
- [ ] Filter state resets on sessionStorage corruption
- [ ] Base layout renders Frame and Footer
- [ ] All pages maintain visual parity with legacy implementation

## Performance Verification

- [ ] Lighthouse scores 90+ for Performance, SEO, Accessibility
- [ ] Hero images preload with `<link rel="preload">`
- [ ] Hero images have explicit width/height (no CLS)
- [ ] Static site generation works for all workstream routes
- [ ] No console errors or warnings

## Rollback Plan

If issues arise:

1. **Keep legacy page files** until redirects confirmed working
2. **Maintain `workstreams.json`** until migration verified complete
3. **Feature flags** can be added to toggle between old/new implementations
4. **Git branches** allow easy rollback if needed

## Next Steps After Implementation

1. Update documentation with new file structure
2. Train content editors on new content file format
3. Plan Phase 3: Design system integration
4. Plan Phase 4: Directus CMS migration

