const getProducts = async (productList: Array<{id: number, products_id: number, sort: number}>) => {
  if (!productList || productList.length === 0) return []

  // Fetch all products
  const allProducts = await queryCollection('products').all()

  if (!allProducts) return []

    // Extract IDs from the productList objects
  const superProductIds = productList.map(item => item.products_id)

  // Filter to only super products in the productList
  const filteredProducts = allProducts.filter((product) => {
    return superProductIds.includes(product.productId)
  })

  // Create a map of super_products_id to sort value for ordering
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

export const useSuperProduct = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : slug
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: product } = useAsyncData(
    `super-product-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const productData = await queryCollection('super_products')
        .where('slug', '=', currentSlug as string)
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
      
      // Fetch and attach products if exists
      if (transformedProduct.products && transformedProduct.products.length > 0) {
        transformedProduct.products = await getProducts(transformedProduct.products)
      }

      // Fetch and attach people if exists
      // if (transformedProduct.people && transformedProduct.people.length > 0) {
      //   transformedProduct.people = [].concat(transformedProduct.internalAuthors, transformedProduct.externalCollaborators)
      // }
      
      return transformedProduct
    },
    {
      watch: [() => route.path]
    }
  )

  return product
}
