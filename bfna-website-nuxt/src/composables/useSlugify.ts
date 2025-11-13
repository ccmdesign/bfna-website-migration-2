/**
 * Composable for slugifying text
 * Converts text to URL-friendly slugs by:
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing non-word characters except hyphens
 * - Collapsing multiple hyphens
 * - Trimming leading/trailing hyphens
 */
export function useSlugify() {
  const slugify = (text: string | undefined | null): string => {
    return String(text || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  return { slugify }
}
