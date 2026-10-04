export function isSitemapExcluded(path: string): boolean {
  return (
    path.startsWith('/wireframes')
    || path.startsWith('/docs')
    || path === '/search'
  )
}
