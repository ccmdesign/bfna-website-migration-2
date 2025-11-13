import { useWorkstream } from './useWorkstream'

/**
 * Composable for getting hero image configuration for a theme
 * Falls back to default hero configuration if theme-specific hero is missing
 * @param theme - Optional theme identifier. If omitted, returns default hero config.
 * @returns Hero configuration with webp, fallback, width, height fields
 */
export function useHeroImage(theme?: string) {
  // Fetch default hero config
  const { data: defaultHero, pending: defaultPending } = useAsyncData(
    'hero-default',
    () => import('~/content/data/hero-default.json').then((m) => m.default)
  )

  // Fetch all workstreams to find theme match (only if theme provided)
  const { data: workstreams, pending: workstreamPending } = useWorkstream()

  // Find workstream with matching theme
  const themeWorkstream = computed(() => {
    if (!theme || !workstreams.value) {
      return null
    }

    // Handle both array (all workstreams) and single workstream cases
    const workstreamsArray = Array.isArray(workstreams.value)
      ? workstreams.value
      : [workstreams.value]

    return (
      workstreamsArray.find((ws) => ws.theme === theme) ||
      workstreamsArray.find((ws) => ws.slug === theme) ||
      null
    )
  })

  const config = computed(() => {
    // Try to get hero from theme-specific workstream
    if (themeWorkstream.value?.hero) {
      return {
        webp: themeWorkstream.value.hero.webp,
        fallback: themeWorkstream.value.hero.fallback,
        width: themeWorkstream.value.hero.width,
        height: themeWorkstream.value.hero.height,
        theme: themeWorkstream.value.hero.theme || theme,
      }
    }

    // Fall back to default hero
    if (defaultHero.value) {
      return {
        webp: defaultHero.value.webp,
        fallback: defaultHero.value.fallback,
        width: defaultHero.value.width,
        height: defaultHero.value.height,
        theme: defaultHero.value.theme || 'default',
      }
    }

    // Last resort: return minimal config
    return {
      webp: undefined,
      fallback: undefined,
      width: 1600,
      height: 1067,
      theme: theme || 'default',
    }
  })

  const pending = computed(() => defaultPending.value || workstreamPending.value)

  return {
    config,
    pending,
    error: null,
  }
}

