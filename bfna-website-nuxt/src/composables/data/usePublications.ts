import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Publication, PublicationUpdate, PublicationHomepageUpdate } from '~/types/directus'

interface PublicationsData {
  items: Publication[]
  updates: PublicationUpdate[]
  homePageUpdates: PublicationHomepageUpdate[]
}

export const usePublications = () => {
  return useAsyncData('publications', async () => {
    const cacheKey = 'directus:publications'
    const cached = getCachedData<PublicationsData>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<PublicationsData>(
      async () => {
        const [items, updates, homePageUpdates] = await Promise.all([
          directus.items('publications').readByQuery({ limit: -1 }),
          directus.items('publication_updates').readByQuery({ limit: -1 }),
          directus.items('publication_homepage_updates').readByQuery({ limit: -1 }),
        ])
        
        return {
          items: items.data || [],
          updates: updates.data || [],
          homePageUpdates: homePageUpdates.data || [],
        }
      },
      '~/content/data/publications.json',
      'publications'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

