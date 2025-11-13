import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Podcast, PodcastHomepageUpdate } from '~/types/directus'

interface PodcastsData {
  items: Podcast[]
  homePageUpdates: PodcastHomepageUpdate[]
}

export const usePodcasts = () => {
  return useAsyncData('podcasts', async () => {
    const cacheKey = 'directus:podcasts'
    const cached = getCachedData<PodcastsData>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<PodcastsData>(
      async () => {
        const [items, homePageUpdates] = await Promise.all([
          directus.items('podcasts').readByQuery({ limit: -1 }),
          directus.items('podcast_homepage_updates').readByQuery({ limit: -1 }),
        ])
        
        return {
          items: items.data || [],
          homePageUpdates: homePageUpdates.data || [],
        }
      },
      '~/content/data/podcasts.json',
      'podcasts'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

