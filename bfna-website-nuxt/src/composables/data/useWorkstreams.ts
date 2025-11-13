import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Workstream } from '~/types/directus'

/**
 * Composable for fetching all workstreams using Directus
 * Returns data in object format keyed by slug for backward compatibility with legacy pages
 * @returns Reactive workstreams data object, loading state, and error state
 */
export const useWorkstreams = () => {
  return useAsyncData('workstreams', async () => {
    const cacheKey = 'directus:workstreams'
    const cached = getCachedData<Record<string, Workstream>>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<Record<string, Workstream>>(
      async () => {
        const response = await directus.items('workstreams').readByQuery({
          limit: -1,
        })
        
        // Transform array to object keyed by slug
        const workstreamsObject: Record<string, Workstream> = {}
        for (const workstream of response.data || []) {
          if (workstream.slug) {
            workstreamsObject[workstream.slug] = workstream
          }
        }
        
        return workstreamsObject
      },
      '~/content/data/workstreams.json',
      'workstreams'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

