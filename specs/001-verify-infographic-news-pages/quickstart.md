# Quickstart: Verify Infographic & News Detail Pages

**Feature**: Verify Infographic & News Detail Pages  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Overview

This guide covers implementing infographic detail page route handling and verifying news item link resolution. The implementation adds infographic support to the existing catch-all route following the same pattern as publications, videos, and podcasts.

## Prerequisites

- Nuxt 3 application running
- `useInfographics()` composable available
- `useNews()` composable available
- Infographics and news data in `src/content/data/`
- Existing catch-all route `src/pages/[...slug].vue`

## Implementation Steps

### Step 1: Add Infographic Data Fetching

**File**: `src/pages/[...slug].vue`

Add infographics composable import and data fetching:

```typescript
import { useInfographics } from '~/composables/data/useInfographics'

// In script setup, add alongside existing data fetches:
const { data: infographicsData } = await useInfographics()
```

### Step 2: Add Infographic Route Matching

**File**: `src/pages/[...slug].vue`

Add computed property to match infographic by URL:

```typescript
// Find infographic by matching button.url
const infographic = computed(() => {
  if (!infographicsData.value?.items) return null
  
  const routePath = normalizedRoutePath.value
  
  const found = infographicsData.value.items.find(
    (i: any) => {
      const url = normalizeUrl(i.button?.url)
      return url === routePath.replace(/^\//, '')
    }
  )
  
  return found || null
})
```

### Step 3: Add Infographic Template Section

**File**: `src/pages/[...slug].vue`

Add infographic rendering section in template (after podcast section):

```vue
<!-- Infographic Page -->
<article v-else-if="infographic" class="article">
  <div class="wrapper">
    <LegacyMoleculesBreadcrumb
      v-if="infographic?.breadcrumbs"
      :breadcrumbs="infographic.breadcrumbs"
    />

    <header>
      <h1 v-if="infographic?.heading">{{ infographic.heading }}</h1>
      <h2 v-if="infographic?.subheading">{{ infographic.subheading }}</h2>
      <p v-if="infographic?.by_line" class="article__by-line">
        {{ infographic.by_line }}
      </p>
    </header>

    <div
      v-if="infographic?.content"
      class="article__content"
      v-html="infographic.content"
    ></div>

    <figure v-if="infographic?.infographic?.url" class="prose__infographic">
      <NuxtImg
        v-if="infographic?.image?.url"
        :src="infographic.image.url"
        :alt="infographic.image.title"
        loading="lazy"
      />
      <p>
        <a
          :href="infographic.infographic.url"
          class="button button--secondary"
          target="_blank"
        >
          Download Original
        </a>
      </p>
    </figure>
  </div>
</article>
```

### Step 4: Update 404 Check

**File**: `src/pages/[...slug].vue`

Include infographic in 404 check:

```typescript
// If no content found after data loads, return 404
if (!product.value && !publication.value && !video.value && !podcast.value && 
    !infographic.value &&
    productsData.value && publicationsData.value && videosData.value && 
    podcastsData.value && infographicsData.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found'
  })
}
```

### Step 5: Update Meta Tags

**File**: `src/pages/[...slug].vue`

Add infographic to `useHead()` meta tags:

```typescript
useHead({
  title: computed(() => {
    // ... existing conditions ...
    if (infographic.value) {
      return `${infographic.value.heading} | Bertelsmann Foundation`
    }
    return 'Content | Bertelsmann Foundation'
  }),
  meta: [
    {
      property: 'og:image',
      content: computed(() => 
        product.value?.image?.url || 
        publication.value?.image?.url || 
        video.value?.video?.thumbnail || 
        infographic.value?.image?.url ||
        '/images/bfna-og.jpg'
      ),
    },
    {
      name: 'description',
      content: computed(() => 
        product.value?.og_description || 
        publication.value?.excerpt || 
        video.value?.excerpt || 
        podcast.value?.excerpt || 
        infographic.value?.og_description ||
        ''
      ),
    },
  ],
})
```

### Step 6: Verify News Item Links

**Manual Verification Steps**:

1. Navigate to homepage (`/`)
2. Find news items section
3. Click each news item link
4. Verify:
   - Internal links navigate correctly
   - External links open in new tab
   - Links resolve to correct destinations
   - No 404 errors for internal links

## Verification Checklist

### Infographic Detail Pages

- [ ] Infographic routes resolve correctly (no 404s)
- [ ] All content fields display:
  - [ ] Breadcrumbs
  - [ ] Heading
  - [ ] Subheading
  - [ ] Byline
  - [ ] Content HTML
  - [ ] Infographic image
  - [ ] Download link
- [ ] Meta tags are correct (title, og:image, description)
- [ ] Page renders gracefully with missing optional fields
- [ ] Route normalization works (trailing slashes handled)

### News Item Links

- [ ] All news item links resolve correctly
- [ ] Internal links navigate to correct pages
- [ ] External links open in new tab
- [ ] No broken links (404s)

## Testing

### Manual Testing

1. **Infographic Routes**:
   - Navigate to known infographic URL from updates page
   - Verify page loads with all content
   - Test with trailing slash variations
   - Test with missing optional fields

2. **News Links**:
   - Click news items on homepage
   - Verify link destinations
   - Check external links open correctly

### Route Testing

Test these infographic URLs (examples):
- `/politics-society/strength-in-numbers-2bfro5dcbt/`
- `/digital-world/infographic-cybersecurity-4o9yjyz7sy/`

## Troubleshooting

**Issue**: Infographic route returns 404
- **Check**: Verify `button.url` matches route path exactly (after normalization)
- **Check**: Ensure `useInfographics()` is called and data loads
- **Check**: Verify infographic is included in 404 check condition

**Issue**: Missing content fields
- **Expected**: Page should render gracefully with available fields
- **Check**: Verify optional field checks (`v-if`) are in place

**Issue**: News links broken
- **Check**: Verify `url` field format (internal vs external)
- **Check**: Test internal routes exist
- **Check**: Verify external URLs are accessible

## Next Steps

After implementation:
1. Run manual verification checklist
2. Test all infographic routes
3. Verify news item links
4. Document any issues found
5. Proceed to task breakdown (`/speckit.tasks`)

