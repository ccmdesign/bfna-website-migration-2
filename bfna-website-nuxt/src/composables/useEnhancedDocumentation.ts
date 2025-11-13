import { computed, ref } from 'vue'

/**
 * Composable for enhanced documentation pages
 * Provides content fetching and state management for hybrid documentation
 */
export const useEnhancedDocumentation = async (options: {
  contentSlug?: string
  contentType?: string
  autoFetch?: boolean
} = {}) => {
  const route = useRoute()
  const {
    contentSlug,
    contentType = 'docs',
    autoFetch = true
  } = options

  // Fetch content
  const { data: doc, error, pending } = await useAsyncData(
    `enhanced-doc-${contentSlug || route.path}`,
    () => {
      const slug = contentSlug || route.path.split('/').pop()
      if (!slug) return null
      
      return queryCollection(contentType).path(`/${contentType}/${slug}`).first()
    },
    { 
      lazy: !autoFetch,
      server: true 
    }
  )

  // Fetch related content
  const { data: relatedDocs } = await useAsyncData(
    `enhanced-docs-related-${contentType}`,
    () => {
      if (!doc.value?.category) return []
      return queryCollection(contentType)
        .where('category', '=', doc.value.category)
        .limit(5)
        .all()
    }
  )

  // Computed properties
  const title = computed(() => doc.value?.title || 'Documentation')
  const description = computed(() => doc.value?.description || '')
  const status = computed(() => doc.value?.status || 'Draft')
  const category = computed(() => doc.value?.category || 'General')
  const priority = computed(() => doc.value?.priority || 'Normal')
  const published = computed(() => doc.value?.published ?? true)

  // Hero configuration
  const heroConfig = computed(() => ({
    brow: doc.value?.hero?.brow || category.value,
    title: doc.value?.hero?.title || title.value,
    tagline: doc.value?.hero?.tagline || description.value,
    backgroundColor: doc.value?.hero?.backgroundColor || 'color-primary-tint-20',
    size: doc.value?.hero?.size || 'l',
    hideTopbar: doc.value?.hero?.hideTopbar || false
  }))

  // Navigation paths
  const docsPath = computed(() => {
    if (!doc.value) return null
    return `/${contentType}/${contentSlug || route.path.split('/').pop()}`
  })

  const demoPath = computed(() => {
    if (!doc.value) return null
    const slug = contentSlug || route.path.split('/').pop()
    return `/docs/${slug}`
  })

  // Status helpers
  const statusColor = computed(() => {
    const colors = {
      'To Do': 'warning',
      'Draft': 'neutral',
      'MVP': 'info', 
      'Ready': 'success',
      'Implemented': 'success'
    }
    return colors[status.value] || 'neutral'
  })

  const priorityColor = computed(() => {
    const colors = {
      'High': 'error',
      'Normal': 'warning',
      'Low': 'info'
    }
    return colors[priority.value] || 'neutral'
  })

  const categoryColor = computed(() => {
    const colors = {
      'Content Display': 'info',
      'Navigation': 'primary',
      'Forms': 'warning',
      'Layout': 'neutral',
      'Interactive': 'success',
      'General': 'neutral'
    }
    return colors[category.value] || 'neutral'
  })

  // Related content (excluding current)
  const relatedContent = computed(() => {
    if (!relatedDocs.value) return []
    return relatedDocs.value.filter(item => item.path !== doc.value?.path)
  })

  // Table of contents (extracted from headings)
  const tableOfContents = computed(() => {
    if (!doc.value) return []
    
    // This would extract headings from the content
    // For now, return empty array
    return []
  })

  return {
    // Content data
    doc,
    error,
    pending,
    
    // Computed properties
    title,
    description,
    status,
    category,
    priority,
    published,
    
    // Configuration
    heroConfig,
    docsPath,
    demoPath,
    
    // Helpers
    statusColor,
    priorityColor,
    categoryColor,
    
    // Related content
    relatedDocs,
    relatedContent,
    tableOfContents
  }
}

/**
 * Composable for managing interactive demo state
 */
export const useDemoState = (initialState) => {
  const state = ref(initialState)
  const history = ref([initialState])
  const historyIndex = ref(0)

  const updateState = (newState) => {
    state.value = newState
    
    // Add to history (limit to 50 items)
    if (historyIndex.value < history.value.length - 1) {
      // Truncate if we're not at the end
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(newState)
    historyIndex.value = history.value.length - 1
    
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  const resetState = () => {
    updateState(initialState)
  }

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      state.value = history.value[historyIndex.value]
    }
  }

  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      state.value = history.value[historyIndex.value]
    }
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  return {
    state: readonly(state),
    history: readonly(history),
    historyIndex: readonly(historyIndex),
    updateState,
    resetState,
    undo,
    redo,
    canUndo,
    canRedo
  }
}

/**
 * Composable for managing page sections and navigation
 */
export const usePageNavigation = () => {
  const sections = ref<Array<{ id: string; title: string; level: number }>>([])
  const activeSection = ref<string>('')

  // Extract sections from content
  const extractSections = (content: any) => {
    if (!content) return
    
    const extracted: Array<{ id: string; title: string; level: number }> = []
    
    // This would parse the content and extract headings
    // For now, return empty array
    
    sections.value = extracted
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      activeSection.value = sectionId
    }
  }

  // Update active section on scroll
  const updateActiveSection = () => {
    const scrollPosition = window.scrollY + 100
    
    for (const section of sections.value) {
      const element = document.getElementById(section.id)
      if (element) {
        const { offsetTop, offsetHeight } = element
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          activeSection.value = section.id
          break
        }
      }
    }
  }

  // Set up scroll listener
  onMounted(() => {
    window.addEventListener('scroll', updateActiveSection)
    updateActiveSection()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', updateActiveSection)
  })

  return {
    sections: readonly(sections),
    activeSection: readonly(activeSection),
    extractSections,
    scrollToSection,
    updateActiveSection
  }
}
