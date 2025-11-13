export interface ContentItemOptions {
  slug?: string
  path?: string
  pathBase?: string
  select?: string[]
  includeDrafts?: boolean
  key?: string
}

function pick<T extends Record<string, unknown>>(obj: T | null | undefined, keys: string[]): Partial<T> | null {
  if (!obj) return null
  const result: Partial<T> = {}
  for (const key of keys) {
    if (key in obj) (result as any)[key] = (obj as any)[key]
  }
  return result
}

/**
 * Fetch a single content item by slug or path.
 * - source: collection name (e.g. 'blog') or base path (e.g. '/blog') or a full path (e.g. '/blog/my-post')
 */
export function useContentItem(source: string, options: ContentItemOptions = {}) {
  let computedPath = options.path
  if (!computedPath) {
    if (options.slug) {
      if (source.startsWith('/')) {
        computedPath = `${source.replace(/\/$/, '')}/${options.slug.replace(/^\//, '')}`
      } else {
        const base = (options.pathBase ?? `/${source}`).replace(/\/$/, '')
        computedPath = `${base}/${options.slug.replace(/^\//, '')}`
      }
    } else if (source.startsWith('/')) {
      // Allow passing a full path as the source
      computedPath = source
    }
  }

  const key = options.key ?? `content:one:${source}:${computedPath ?? JSON.stringify({ slug: options.slug })}`

  const { data, pending, error } = useAsyncData(key, async () => {
    let doc: any | null = null

    if (!computedPath) {
      throw new Error('useContentItem requires a slug or a path')
    }

    if (source.startsWith('/')) {
      // Path-based fetch using queryContent
      doc = await queryContent(computedPath!).findOne()
    } else {
      // Collection-based fetch using queryCollection
      doc = await queryCollection(source as any).path(computedPath!).first()
    }

    if (!options.includeDrafts && doc && doc.published === false) {
      return null
    }

    if (options.select?.length) {
      return pick(doc, options.select)
    }

    return doc
  })

  return { data, pending, error }
}

// Sugar alias that mirrors the stream helper naming
export const getContentOne = useContentItem

// Data-only alias: const post = contentOne('blog', { slug })
export function contentOne(source: string, options: ContentItemOptions = {}) {
  return useContentItem(source, options).data
}


