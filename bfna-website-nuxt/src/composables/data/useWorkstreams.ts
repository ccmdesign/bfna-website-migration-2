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



const getWorkstreamSuperProducts = async (superProductList: number[]) => {
  if (!superProductList || superProductList.length === 0) return []
  // Fetch all people and filter by IDs in memory
  // This is efficient for small datasets and avoids potential query builder issues
  const allProducts = await queryCollection('super_products').order('superProductId', 'DESC').all()

  if (!allProducts) return []

  // Filter to only people in the superProductList
  const filteredPeople = allProducts.filter((sp) => {
    return superProductList.includes(sp.superProductId)
  })

  // Spread meta fields back to the top level
  return filteredPeople.map((sp) => {
    if (sp.meta) {
      return {
        ...sp,
        ...sp.meta,
      }
    }
    return sp
  })
}

const getWorkstreamProducts = async (productList: number[]) => {
  if (!productList || productList.length === 0) return []

  // Fetch all products and filter by IDs in memory
  // This is efficient for small datasets and avoids potential query builder issues
  const allProducts = await queryCollection('products').all()

  if (!allProducts) return []

  // Filter to only products in the productList
  const filteredProducts = allProducts.filter((product) =>
    productList.includes(product.productId)
  )

  // Spread meta fields back to the top level
  return filteredProducts.map((product) => {
    if (product.meta) {
      return {
        ...product,
        ...product.meta,
      }
    }
    return product
  })
}

/**
 * Composable for fetching all workstreams using Directus
 * Returns data in object format keyed by slug for backward compatibility with legacy pages
 * @returns Reactive workstreams data object, loading state, and error state
 */
export const useWorkstreams = (key?: string) => {
    return useAsyncData('workstreams', async () => {
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

