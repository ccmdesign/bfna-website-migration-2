/**
 * Composable for fetching workstream data using Nuxt Content
 * @param slug - Optional workstream slug. If omitted, returns all workstreams.
 * @returns Reactive workstream data, loading state, and error state
 */
export function useWorkstream(slug?: string) {
  const key = slug ? `workstream-${slug}` : null

  return useAsyncData(key, () => {
    if (slug) {
      // Fetch a single workstream by slug.
      // The path is constructed to match how Nuxt Content resolves content by slug.
      return useAsyncData('workstreams-slug', () => {
        return queryCollection('workstreams').where('combinedSlug', '=', slug).first()
      })

    } else {
      // Fetch all workstreams
      return useAsyncData('workstreams-data', () => {
        return queryCollection('workstreams').all()
      })
      
    }
  })
}

