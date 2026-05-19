/**
 * Composable to detect if an image URL is external
 * and determine whether to use NuxtImg or regular img tag
 */
export const useExternalImage = () => {
  const isExternalImage = (url?: string): boolean => {
    if (!url) return false
    
    // Check if URL starts with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname
        // Consider external if not localhost or same domain
        return !hostname.includes('localhost') && 
               !hostname.includes('127.0.0.1') &&
               !hostname.includes('bfna-site-v2.netlify.app')
      } catch {
        // If URL parsing fails, treat as external if it starts with http
        return true
      }
    }
    
    // Relative URLs are not external
    return false
  }

  /**
   * Detect PNG cover art so it is not force-converted to lossy webp.
   * Mirrors the live Eleventy BF-51 `isPng` branch. Tolerates query
   * strings / fragments on the URL (e.g. raw Directus asset URLs).
   */
  const isPng = (url?: string): boolean => {
    if (!url) return false
    return /\.png(?:[?#]|$)/i.test(url)
  }

  return {
    isExternalImage,
    isPng
  }
}

