export type Order = 'asc' | 'desc'

export type WhereClause =
  | Record<string, unknown>
  | ((doc: Record<string, unknown>) => boolean)

export interface ContentStreamOptions {
  where?: WhereClause
  sort?: { by: string; order?: Order } | Array<{ by: string; order?: Order }>
  select?: string[]
  limit?: number
  includeDrafts?: boolean
  key?: string
}

export type SortPreset = 'recency' | 'abc' | 'alphabetical'

// Nuxt Content auto-imports these, declare for TS/ESLint awareness
declare const queryContent: (path?: string) => any
declare const queryCollection: (name: string) => any

function pick<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
  const result: Partial<T> = {}
  for (const key of keys) {
    if (key in obj) (result as any)[key] = (obj as any)[key]
  }
  return result
}

function getProp(obj: unknown, path: string) {
  return path.split('.').reduce<any>((acc, key) => (acc == undefined ? acc : (acc as any)[key]), obj as any)
}

function matchesWhere(doc: Record<string, unknown>, where: WhereClause): boolean {
  if (typeof where === 'function') return !!where(doc)
  for (const [k, v] of Object.entries(where)) {
    if (getProp(doc, k) !== v) return false
  }
  return true
}

function sortDocs(docs: any[], sort?: ContentStreamOptions['sort']) {
  if (!sort) return docs
  const sorts = Array.isArray(sort) ? sort : [sort]
  return [...docs].sort((a, b) => {
    for (const s of sorts) {
      const direction = (s.order ?? 'asc') === 'asc' ? 1 : -1
      const av = getProp(a, s.by)
      const bv = getProp(b, s.by)
      if (av == undefined && bv == undefined) continue
      if (av == undefined) return 1
      if (bv == undefined) return -1
      if (av < bv) return -1 * direction
      if (av > bv) return 1 * direction
    }
    return 0
  })
}

/**
 * Unified content stream composable for Nuxt Content.
 * - Pass a collection name like 'blog' to use queryCollection().
 * - Pass a path like '/blog' to use queryContent().
 */
export function useContentStream(source: string, optionsOrPreset: ContentStreamOptions | SortPreset = {}) {
  const options: ContentStreamOptions = typeof optionsOrPreset === 'string'
    ? presetToOptions(optionsOrPreset)
    : optionsOrPreset
  const key = options.key ?? `content:${source}:${JSON.stringify({ ...options, key: undefined })}`

  const { data, pending, error } = useAsyncData(key, async () => {
    const isPath = source.startsWith('/')

    // queryCollection/queryContent are auto-imported by @nuxt/content
    let docs: any[] = isPath
      ? await queryContent(source).find()
      : await queryCollection(source as any).all()

    if (!options.includeDrafts) {
      docs = docs.filter(d => d.published !== false)
    }

    if (options.where) docs = docs.filter(d => matchesWhere(d, options.where as WhereClause))
    if (options.sort) docs = sortDocs(docs, options.sort)
    if (options.select?.length) docs = docs.map(d => pick(d, options.select as string[]))
    if (options.limit && options.limit > 0) docs = docs.slice(0, options.limit)

    return docs
  })

  return { data, pending, error }
}

// Sugar alias with a name that reads well in pages
export const getContent = useContentStream

function presetToOptions(preset: SortPreset): ContentStreamOptions {
  switch (preset) {
    case 'recency':
      return { sort: { by: 'date', order: 'desc' } }
    case 'abc':
    case 'alphabetical':
      return { sort: { by: 'title', order: 'asc' } }
    default:
      return {}
  }
}

// Data-only alias for simpler usage: const blog = content('blog', 'recency')
export function content(source: string, optionsOrPreset: ContentStreamOptions | SortPreset = {}) {
  return useContentStream(source, optionsOrPreset).data
}


