

/**
 * Composable for fetching all workstreams using Directus
 * Returns data in object format keyed by slug for backward compatibility with legacy pages
 * @returns Reactive workstreams data object, loading state, and error state
 */
export const useWorkstreams = () => {
  return useAsyncData('workstreams', () => {
    return queryCollection('workstreams').all()
      .then(workstreams => {
        const workstreamsObject: Record<string, any> = {}
        for (const workstream of workstreams) {
          if (workstream.slug) {
            workstreamsObject[workstream.slug] = workstream
          }
        }
        return workstreamsObject
      })
  })
}

