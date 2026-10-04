export const normalizeSiteOrigin = (value: string): string => value.replace(/\/+$/, '')

export const canonicalUrl = (origin: string, path: string): string => {
  const cleanPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`
  return new URL(cleanPath, `${normalizeSiteOrigin(origin)}/`).toString()
}

export const absoluteAssetUrl = (origin: string, value?: string): string =>
  value ? new URL(value, `${normalizeSiteOrigin(origin)}/`).toString() : canonicalUrl(origin, '/images/bfna-og.jpg')
