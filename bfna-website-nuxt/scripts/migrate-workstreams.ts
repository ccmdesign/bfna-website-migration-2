import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const sourceFile = resolve(rootDir, 'src/content/data/workstreams.json')
const targetDir = resolve(rootDir, 'src/content/workstreams')

// Navigation order mapping (based on current hardcoded navigation order)
const navigationOrder: Record<string, number> = {
  democracy: 1,
  'politics-society': 2,
  'future-leadership': 3,
  'digital-world': 4,
  archives: 5,
  podcasts: 6,
}

// Hero image dimensions mapping (from legacy Hero.vue component)
const heroDimensions: Record<string, { width: number; height: number }> = {
  default: { width: 1600, height: 1067 },
  democracy: { width: 1600, height: 1600 },
  'digital-world': { width: 1600, height: 1600 },
  'future-leadership': { width: 1600, height: 1066 },
  'politics-society': { width: 1600, height: 1600 },
  archives: { width: 1600, height: 1600 },
  updates: { width: 1600, height: 1586 },
  team: { width: 1600, height: 1600 },
  about: { width: 1600, height: 1600 },
  stiftung: { width: 1600, height: 774 },
}

// Hero image paths mapping (from legacy Hero.vue component)
const heroPaths: Record<string, { webp: string; fallback: string }> = {
  default: {
    webp: '/images/hero/homepage.webp',
    fallback: '/images/hero/homepage.jpg',
  },
  democracy: {
    webp: '/images/hero/democracy@2x.webp',
    fallback: '/images/hero/democracy@2x.jpg',
  },
  'digital-world': {
    webp: '/images/hero/digital-world@2x.webp',
    fallback: '/images/hero/digital-world.jpg',
  },
  'future-leadership': {
    webp: '/images/hero/future-leadership@2x.webp',
    fallback: '/images/hero/future-leadership@2x.jpg',
  },
  'politics-society': {
    webp: '/images/hero/politics-society@2x.webp',
    fallback: '/images/hero/politics-society@2x.jpg',
  },
  archives: {
    webp: '/images/hero/archives@2x.webp',
    fallback: '/images/hero/archives@2x.jpg',
  },
}

function transformImageToHero(
  image: { url: string; title?: string } | undefined,
  theme: string
): { webp: string; fallback: string; width: number; height: number } | undefined {
  if (!image) {
    // Use theme-based hero if available
    const themeHero = heroPaths[theme]
    const themeDims = heroDimensions[theme]
    if (themeHero && themeDims) {
      return {
        ...themeHero,
        ...themeDims,
      }
    }
    return undefined
  }

  // If image exists, try to extract dimensions from theme
  const dims = heroDimensions[theme] || heroDimensions.default
  const heroPathsForTheme = heroPaths[theme] || heroPaths.default

  // Use theme-based hero paths if available, otherwise use image.url for both
  return {
    webp: heroPathsForTheme?.webp || image.url,
    fallback: heroPathsForTheme?.fallback || image.url,
    width: dims.width,
    height: dims.height,
  }
}

function stripLegacyContent<T extends { updates_list?: Array<Record<string, unknown>> }>(
  workstream: T
): T {
  if (Array.isArray(workstream.updates_list)) {
    for (const entry of workstream.updates_list) {
      if (entry && typeof entry === 'object' && 'content' in entry) {
        delete (entry as Record<string, unknown>).content
      }
    }
  }
  return workstream
}

function migrateWorkstreams() {
  console.log('Reading workstreams.json...')
  const workstreamsData = JSON.parse(readFileSync(sourceFile, 'utf-8'))

  // Ensure target directory exists
  mkdirSync(targetDir, { recursive: true })

  console.log(`Found ${Object.keys(workstreamsData).length} workstreams`)

  for (const [slug, workstream] of Object.entries(workstreamsData)) {
    const workstreamData = stripLegacyContent(workstream as any)

    // Add slug field
    const migratedWorkstream = {
      ...workstreamData,
      slug,
    }

    // Add navigation_order if not present
    if (navigationOrder[slug] !== undefined) {
      migratedWorkstream.navigation_order = navigationOrder[slug]
    }

    // Add visible field (default to true for existing workstreams)
    if (migratedWorkstream.visible === undefined) {
      migratedWorkstream.visible = true
    }

    // Transform image to hero structure
    if (workstreamData.image) {
      const hero = transformImageToHero(workstreamData.image, workstreamData.theme || 'default')
      if (hero) {
        migratedWorkstream.hero = hero
        // Keep image field for backward compatibility during migration
        // migratedWorkstream.image = undefined
      }
    } else {
      // No image field, try to use theme-based hero
      const theme = workstreamData.theme || 'default'
      const hero = transformImageToHero(undefined, theme)
      if (hero) {
        migratedWorkstream.hero = hero
      }
    }

    // Write individual file
    const targetFile = resolve(targetDir, `${slug}.json`)
    writeFileSync(targetFile, JSON.stringify(migratedWorkstream, null, 2) + '\n')
    console.log(`✓ Migrated ${slug} → ${targetFile}`)
  }

  console.log('\nMigration complete!')
  console.log(`Created ${Object.keys(workstreamsData).length} workstream files in ${targetDir}`)
}

migrateWorkstreams()
