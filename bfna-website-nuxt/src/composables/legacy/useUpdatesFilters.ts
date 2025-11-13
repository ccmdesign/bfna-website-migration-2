const FILTERS_STORAGE_KEY = 'updates-filters'
const CONTENT_TYPES_WITH_FILTERS = ['publications', 'videos', 'infographics']

// Shared state across all instances
const activeFilters = ref<Record<string, string[]>>({})
let initialized = false

/**
 * Composable for managing filter state for updates page with sessionStorage persistence
 * Extends useCardFilters pattern but supports per-content-type filters
 */
export function useUpdatesFilters() {

  /**
   * Load filters from sessionStorage on initialization
   * Resets to defaults if corrupted or unavailable
   */
  const initializeFilters = () => {
    if (!process.client) {
      return
    }

    try {
      const stored = sessionStorage.getItem(FILTERS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate structure
        if (typeof parsed === 'object' && parsed !== null) {
          // Ensure all values are arrays
          const validated: Record<string, string[]> = {}
          for (const [key, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
              validated[key] = value
            }
          }
          activeFilters.value = validated
          return
        }
      }
    } catch (error) {
      // Reset to defaults on error
      console.warn('Failed to load filter state from sessionStorage:', error)
    }

    // Default: empty object (no filters applied)
    activeFilters.value = {}
  }

  /**
   * Set a filter value for a content type
   */
  const setFilter = (contentType: string, value: string) => {
    if (!activeFilters.value[contentType]) {
      activeFilters.value[contentType] = []
    }

    if (!activeFilters.value[contentType].includes(value)) {
      activeFilters.value[contentType].push(value)
      persistFilters()
    }
  }

  /**
   * Clear a filter value for a content type
   */
  const clearFilter = (contentType: string, value: string) => {
    if (activeFilters.value[contentType]) {
      activeFilters.value[contentType] = activeFilters.value[contentType].filter(
        (v) => v !== value
      )

      // Remove empty arrays
      if (activeFilters.value[contentType].length === 0) {
        delete activeFilters.value[contentType]
      }

      persistFilters()
    }
  }

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    activeFilters.value = {}
    persistFilters()
  }

  /**
   * Persist filters to sessionStorage
   */
  const persistFilters = () => {
    if (!process.client) {
      return
    }

    try {
      if (Object.keys(activeFilters.value).length > 0) {
        sessionStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify(activeFilters.value)
        )
      } else {
        sessionStorage.removeItem(FILTERS_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Failed to persist filter state to sessionStorage:', error)
    }
  }

  /**
   * Determine if a card should be displayed based on filters
   * @param theme - Card theme/workstream identifier
   * @param index - Card index (for limiting display)
   * @param contentType - Content type (publications, videos, infographics, podcasts)
   * @returns true if card should be shown
   */
  const shouldShowCard = (
    theme: string | undefined,
    index: number,
    contentType: string
  ): boolean => {
    // Podcasts don't have filters, always show
    if (contentType === 'podcasts') {
      return true
    }

    // If content type doesn't support filters, always show
    if (!CONTENT_TYPES_WITH_FILTERS.includes(contentType)) {
      return true
    }

    // Get filters for this content type
    const filters = activeFilters.value[contentType] || []

    // If no filters applied, show all cards
    if (filters.length === 0) {
      return true
    }

    // If theme matches any filter, show card
    if (theme && filters.includes(theme)) {
      return true
    }

    // Otherwise, hide card
    return false
  }

  // Initialize filters on mount (only once)
  if (process.client && !initialized) {
    initializeFilters()
    initialized = true
  }

  return {
    activeFilters: readonly(activeFilters),
    setFilter,
    clearFilter,
    clearAllFilters,
    shouldShowCard,
    initializeFilters,
  }
}

