import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { SearchIndex, SearchIndexItem } from '../src/types/search'
import { cleanExcerpt, squashSearchText } from '../src/utils/search-text'
import { normalizeUrl } from '../src/utils/url-normalize'

interface PublicationItem {
  brow: string
  theme: string | null
  excerpt: string
  subheading: string | null
  by_line: string | null
  heading: string
  content: string
  button: {
    url: string
    label: string | null
  }
}

interface VideoItem {
  brow: string
  theme: string | null
  heading: string
  subheading?: string | null
  content: string
  by_line: string | null
  button: {
    url: string
    label: string | null
  }
}

interface InfographicItem {
  brow: string
  theme: string | null
  heading: string
  subheading?: string | null
  content: string
  by_line: string | null
  button: {
    url: string
    label: string | null
  }
}

interface PublicationsData {
  items: PublicationItem[]
}

interface VideosData {
  items: VideoItem[]
}

interface InfographicsData {
  items: InfographicItem[]
}

function processPublicationItem(item: PublicationItem): SearchIndexItem | null {
  const buttonUrl = item.button?.url
  if (!buttonUrl) return null

  const normalizedUrl = normalizeUrl(buttonUrl)
  if (!normalizedUrl) return null

  const excerpt = cleanExcerpt(item.excerpt || '')
  const searchableText = squashSearchText(
    item.brow || '',
    item.heading || '',
    item.subheading || null,
    item.content || '',
    item.by_line || null
  )

  return {
    brow: item.brow || '',
    theme: item.theme || null,
    excerpt,
    subheading: item.subheading || null,
    by_line: item.by_line || null,
    heading: item.heading || '',
    button_url: buttonUrl,
    button_label: item.button?.label || null,
    text: searchableText,
    url: normalizedUrl,
  }
}

function processVideoItem(item: VideoItem): SearchIndexItem | null {
  const buttonUrl = item.button?.url
  if (!buttonUrl) return null

  const normalizedUrl = normalizeUrl(buttonUrl)
  if (!normalizedUrl) return null

  // Videos don't have excerpt field, use empty string
  const excerpt = ''
  const searchableText = squashSearchText(
    item.brow || '',
    item.heading || '',
    item.subheading || null,
    item.content || '',
    item.by_line || null
  )

  return {
    brow: item.brow || '',
    theme: item.theme || null,
    excerpt,
    subheading: item.subheading || null,
    by_line: item.by_line || null,
    heading: item.heading || '',
    button_url: buttonUrl,
    button_label: item.button?.label || null,
    text: searchableText,
    url: normalizedUrl,
  }
}

function processInfographicItem(item: InfographicItem): SearchIndexItem | null {
  const buttonUrl = item.button?.url
  if (!buttonUrl) return null

  const normalizedUrl = normalizeUrl(buttonUrl)
  if (!normalizedUrl) return null

  // Infographics don't have excerpt field, use empty string
  const excerpt = ''
  const searchableText = squashSearchText(
    item.brow || '',
    item.heading || '',
    item.subheading || null,
    item.content || '',
    item.by_line || null
  )

  return {
    brow: item.brow || '',
    theme: item.theme || null,
    excerpt,
    subheading: item.subheading || null,
    by_line: item.by_line || null,
    heading: item.heading || '',
    button_url: buttonUrl,
    button_label: item.button?.label || null,
    text: searchableText,
    url: normalizedUrl,
  }
}

function generateSearchIndex(): void {
  const rootDir = join(__dirname, '..')
  const dataDir = join(rootDir, 'src', 'content', 'data')
  const outputPath = join(rootDir, 'public', 'search.json')

  console.log('Reading source data files...')

  // Read source data files
  const publicationsPath = join(dataDir, 'publications.json')
  const videosPath = join(dataDir, 'videos.json')
  const infographicsPath = join(dataDir, 'infographics.json')

  let publicationsData: PublicationsData
  let videosData: VideosData
  let infographicsData: InfographicsData

  try {
    publicationsData = JSON.parse(readFileSync(publicationsPath, 'utf-8'))
  } catch (error) {
    console.error(`Error reading publications.json: ${error}`)
    throw error
  }

  try {
    videosData = JSON.parse(readFileSync(videosPath, 'utf-8'))
  } catch (error) {
    console.error(`Error reading videos.json: ${error}`)
    throw error
  }

  try {
    infographicsData = JSON.parse(readFileSync(infographicsPath, 'utf-8'))
  } catch (error) {
    console.error(`Error reading infographics.json: ${error}`)
    throw error
  }

  console.log(`Processing ${publicationsData.items?.length || 0} publications...`)
  console.log(`Processing ${videosData.items?.length || 0} videos...`)
  console.log(`Processing ${infographicsData.items?.length || 0} infographics...`)

  // Process all items
  const searchItems: SearchIndexItem[] = []

  // Process publications
  if (publicationsData.items) {
    for (const item of publicationsData.items) {
      const processed = processPublicationItem(item)
      if (processed) {
        searchItems.push(processed)
      }
    }
  }

  // Process videos
  if (videosData.items) {
    for (const item of videosData.items) {
      const processed = processVideoItem(item)
      if (processed) {
        searchItems.push(processed)
      }
    }
  }

  // Process infographics
  if (infographicsData.items) {
    for (const item of infographicsData.items) {
      const processed = processInfographicItem(item)
      if (processed) {
        searchItems.push(processed)
      }
    }
  }

  // Create search index object matching legacy format
  const searchIndex: SearchIndex = {
    search: searchItems,
  }

  // Write output file
  console.log(`Writing search index with ${searchItems.length} items to ${outputPath}...`)
  writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2), 'utf-8')

  console.log('Search index generation complete!')
  console.log(`Total items: ${searchItems.length}`)
}

// Run the script
try {
  generateSearchIndex()
} catch (error) {
  console.error('Error generating search index:', error)
  process.exit(1)
}

