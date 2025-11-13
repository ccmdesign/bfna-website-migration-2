import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Workstream } from '~/types/directus'

/**
 * Composable for fetching workstream data using Directus
 * @param slug - Optional workstream slug. If omitted, returns all workstreams.
 * @returns Reactive workstream data, loading state, and error state
 */
export function useWorkstream(slug?: string) {
  const key = slug ? `workstream-${slug}` : 'workstreams-all'

  const { data, pending, error, refresh } = useAsyncData(key, async () => {
    if (slug) {
      const cacheKey = `directus:workstream:${slug}`
      const cached = getCachedData<Workstream | null>(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      const data = await fetchWithFallback<Workstream | null>(
        async () => {
          const response = await directus.items('workstreams').readByQuery({
            filter: {
              slug: {
                _eq: slug,
              },
            },
            limit: 1,
          })
          return response.data?.[0] || null
        },
        '~/content/data/workstreams.json',
        `workstream-${slug}`
      ).then((workstreamsData) => {
        // If fallback was used, extract the specific workstream
        if (typeof workstreamsData === 'object' && workstreamsData !== null && !('id' in workstreamsData)) {
          return (workstreamsData as Record<string, Workstream>)[slug] || null
        }
        return workstreamsData as Workstream | null
      })
      
      setCachedData(cacheKey, data)
      return data
    } else {
      const cacheKey = 'directus:workstreams:all'
      const cached = getCachedData<Workstream[]>(cacheKey)
      if (cached) {
        return cached
      }
      
      const data = await fetchWithFallback<Workstream[]>(
        async () => {
          const response = await directus.items('workstreams').readByQuery({
            limit: -1,
          })
          return response.data || []
        },
        '~/content/data/workstreams.json',
        'workstreams'
      ).then((workstreamsData) => {
        // If fallback was used, convert object to array
        if (typeof workstreamsData === 'object' && workstreamsData !== null && !Array.isArray(workstreamsData)) {
          return Object.values(workstreamsData as Record<string, Workstream>)
        }
        return workstreamsData as Workstream[]
      })
      
      setCachedData(cacheKey, data)
      return data
    }
  })

  return {
    data,
    pending,
    error,
    refresh,
  }
}

