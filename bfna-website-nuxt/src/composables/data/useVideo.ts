export const useVideo = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: video } = useAsyncData(
    `video-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const videoData = await queryCollection('videos')
        .where('slug', '=', currentSlug as string)
        .first()
      
      if (!videoData) return null
      
      // Spread meta fields back to the top level
      let transformedVideo = videoData
      if (videoData.meta) {
        transformedVideo = {
          ...videoData,
          ...videoData.meta,
        }
      }
      
      return transformedVideo
    },
    {
      watch: [() => route.path]
    }
  )

  return video
}
