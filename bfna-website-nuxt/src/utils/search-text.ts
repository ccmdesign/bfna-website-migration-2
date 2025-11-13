/**
 * Clean excerpt text by removing newlines and normalizing spaces
 * Matches legacy clean filter behavior exactly
 */
export function cleanExcerpt(text: string): string {
  if (!text) return ''
  
  let content = String(text)
  
  // Remove newlines
  content = content.replace(/\n/g, '')
  
  // Remove repeated spaces
  content = content.replace(/[ ]{2,}/g, ' ')
  
  return content.trim()
}

/**
 * Generate searchable text by combining fields, stripping HTML, lowercasing, and deduplicating words
 * Matches legacy squash filter behavior exactly
 */
export function squashSearchText(
  brow: string,
  heading: string,
  subheading: string | null,
  content: string,
  by_line: string | null
): string {
  // Combine fields with spaces
  const combined = [
    brow || '',
    heading || '',
    subheading || '',
    content || '',
    by_line || ''
  ].join(' ')
  
  if (!combined.trim()) return ''
  
  // Convert to lowercase
  let text = combined.toLowerCase()
  
  // Remove HTML tags (legacy uses &lt; and &gt; entities)
  // First decode HTML entities, then remove tags
  const htmlTagRegex = /(&lt;.*?&gt;)/gi
  let plain = text.replace(htmlTagRegex, '')
  
  // Decode HTML entities (unescape)
  // Note: In Node.js, we can use decodeURIComponent or a simple approach
  // Legacy uses unescape() which handles %-encoded entities
  plain = plain.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  plain = plain.replace(/&amp;/g, '&')
  plain = plain.replace(/&quot;/g, '"')
  plain = plain.replace(/&#39;/g, "'")
  
  // Remove HTML tags (now that we've decoded entities)
  plain = plain.replace(/<[^>]*>/g, '')
  
  // Split by space and deduplicate words
  const words = plain.split(' ').filter(word => word.length > 0)
  const deduped = [...new Set(words)]
  const dedupedStr = deduped.join(' ')
  
  // Remove punctuation and newlines
  let result = dedupedStr.replace(/\.|\,|\?|\n/g, '')
  
  // Remove repeated spaces
  result = result.replace(/[ ]{2,}/g, ' ')
  
  return result.trim()
}

