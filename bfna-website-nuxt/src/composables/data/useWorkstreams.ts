const __getUpdatesVideos = async (key: string) => {
  const videos = await queryCollection('videos')
    .where('theme', '=', key)
    .limit(9)
    .order('date', 'DESC')
    .all()

  if (!videos) return []

  // Spread meta fields back to the top level
  return videos.map((video) => {
    if (video.meta) {
      return {
        ...video,
        ...video.meta,
        type: 'video'
      }
    }
    return { ...video, type: 'video' }
  })
}

const __getPublications = async (key: string) => {
  const publications = await queryCollection('publications')
    .where('theme', '=', key)
    .limit(9)
    .order('date', 'DESC')
    .all()

  if (!publications) return []

  // Spread meta fields back to the top level
  return publications.map((publication) => {
    if (publication.meta) {
      return {
        ...publication,
        ...publication.meta,
        type: 'publication'
      }
    }
    return { ...publication, type: 'publication' }
  })
}

const __getInfographics = async (key: string) => {
  const infographics = await queryCollection('infographics')
    .where('theme', '=', key)
    .limit(9)
    .order('date', 'DESC')
    .all()

  if (!infographics) return []

  // Spread meta fields back to the top level
  return infographics.map((infographic) => {
    if (infographic.meta) {
      return {
        ...infographic,
        ...infographic.meta,
        type: 'infographic'
      }
    }
    return { ...infographic, type: 'infographic' }
  })
}

const compare = (a:any, b:any) => {
  if (a.publishDate > b.publishDate) {
    return -1;
  }
  if (a.publishDate < b.publishDate) {
    return 1;
  }
  return 0;
}

const getWorkstreamUpdates = async (key: string) => {
  try {
    // TODO: Add publications and infographics fetching
    // For now, just fetch videos filtered by workstream
    const videosData = await __getUpdatesVideos(key)
    const publicationsData = await __getPublications(key)
    const infographicsData = await __getInfographics(key)
    
    let updatesList = [].concat(videosData, publicationsData, infographicsData)

    if (key !== 'archives') {
      updatesList = updatesList.sort(compare).slice(0, 9) // Only first 9 are shown.
    }

    return updatesList

  } catch (error) {
    console.error('Error fetching updates for workstream:', key, error)
    return []
  }
}

const getWorkstreamSuperProducts = async (superProductList: Array<{id: number, super_products_id: number, sort: number}>) => {
  if (!superProductList || superProductList.length === 0) return []
  
  // Fetch all super products
  const allProducts = await queryCollection('super_products').all()

  if (!allProducts) return []

  // Extract IDs from the superProductList objects
  const superProductIds = superProductList.map(item => item.super_products_id)

  // Filter to only super products in the superProductList
  const filteredProducts = allProducts.filter((sp) => {
    return superProductIds.includes(sp.superProductId)
  })

  // Create a map of super_products_id to sort value for ordering
  const sortMap = new Map(
    superProductList.map(item => [item.super_products_id, item.sort])
  )

  // Spread meta fields back to the top level and add sort value
  const productsWithMeta = filteredProducts.map((sp) => {
    const sortValue = sortMap.get(sp.superProductId) || 999
    if (sp.meta) {
      return {
        ...sp,
        ...sp.meta,
        _sort: sortValue
      }
    }
    return { ...sp, _sort: sortValue }
  })

  // Sort by the sort field from the relation
  return productsWithMeta.sort((a, b) => a._sort - b._sort)
}

const getWorkstreamProducts = async (productList: Array<{id: number, products_id: number, sort: number}>) => {
  if (!productList || productList.length === 0) return []

  // Fetch all products
  const allProducts = await queryCollection('products').all()

  if (!allProducts) return []

  // Extract IDs from the productList objects
  const productIds = productList.map(item => item.products_id)

  // Filter to only products in the productList
  const filteredProducts = allProducts.filter((product) =>
    productIds.includes(product.productId)
  )

  // Create a map of products_id to sort value for ordering
  const sortMap = new Map(
    productList.map(item => [item.products_id, item.sort])
  )

  // Spread meta fields back to the top level and add sort value
  const productsWithMeta = filteredProducts.map((product) => {
    const sortValue = sortMap.get(product.productId) || 999
    if (product.meta) {
      return {
        ...product,
        ...product.meta,
        _sort: sortValue
      }
    }
    return { ...product, _sort: sortValue }
  })

  // Sort by the sort field from the relation
  return productsWithMeta.sort((a, b) => a._sort - b._sort)
}

/**
 * Composable for fetching all workstreams using Directus
 * Returns data in object format keyed by slug for backward compatibility with legacy pages
 * @returns Reactive workstreams data object, loading state, and error state
 */
export const useWorkstreams = (key?: string) => {
    // Use a unique key based on the workstream to avoid caching issues
    const cacheKey = key ? `workstreams-${key}` : 'workstreams-all'
    
    return useAsyncData(cacheKey, async () => {
    const workstreams = await queryCollection('workstreams').all()

      const workstreamsObject: Record<string, any> = {}
      for (const workstream of workstreams) {
        if (workstream.slug) {
          workstreamsObject[workstream.slug] = workstream
        }
      }
    if(key && Object.hasOwn(workstreamsObject, key)) {
      const [spList, pList] = await Promise.all([
        getWorkstreamSuperProducts(workstreamsObject[key].superProducts || []),
        getWorkstreamProducts(workstreamsObject[key].products || [])
      ])

      workstreamsObject[key].superProductsList = spList
      workstreamsObject[key].productsList = [].concat(spList, pList)
      workstreamsObject[key].updatesList = await getWorkstreamUpdates(key)
    }
    
    return workstreamsObject
  })
}

