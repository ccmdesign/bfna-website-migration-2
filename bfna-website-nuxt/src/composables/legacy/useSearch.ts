import { useDebounceFn } from '@vueuse/core'

export interface SearchResult {
  item: {
    url: string
    heading: string
    subheading?: string
    excerpt?: string
    theme?: string
  }
}

export interface SearchCard {
  url: string
  heading: string
  subheading?: string
  excerpt?: string
  theme?: string
}

const getSearchData = async (term: string): Promise<SearchResult[]> => {
  // Trim whitespace from search term
  const trimmedTerm = term.trim()
  
  // Handle empty queries by returning zero results without API call
  if (!trimmedTerm) {
    return []
  }
  
  try {
    const res = await fetch(`/api/search?term=${encodeURIComponent(trimmedTerm)}`)
    if (!res.ok) {
      throw new Error(`Search API error: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    // Log error in dev mode
    if (process.dev) {
      console.error('Search error:', error)
    }
    // Return empty results on error
    return []
  }
}

export const useSearch = () => {
  const query = ref('')
  const results = ref<SearchCard[]>([])
  const resultCount = ref(0)
  const isLoading = ref(false)

  const performSearch = async (searchTerm: string) => {
    // Trim whitespace from search query before processing
    const trimmedTerm = searchTerm.trim()
    
    // Handle empty queries by returning zero results without API call
    if (!trimmedTerm) {
      results.value = []
      resultCount.value = 0
      return
    }

    isLoading.value = true
    try {
      const data = await getSearchData(trimmedTerm)
      const filtered = data
        .filter((result) => Boolean(result.item.url))
        .map(({ item }) => item)
      
      results.value = filtered
      resultCount.value = filtered.length
    } catch (error) {
      // Log error in dev mode
      if (process.dev) {
        console.error('Search error:', error)
      }
      // Show empty results on error
      results.value = []
      resultCount.value = 0
    } finally {
      isLoading.value = false
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
    resultCount,
    isLoading,
    performSearch: debouncedSearch,
    initializeFromStorage,
  }
}

