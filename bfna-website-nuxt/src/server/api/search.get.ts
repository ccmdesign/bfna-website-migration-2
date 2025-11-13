import { readFileSync } from 'fs'
import { join } from 'path'
import type { SearchIndex, SearchIndexItem } from '~/types/search'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = (query.term as string)?.trim() || ''

  // If term is empty after trimming, return empty results
  if (!term) {
    return []
  }

  try {
    // Load search index from public directory
    const rootDir = process.cwd()
    const searchIndexPath = join(rootDir, 'public', 'search.json')

    let searchIndex: SearchIndex
    try {
      const fileContent = readFileSync(searchIndexPath, 'utf-8')
      searchIndex = JSON.parse(fileContent)
    } catch (error) {
      // Log error server-side but return empty results
      console.error('Error loading search index:', error)
      return []
    }

    if (!searchIndex?.search || !Array.isArray(searchIndex.search)) {
      console.error('Search index is invalid or empty')
      return []
    }

    // Perform case-insensitive substring matching
    const searchTerm = term.toLowerCase()
    const matchingItems = searchIndex.search.filter((item: SearchIndexItem) => {
      // Filter out items with empty/null/missing URLs
      if (!item.url) {
        return false
      }

      // Perform substring matching on searchable text field
      const searchableText = item.text?.toLowerCase() || ''
      return searchableText.includes(searchTerm)
    })

    // Transform to result format matching legacy API
    const results = matchingItems.map((item: SearchIndexItem) => ({
      item: {
        url: item.url,
        heading: item.heading,
        subheading: item.subheading || null,
        excerpt: item.excerpt || null,
        theme: item.theme || null,
      },
    }))

    return results
  } catch (error) {
    // Log error server-side but return empty results
    console.error('Error processing search:', error)
    return []
  }
})

