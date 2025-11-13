import { computed } from 'vue'
import { useWorkstream } from './useWorkstream'

/**
 * Composable for generating navigation items from workstream data
 * Filters by visibility and sorts by navigation_order
 */
export function useWorkstreamNavigation() {
  const { data: workstreams, pending, error } = useWorkstream()

  const items = computed(() => {
    // Handle error or undefined data gracefully
    if (error.value) {
      console.warn('Error loading workstreams for navigation:', error.value)
      return []
    }
    
    if (!workstreams.value || !Array.isArray(workstreams.value)) {
      return []
    }

    // Filter where visible !== false (treats undefined as visible)
    const visibleWorkstreams = workstreams.value.filter(
      (ws) => ws.visible !== false
    )

    // Sort by navigation_order (ascending), then alphabetically by heading
    const sorted = visibleWorkstreams.sort((a, b) => {
      const orderA = a.navigation_order ?? Infinity
      const orderB = b.navigation_order ?? Infinity

      if (orderA !== orderB) {
        return orderA - orderB
      }

      // If navigation_order is the same or both undefined, sort alphabetically
      return (a.heading || '').localeCompare(b.heading || '')
    })

    // Generate navigation items with derived fields
    return sorted.map((workstream) => ({
      name: workstream.heading,
      link: `/workstreams/${workstream.slug}`,
      cssClass: `frame-nav--${workstream.slug}`,
      order: workstream.navigation_order ?? 0,
      visible: workstream.visible !== false,
    }))
  })

  return {
    items,
    pending,
    error,
  }
}

