/**
 * Normalize URL from legacy format to Nuxt route format
 * Handles URL mapping for search index generation
 */
export function normalizeUrl(buttonUrl: string | null | undefined): string {
  if (!buttonUrl) return ''
  
  // Remove leading/trailing slashes for consistency
  let url = buttonUrl.trim()
  url = url.replace(/^\/+/, '').replace(/\/+$/, '')
  
  // Ensure URL starts with /
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  
  // Handle legacy URL patterns that might need normalization
  // The catch-all route [...slug].vue handles most URL mapping
  // This function just ensures consistent format
  
  return url
}

