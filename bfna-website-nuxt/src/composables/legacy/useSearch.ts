import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useRuntimeConfig } from '#imports'

export interface SearchRelatedItem {
  url: string
  heading: string
  type?: string
  theme?: string
  reason?: string
}

export interface SearchCard {
  url: string
  heading: string
  subheading?: string
  excerpt?: string
  theme?: string
  type?: string
  related?: SearchRelatedItem[]
}

export interface SearchResponse {
  // matches at or above the API's relevance threshold
  results: SearchCard[]
  // matches below the threshold, shown on demand
  weaker: SearchCard[]
}

// Shape returned by the search API (SEARCH_BASE_URL, /search-enhanced)
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
  weaker?: SearchApiResult[]
  min_relevance?: number
}

// the API caps results + weaker at 25 combined
const SEARCH_LIMIT = 25
const SEARCH_TIMEOUT_MS = 10000

const EMPTY_RESPONSE: SearchResponse = { results: [], weaker: [] }

// the API returns absolute URLs for external content (docs, podcasts)
// and site-relative URLs for internal pages
const getItemUrl = (item: SearchApiItem | SearchApiRelatedItem) => {
  if (item.url) return item.url
  if (item.theme && item.slug) return `/${item.theme}/${item.slug}`
  return ''
}

const toCards = (matches: SearchApiResult[] = []): SearchCard[] =>
  matches
    .map(({ item }) => ({
      url: getItemUrl(item),
      heading: item.heading,
      subheading: item.subheading,
      excerpt: item.excerpt,
      theme: item.theme,
      type: item.type,
      related: (item.related || [])
        .map((related) => ({
          url: getItemUrl(related),
          heading: related.heading,
          type: related.type,
          theme: related.theme,
          reason: related.reason,
        }))
        .filter((related) => related.url),
    }))
    .filter((card) => card.url)

// Calls the search API directly from the browser; the site is deployed
// statically, so there is no server route to proxy through.
// Throws on failure so the page can tell an outage apart from "no results".
const getSearchData = async (apiUrl: string, term: string): Promise<SearchResponse> => {
  if (!apiUrl) {
    throw new Error('Search API URL is not configured (NUXT_PUBLIC_SEARCH_API_URL / SEARCH_BASE_URL)')
  }

  const params = new URLSearchParams({ term, format: 'full', limit: String(SEARCH_LIMIT) })
  const res = await fetch(`${apiUrl}?${params}`, {
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Search API error: ${res.status}`)
  }
  const data: SearchApiResponse = await res.json()

  return {
    results: toCards(data?.results),
    weaker: toCards(data?.weaker),
  }
}

export interface UseSearchOptions {
  // defaults to runtimeConfig.public.searchApiUrl
  apiUrl?: string
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const apiUrl = options.apiUrl ?? (useRuntimeConfig().public.searchApiUrl as string)

  const query = ref('')
  const results = ref<SearchCard[]>([])
  const weakerResults = ref<SearchCard[]>([])
  const showWeaker = ref(false)
  const isLoading = ref(false)
  // true once a non-empty search has returned, to drive the empty-state messages
  const hasSearched = ref(false)
  // true when the last search failed, so the page can say so instead of "no results"
  const hasError = ref(false)

  // relevant results first, then the weaker ones when expanded
  const visibleResults = computed(() =>
    showWeaker.value ? [...results.value, ...weakerResults.value] : results.value
  )

  // count of results currently on screen, so the header always matches the list
  const resultCount = computed(() => visibleResults.value.length)

  // less relevant results still hidden behind "Show more"
  const hiddenCount = computed(() => (showWeaker.value ? 0 : weakerResults.value.length))

  // term of the results on screen; re-running the same term keeps the
  // "Show more" state so a repeat search can't collapse an open list
  let displayedTerm = ''

  const setResponse = (response: SearchResponse, term: string) => {
    results.value = response.results
    weakerResults.value = response.weaker
    // every new search starts collapsed
    if (term !== displayedTerm) {
      showWeaker.value = false
    }
    displayedTerm = term
  }

  const toggleWeaker = () => {
    showWeaker.value = !showWeaker.value
  }

  // Id of the most recent search; responses from older searches are ignored
  // so a slow earlier request can't overwrite newer results
  let latestSearchId = 0

  const performSearch = async (searchTerm: string) => {
    const searchId = ++latestSearchId

    // Trim whitespace from search query before processing
    const trimmedTerm = searchTerm.trim()

    // Handle empty queries by returning zero results without API call
    if (!trimmedTerm) {
      setResponse(EMPTY_RESPONSE, '')
      hasSearched.value = false
      hasError.value = false
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const data = await getSearchData(apiUrl, trimmedTerm)
      if (searchId !== latestSearchId) return

      setResponse(data, trimmedTerm)
      hasError.value = false
      hasSearched.value = true
    } catch (error) {
      if (searchId !== latestSearchId) return

      // Log error in dev mode
      if (import.meta.dev) {
        console.error('Search error:', error)
      }
      setResponse(EMPTY_RESPONSE, trimmedTerm)
      hasError.value = true
      hasSearched.value = true
    } finally {
      // leave the loading state to the newer search if one is in flight
      if (searchId === latestSearchId) {
        isLoading.value = false
      }
    }
  }

  // Fix debounce timing from 300ms to 550ms using VueUse useDebounceFn
  const debouncedSearch = useDebounceFn(performSearch, 550)

  watch(query, (newQuery) => {
    debouncedSearch(newQuery)
  })

  const initializeFromStorage = () => {
    if (import.meta.client) {
      const storedQuery = localStorage.getItem('bfna-search')
      if (storedQuery) {
        query.value = storedQuery
        localStorage.removeItem('bfna-search')
        performSearch(storedQuery)
      }
    }
  }

  return {
    query,
    results,
    weakerResults,
    visibleResults,
    showWeaker,
    toggleWeaker,
    resultCount,
    hiddenCount,
    isLoading,
    hasSearched,
    hasError,
    performSearch: debouncedSearch,
    initializeFromStorage,
  }
}
