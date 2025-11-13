/**
 * Third-party integration failure handling composable
 * Handles graceful degradation for Embedly and Twitter widgets
 * Per FR-019: Hide failed integrations silently without breaking page layout
 */

export const useThirdPartyIntegrations = () => {
  const isEmbedlyLoaded = ref(false)
  const isTwitterLoaded = ref(false)
  const embedlyError = ref(false)
  const twitterError = ref(false)

  /**
   * Initialize Embedly platform loader with error handling
   */
  const initEmbedly = () => {
    if (typeof window === 'undefined') return

    // Check if Embedly is already loaded
    if ((window as any).embedly) {
      isEmbedlyLoaded.value = true
      return
    }

    // Check if Embedly cards exist on page
    const embedlySelector = '.embedly-card, [data-card-type="embedly"]'
    if (!document.querySelector(embedlySelector)) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.embedly.com/widgets/platform.js'
    script.async = true
    script.charset = 'UTF-8'

    // Handle successful load
    script.onload = () => {
      isEmbedlyLoaded.value = true
    }

    // Handle load error - hide failed integrations silently
    script.onerror = () => {
      embedlyError.value = true
      // Hide Embedly containers without breaking layout
      const embedlyCards = document.querySelectorAll(embedlySelector)
      embedlyCards.forEach((card) => {
        const element = card as HTMLElement
        element.style.display = 'none'
      })
    }

    document.body.appendChild(script)
  }

  /**
   * Initialize Twitter widgets with error handling
   */
  const initTwitter = () => {
    if (typeof window === 'undefined') return

    // Check if Twitter widgets script is already loaded
    if (document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
      isTwitterLoaded.value = true
      return
    }

    // Check if Twitter widgets exist on page
    const twitterSelectors = [
      '.twitter-timeline',
      '.twitter-tweet',
      '[data-twitter-id]',
      '#tweets'
    ]
    const hasTwitterContent = twitterSelectors.some(selector => 
      document.querySelector(selector)
    )

    if (!hasTwitterContent) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.charset = 'utf-8'

    // Handle successful load
    script.onload = () => {
      isTwitterLoaded.value = true
    }

    // Handle load error - hide failed integrations silently
    script.onerror = () => {
      twitterError.value = true
      // Hide Twitter containers without breaking layout
      const twitterContainers = document.querySelectorAll(twitterSelectors.join(', '))
      twitterContainers.forEach((container) => {
        const element = container as HTMLElement
        element.style.display = 'none'
      })
    }

    document.body.appendChild(script)
  }

  /**
   * Initialize all third-party integrations
   */
  const initIntegrations = () => {
    if (typeof window === 'undefined') return

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initEmbedly()
        initTwitter()
      })
    } else {
      initEmbedly()
      initTwitter()
    }
  }

  /**
   * Watch for dynamically added Embedly/Twitter content
   */
  const watchForDynamicContent = () => {
    if (typeof window === 'undefined') return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            // Check for Embedly content
            if (element.querySelector?.('.embedly-card, [data-card-type="embedly"]')) {
              if (!isEmbedlyLoaded.value && !embedlyError.value) {
                initEmbedly()
              }
            }
            // Check for Twitter content
            if (element.querySelector?.('.twitter-timeline, .twitter-tweet, [data-twitter-id]')) {
              if (!isTwitterLoaded.value && !twitterError.value) {
                initTwitter()
              }
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }

  onMounted(() => {
    initIntegrations()
    watchForDynamicContent()
  })

  return {
    isEmbedlyLoaded: readonly(isEmbedlyLoaded),
    isTwitterLoaded: readonly(isTwitterLoaded),
    embedlyError: readonly(embedlyError),
    twitterError: readonly(twitterError),
    initEmbedly,
    initTwitter,
    initIntegrations
  }
}

