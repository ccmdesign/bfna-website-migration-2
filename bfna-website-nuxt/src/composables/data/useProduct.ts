export const useProduct = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined
  }

  const { data: product } = useAsyncData('slug-product', async () => {
    const productData = await queryCollection('products')
      .where('slug', '=', getSlug() as string)
      .first()
    
    if (!productData) return null
    
    // Spread meta fields back to the top level
    let transformedProduct = productData
    if (productData.meta) {
      transformedProduct = {
        ...productData,
        ...productData.meta,
      }
    }
    
    // Fetch and attach people if exists
    if (transformedProduct.people && transformedProduct.people.length > 0) {
      transformedProduct.people = [].concat(transformedProduct.internalAuthors, transformedProduct.externalCollaborators)
    }
    
    return transformedProduct
  })

  return product
}
