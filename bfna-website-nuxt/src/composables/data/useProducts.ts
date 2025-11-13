import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Product } from '~/types/directus'

export const useProducts = () => {
  return useAsyncData('products', async () => {
    const cacheKey = 'directus:products'
    const cached = getCachedData<Product[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<Product[]>(
      async () => {
        const response = await directus.items('products').readByQuery({
          limit: -1,
        })
        return response.data || []
      },
      '~/content/data/products.json',
      'products'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

