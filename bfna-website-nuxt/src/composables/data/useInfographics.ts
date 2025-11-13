import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Infographic, InfographicHomepageUpdate } from '~/types/directus'

interface InfographicsData {
  items: Infographic[]
  homePageUpdates: InfographicHomepageUpdate[]
}

export const useInfographics = () => {
  return useAsyncData('infographics', async () => {
    const cacheKey = 'directus:infographics'
    const cached = getCachedData<InfographicsData>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<InfographicsData>(
      async () => {
        const [items, homePageUpdates] = await Promise.all([
          directus.items('infographics').readByQuery({ limit: -1 }),
          directus.items('infographic_homepage_updates').readByQuery({ limit: -1 }),
        ])
        
        return {
          items: items.data || [],
          homePageUpdates: homePageUpdates.data || [],
        }
      },
      '~/content/data/infographics.json',
      'infographics'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

