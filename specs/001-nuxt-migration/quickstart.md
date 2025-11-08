# Quick Start: Phase 1 Website Platform Migration

**Date**: 2025-01-27  
**Feature**: Phase 1 Website Platform Migration  
**Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 18+ and npm
- Access to `bfna-website-legacy` repository
- Contentful API credentials (for data extraction only)

## Setup Steps

### 1. Extract Contentful Data

```bash
# In bfna-website-legacy directory
cd bfna-website-legacy
npm install  # If not already installed
node scripts/extract-contentful-data.js
```

This generates JSON files in `_data/contentful-export/`:
- `products.json`
- `publications.json`
- `videos.json`
- `infographics.json`
- `people.json`
- `workstreams.json`
- `podcasts.json`
- `news.json`
- `announcements.json`
- `twitter.json`
- `docs.json`

### 2. Copy Static Data to Nuxt App

```bash
# Copy extracted JSON files
cp bfna-website-legacy/_data/contentful-export/*.json bfna-website-nuxt/src/content/data/
```

### 3. Copy Legacy Assets

```bash
# Copy asset folders from legacy to Nuxt public directory
cp -r bfna-website-legacy/src/assets/favicon bfna-website-nuxt/src/public/
cp -r bfna-website-legacy/src/assets/files bfna-website-nuxt/src/public/
cp -r bfna-website-legacy/src/assets/fonts bfna-website-nuxt/src/public/
cp -r bfna-website-legacy/src/assets/images bfna-website-nuxt/src/public/
```

### 4. Copy Legacy CSS

```bash
# Copy CSS files to css-legacy directory
cp -r bfna-website-legacy/src/assets/css bfna-website-nuxt/src/public/css-legacy/

# Create legacy-styles.css with @import statements
# (See plan.md for structure)
```

### 5. Install Dependencies

```bash
cd bfna-website-nuxt
npm install
# Add VueUse if not already installed
npm install @vueuse/core @vueuse/nuxt
```

### 6. Configure Nuxt

Update `nuxt.config.ts`:
- Ensure legacy CSS is commented out/unplugged
- Configure file-based routing
- Set up image optimization with `@nuxt/image`
- Configure redirects if needed

### 7. Create Data Composables

Create composables in `src/composables/data/`:
- `useProducts.ts`
- `usePublications.ts`
- `useVideos.ts`
- `useInfographics.ts`
- `usePeople.ts`
- `usePodcasts.ts`
- `useNews.ts`
- `useAnnouncements.ts`
- `useWorkstreams.ts`

See [data-model.md](./data-model.md) for implementation pattern.

### 8. Migrate Components

Start migrating Nunjucks templates to Vue components:
1. Create `src/components/legacy/` structure (atoms/molecules/organisms/templates)
2. Migrate each `.njk` template to `.vue` component
3. Preserve exact HTML structure and CSS classes
4. Convert Nunjucks logic to Vue template syntax
5. Use composables for data access

### 9. Migrate Pages

Create pages in `src/pages/`:
- `index.vue` (homepage)
- `about.vue`
- `team.vue`
- `products/[slug].vue`
- `publications/[slug].vue`
- `videos/[slug].vue`
- `podcasts/[slug].vue`
- `search.vue`
- `archives.vue`

### 10. Migrate Client-Side JavaScript

Convert JavaScript files to composables:
- `search.js` → `composables/legacy/useSearch.ts` (using `useDebounce` from VueUse)
- `cardFilters.js` → `composables/legacy/useCardFilters.ts` (using Vue reactivity)
- `typeWriterEffect.js` → `composables/legacy/useTypeWriter.ts`
- `lazyLoadingUpdate.js` → Use `useIntersectionObserver` from VueUse

### 11. Test Build

```bash
npm run build
```

Verify:
- Build completes without errors (<5 minutes per SC-004)
- No Contentful dependencies in build output
- All static assets copied correctly

### 12. Run Development Server

```bash
npm run dev
```

Verify:
- Pages render correctly
- Visual parity with legacy site
- Interactive features work
- No console errors

## Development Workflow

### Updating Content During Phase 1

1. Update content in Contentful (if needed)
2. Re-run extraction script:
   ```bash
   cd bfna-website-legacy
   node scripts/extract-contentful-data.js
   ```
3. Copy updated JSON files to Nuxt app:
   ```bash
   cp _data/contentful-export/*.json ../bfna-website-nuxt/src/content/data/
   ```
4. Rebuild Nuxt app:
   ```bash
   cd ../bfna-website-nuxt
   npm run build
   ```

### Component Migration Order

Recommended order (can be done in parallel):
1. **P1**: Core page templates (homepage, about, team)
2. **P1**: Content display components (card, content item)
3. **P1**: Navigation components (header, footer, breadcrumbs)
4. **P2**: Interactive features (search, filtering)
5. **P2**: Special pages (search, archives)

## Verification Checklist

- [ ] All static data files copied to `src/content/data/`
- [ ] All legacy assets copied to `src/public/`
- [ ] Legacy CSS copied to `src/public/css-legacy/` and unplugged
- [ ] Data composables created and working
- [ ] At least one page migrated and rendering correctly
- [ ] Build completes successfully
- [ ] No Contentful dependencies in build output
- [ ] Visual parity verified for migrated pages

## Troubleshooting

### Build Errors

- **Missing data files**: Ensure all JSON files copied to `src/content/data/`
- **Asset 404 errors**: Verify asset paths match legacy structure
- **CSS not loading**: Check legacy CSS is in `public/css-legacy/` and paths are correct

### Runtime Errors

- **Data not loading**: Check composable imports and JSON file paths
- **Component errors**: Verify Vue component syntax and prop types
- **Routing errors**: Check file-based routing matches legacy URL structure

## Next Steps

After initial setup:
1. Complete component migration (see [plan.md](./plan.md))
2. Implement all page types
3. Migrate all client-side JavaScript
4. Verify visual parity (SC-001)
5. Test all interactive features
6. Prepare for deployment

