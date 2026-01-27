export const usePodcast = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : slug
  }

  const fetchPodcast = async () => {
    const currentSlug = getSlug()
    
    console.log(1111, currentSlug)
    if (!currentSlug) return null
    
    
    const podcastData = await queryCollection('products')
      .where("slug", "=", currentSlug as string)
      .first()
    
    console.log(2222, podcastData)
    
    if (!podcastData) return null
    
    // Spread meta fields back to the top level
    let transformedPodcast = podcastData
    if (podcastData.meta) {
      transformedPodcast = {
        ...podcastData,
        ...podcastData.meta,
      }
    }
    
    return transformedPodcast
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: podcast } = useAsyncData(`podcast-${route.path}`, fetchPodcast)

  return podcast
}
