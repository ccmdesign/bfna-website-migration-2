export const useInfographic = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: infographic } = useAsyncData(
    `infographic-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const infographicData = await queryCollection('infographics')
        .where('slug', '=', currentSlug as string)
        .first()
      
      if (!infographicData) return null
      
      // Spread meta fields back to the top level
      let transformedInfographic = infographicData
      if (infographicData.meta) {
        transformedInfographic = {
          ...infographicData,
          ...infographicData.meta,
        }
      }
      
      return transformedInfographic
    },
    {
      watch: [() => route.path]
    }
  )

  return infographic
}
