/**
 * Composable for managing tab functionality
 * Handles tab switching, aria attributes, and the visual indicator bar positioning
 */
export function useTabs() {
  const initializeTabs = () => {
    if (!import.meta.client) return

    const tabsContainer = document.querySelector('.tabs')
    if (!tabsContainer) return

    const tabItems = tabsContainer.querySelectorAll('.tabs__item')
    const tabPanels = tabsContainer.querySelectorAll('.tabs__panel')
    const tabBar = tabsContainer.querySelector('.tabs__bar') as HTMLElement

    if (!tabItems.length || !tabPanels.length || !tabBar) return

    // Get the active tab from URL hash or default to first tab
    const getActiveTabFromHash = () => {
      const hash = window.location.hash.slice(1) // Remove #
      if (hash) {
        const matchingTab = Array.from(tabItems).find(
          (item) => item.getAttribute('href') === `#${hash}`
        )
        if (matchingTab) return matchingTab as HTMLElement
      }
      return tabItems[0] as HTMLElement
    }

    // Update tab bar position and width to match active tab
    const updateTabBar = (activeTab: HTMLElement) => {
      if (!activeTab) return

      // Get computed styles to extract padding
      const computedStyle = window.getComputedStyle(activeTab)
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0

      // Get the bounding rectangles to calculate position relative to the tabs container
      // The tabs__bar is positioned absolute within .tabs, so use .tabs as reference
      const tabsContainerRect = (tabsContainer as HTMLElement).getBoundingClientRect()
      const activeTabRect = activeTab.getBoundingClientRect()

      // Calculate position starting from the tab item position plus its padding
      // This ensures the bar starts exactly where the text starts
      const offsetLeft = (activeTabRect.left - tabsContainerRect.left) + paddingLeft
      
      // Width should be the tab width minus both paddings (just the text area)
      const width = activeTabRect.width - paddingLeft - paddingRight

      tabBar.style.width = `${width}px`
      tabBar.style.left = `${offsetLeft}px`
      tabBar.style.transition = 'left 0.3s ease, width 0.3s ease'
    }

    // Set active tab and show corresponding panel
    const setActiveTab = (activeTab: HTMLElement) => {
      const targetHash = activeTab.getAttribute('href')
      if (!targetHash) return

      // Update tab items
      tabItems.forEach((item) => {
        if (item === activeTab) {
          item.setAttribute('aria-selected', 'true')
          item.closest('.tabs__label')?.classList.add('active')
        } else {
          item.removeAttribute('aria-selected')
          item.closest('.tabs__label')?.classList.remove('active')
        }
      })

      // Update panels
      tabPanels.forEach((panel) => {
        if (panel.id === targetHash.slice(1)) {
          panel.removeAttribute('hidden')
          panel.classList.add('active')
        } else {
          panel.setAttribute('hidden', '')
          panel.classList.remove('active')
        }
      })

      // Update tab bar position
      updateTabBar(activeTab)
    }

    // Handle tab clicks
    const handleTabClick = (e: Event) => {
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      setActiveTab(target)
      
      // Update URL hash without scrolling
      const href = target.getAttribute('href')
      if (href) {
        history.pushState(null, '', href)
      }
    }

    // Add click listeners to all tabs
    tabItems.forEach((item) => {
      item.addEventListener('click', handleTabClick)
    })

    // Initialize on mount with proper timing
    const activeTab = getActiveTabFromHash()
    
    // Initial render without transition
    tabBar.style.transition = 'none'
    setActiveTab(activeTab)
    
    // Use requestAnimationFrame to ensure DOM is painted, then recalculate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Re-enable transitions after initial positioning
        tabBar.style.transition = 'left 0.3s ease, width 0.3s ease'
        updateTabBar(activeTab)
        
        // Additional recalculation after fonts load
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            updateTabBar(activeTab)
          })
        }
      })
    })

    // Handle browser back/forward
    const handleHashChange = () => {
      const activeTab = getActiveTabFromHash()
      setActiveTab(activeTab)
    }
    window.addEventListener('hashchange', handleHashChange)

    // Handle window resize to reposition bar
    const handleResize = () => {
      const currentActive = tabsContainer.querySelector('.tabs__item[aria-selected="true"]') as HTMLElement
      if (currentActive) {
        updateTabBar(currentActive)
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup function
    return () => {
      tabItems.forEach((item) => {
        item.removeEventListener('click', handleTabClick)
      })
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('resize', handleResize)
    }
  }

  return {
    initializeTabs,
  }
}
