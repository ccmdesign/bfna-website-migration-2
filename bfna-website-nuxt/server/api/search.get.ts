interface SearchApiRelatedItem {
  id: string
  heading: string
  type?: string
  theme?: string
  slug?: string
  url?: string
  // why the API linked it, e.g. "Similar topic" or "Shared: Hungary"
  reason?: string
}

interface SearchApiItem {
  id: string
  collection: string
  type?: string
  heading: string
  subheading?: string
  excerpt?: string
  theme?: string
  slug?: string
  url?: string
  related?: SearchApiRelatedItem[]
}

interface SearchApiResult {
  item: SearchApiItem
  score?: number
  relevance?: number
}

interface SearchApiResponse {
  total: number
  results: SearchApiResult[]
  // matches that fall below the API's relevance threshold
  weaker?: SearchApiResult[]
  min_relevance?: number
}

// the API caps results + weaker at 25 combined
const SEARCH_LIMIT = 25

const EMPTY_RESPONSE = { results: [], weaker: [], minRelevance: null }

// the API returns absolute URLs for external content (docs, podcasts)
// and site-relative URLs for internal pages
const getItemUrl = (item: SearchApiItem | SearchApiRelatedItem) => {
  if (item.url) return item.url
  if (item.theme && item.slug) return `/${item.theme}/${item.slug}`
  return ''
}

// Transform to result format matching legacy API
const toSearchResults = (matches: SearchApiResult[] = []) =>
  matches
    .map(({ item }) => ({
      item: {
        url: getItemUrl(item),
        heading: item.heading,
        subheading: item.subheading || null,
        excerpt: item.excerpt || null,
        theme: item.theme || null,
        type: item.type || null,
        related: (item.related || [])
          .map((related) => ({
            url: getItemUrl(related),
            heading: related.heading,
            type: related.type || null,
            theme: related.theme || null,
            reason: related.reason || null,
          }))
          .filter((related) => related.url),
      },
    }))
    .filter(({ item }) => item.url)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = (query.term as string)?.trim() || ''

  // If term is empty after trimming, return empty results
  if (!term) {
    return EMPTY_RESPONSE
  }

  // Get base URL from environment variable
  const baseUrl = process.env.SEARCH_BASE_URL
  if (!baseUrl) {
    console.error('SEARCH_BASE_URL environment variable is not set')
    return EMPTY_RESPONSE
  }

  try {
    const response = await $fetch<SearchApiResponse>(baseUrl, {
      query: { term, format: 'full', limit: SEARCH_LIMIT },
      timeout: 10000,
    })

    // relevant matches and those below the relevance threshold are kept
    // apart so the page can show the weaker ones on demand
    return {
      results: toSearchResults(response?.results),
      weaker: toSearchResults(response?.weaker),
      minRelevance: response?.min_relevance ?? null,
    }
  } catch (error) {
    console.error('Error fetching search results:', error)
    return EMPTY_RESPONSE
  }
})
