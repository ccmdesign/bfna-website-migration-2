# Manual Content Update Process

This document describes the process for updating content in the Nuxt application after extracting data from Contentful.

## Overview

The Nuxt application uses static JSON files stored in `src/content/data/` instead of making live API calls to Contentful. To update content, you must:

1. Extract fresh data from Contentful (using the legacy project)
2. Copy the extracted JSON files to the Nuxt project
3. Rebuild the Nuxt application

## Step-by-Step Process

### 1. Extract Contentful Data

From the `bfna-website-legacy/` directory:

```bash
cd bfna-website-legacy
node scripts/extract-contentful-data.js
```

This creates JSON files in `bfna-website-legacy/_data/contentful-export/`:
- `products.json`
- `publications.json`
- `videos.json`
- `infographics.json`
- `people.json`
- `podcasts.json`
- `news.json`
- `announcement.json`
- `workstreams.json`
- `docs.json`
- `super_products.json`
- `twitter.json`

### 2. Copy Extracted Files to Nuxt Project

Copy the extracted JSON files to the Nuxt project's content directory:

```bash
# From repository root
cp bfna-website-legacy/_data/contentful-export/*.json bfna-website-nuxt/src/content/data/
```

Or copy individual files as needed:
```bash
cp bfna-website-legacy/_data/contentful-export/products.json bfna-website-nuxt/src/content/data/
cp bfna-website-legacy/_data/contentful-export/publications.json bfna-website-nuxt/src/content/data/
# ... etc
```

### 3. Rebuild the Nuxt Application

From the `bfna-website-nuxt/` directory:

```bash
cd bfna-website-nuxt
npm run build
```

The build process will:
- Generate documentation (if needed)
- Process all content files
- Build the production-ready application in `.output/`

### 4. Verify the Build

After rebuilding, verify that:
- Build completes without errors
- Build output exists in `.output/`
- Static assets are present in `.output/public/`

You can also run the Contentful dependency audit:

```bash
npx tsx scripts/verify-contentful-deps.ts
```

This confirms that no Contentful API calls are made at runtime.

## Automated Script (Optional)

You can create a script to automate this process:

```bash
#!/bin/bash
# update-content.sh

echo "Extracting Contentful data..."
cd bfna-website-legacy
node scripts/extract-contentful-data.js

echo "Copying files to Nuxt project..."
cd ..
cp bfna-website-legacy/_data/contentful-export/*.json bfna-website-nuxt/src/content/data/

echo "Rebuilding Nuxt application..."
cd bfna-website-nuxt
npm run build

echo "✅ Content update complete!"
```

## Notes

- **No Runtime Contentful Calls**: The application never makes API calls to Contentful at runtime. All content is static JSON files.
- **Build Time Only**: Content updates require a rebuild. The application does not support hot-reloading of content in production.
- **Independent Deployment**: The Nuxt application can be deployed independently without the legacy platform running.
- **Data Format**: The JSON files preserve the exact structure from the Eleventy data loaders, including normalized field names and computed fields.

## Troubleshooting

### Build Fails After Content Update
- Verify JSON files are valid JSON (no syntax errors)
- Check that file paths are correct
- Ensure all required data files are present

### Content Not Updating
- Verify files were copied to the correct location (`src/content/data/`)
- Check file timestamps to confirm files were updated
- Clear build cache: `rm -rf .output .nuxt node_modules/.cache`

### Missing Static Assets
- Verify assets exist in `src/public/`
- Check that assets are referenced correctly in components
- Ensure build output includes assets in `.output/public/`

