import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

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

export interface SearchResult {
  item: SearchCard
}

export interface SearchResponse {
  // matches at or above the API's relevance threshold
  results: SearchResult[]
  // matches below the threshold, shown on demand
  weaker: SearchResult[]
  minRelevance: number | null
}

const EMPTY_RESPONSE: SearchResponse = { results: [], weaker: [], minRelevance: null }

const getSearchData = async (term: string): Promise<SearchResponse> => {
  // Trim whitespace from search term
  const trimmedTerm = term.trim()

  // Handle empty queries by returning zero results without API call
  if (!trimmedTerm) {
    return EMPTY_RESPONSE
  }

  try {
    const res = await fetch(`/api/search?term=${encodeURIComponent(trimmedTerm)}`)


    if (!res.ok) {
      throw new Error(`Search API error: ${res.status}`)
    }
    const data = await res.json()

    return {
      results: data?.results || [],
      weaker: data?.weaker || [],
      minRelevance: data?.minRelevance ?? null,
    }

  } catch (error) {
    // Log error in dev mode
    if (process.dev) {
      console.error('Search error:', error)
    }
    // Return empty results on error
    return EMPTY_RESPONSE
  }
}

const toCards = (results: SearchResult[]) =>
  results
    .filter((result) => Boolean(result.item?.url))
    .map(({ item }) => item)

export const useSearch = () => {
  const query = ref('')
  const results = ref<SearchCard[]>([])
  const weakerResults = ref<SearchCard[]>([])
  const minRelevance = ref<number | null>(null)
  const showWeaker = ref(false)
  const isLoading = ref(false)
  // true once a non-empty search has returned, to drive the empty-state messages
  const hasSearched = ref(false)

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
    results.value = toCards(response.results)
    weakerResults.value = toCards(response.weaker)
    minRelevance.value = response.minRelevance
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
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const data = await getSearchData(trimmedTerm)
      if (searchId !== latestSearchId) return

      setResponse(data, trimmedTerm)
      hasSearched.value = true
    } catch (error) {
      if (searchId !== latestSearchId) return

      // Log error in dev mode
      if (process.dev) {
        console.error('Search error:', error)
      }
      // Show empty results on error
      setResponse(EMPTY_RESPONSE, trimmedTerm)
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
    if (process.client) {
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
    minRelevance,
    showWeaker,
    toggleWeaker,
    resultCount,
    hiddenCount,
    isLoading,
    hasSearched,
    performSearch: debouncedSearch,
    initializeFromStorage,
  }
}

