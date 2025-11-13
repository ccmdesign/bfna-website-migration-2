const FILTERS_NAME = 'cardFilter'
const MAX_SHOWN_CARDS = 6
const WORKSTREAM_LIST = [
  'democracy',
  'future-leadership',
  'digital-world',
  'politics-society',
  'podcasts',
]

export const useCardFilters = () => {
  const activeFilters = ref<string[]>([])

  const getActiveFilters = (): string[] => {
    if (process.client) {
      const stored = sessionStorage.getItem(FILTERS_NAME)
      return stored ? JSON.parse(stored) : []
    }
    return []
  }

  const setActiveFilters = (filters: string[]) => {
    activeFilters.value = filters
    if (process.client) {
      if (filters.length > 0) {
        sessionStorage.setItem(FILTERS_NAME, JSON.stringify(filters))
      } else {
        sessionStorage.removeItem(FILTERS_NAME)
      }
    }
  }

  const addFilter = (workstream: string) => {
    const filters = [...activeFilters.value]
    if (!filters.includes(workstream)) {
      filters.push(workstream)
      setActiveFilters(filters)
    }
  }

  const removeFilter = (workstream: string) => {
    const filters = activeFilters.value.filter((x) => x !== workstream)
    setActiveFilters(filters)
  }

  const cleanFilters = () => {
    setActiveFilters([])
  }

  const isWorkstreamInFilters = (workstream: string | undefined): boolean => {
    if (!workstream) return true
    return activeFilters.value.length === 0 || activeFilters.value.includes(workstream)
  }

  const getWorkstreams = (): string[] => {
    const filters = getActiveFilters()
    return filters && filters.length > 0 ? filters : WORKSTREAM_LIST
  }

  const initializeFilters = () => {
    if (process.client) {
      activeFilters.value = getActiveFilters()
    }
  }

  const shouldShowCard = (
    cardWorkstream: string | undefined,
    cardIndex: number,
    unlimitShown = false
  ): boolean => {
    if (!isWorkstreamInFilters(cardWorkstream)) {
      return false
    }
    if (unlimitShown) {
      return true
    }
    return cardIndex < MAX_SHOWN_CARDS
  }

  return {
    activeFilters: readonly(activeFilters),
    addFilter,
    removeFilter,
    cleanFilters,
    isWorkstreamInFilters,
    getWorkstreams,
    initializeFilters,
    shouldShowCard,
    MAX_SHOWN_CARDS,
  }
}

