import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Video, VideoUpdate, VideoHomepageUpdate } from '~/types/directus'

interface VideosData {
  items: Video[]
  updates: VideoUpdate[]
  homePageUpdates: VideoHomepageUpdate[]
}

export const useVideos = () => {
  return useAsyncData('videos', async () => {
    const cacheKey = 'directus:videos'
    const cached = getCachedData<VideosData>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<VideosData>(
      async () => {
        const [items, updates, homePageUpdates] = await Promise.all([
          directus.items('videos').readByQuery({ limit: -1 }),
          directus.items('video_updates').readByQuery({ limit: -1 }),
          directus.items('video_homepage_updates').readByQuery({ limit: -1 }),
        ])
        
        return {
          items: items.data || [],
          updates: updates.data || [],
          homePageUpdates: homePageUpdates.data || [],
        }
      },
      '~/content/data/videos.json',
      'videos'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

