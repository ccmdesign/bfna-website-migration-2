interface SearchIndexItem {
  item: {
    url: string
    heading: string
    subheading?: string
    excerpt?: string
    theme?: string
    slug?: string
    type?: string
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = (query.term as string)?.trim() || ''

  // If term is empty after trimming, return empty results
  if (!term) {
    return []
  }

  try {
    // Get base URL from environment variable
    const baseUrl = process.env.SEARCH_BASE_URL
    if (!baseUrl) {
      console.error('SEARCH_BASE_URL environment variable is not set')
      return []
    }

    // Fetch filtered results from API
    try {
      const response = await fetch(`${baseUrl}?term=${encodeURIComponent(term)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch search results: ${response.status}`)
      }
      
      const results: SearchIndexItem[] = await response.json()

      // Transform to result format matching legacy API
      return results.map((content) => {
        const resultcontent = {
          url: `/${content.item.theme}/${content.item.slug}`,
          heading: content.item.heading,
          subheading: content.item.subheading || null,
          excerpt: content.item.excerpt || null,
          theme: content.item.theme || null,
          type: content.item.type || null,
        }
        return { item: resultcontent }
      })

    } catch (error) {
      console.error('Error fetching search results:', error)
      return []
    }
  } catch (error) {
    console.error('Error processing search:', error)
    return []
  }
})
